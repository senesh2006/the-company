import asyncio
from typing import Optional, AsyncGenerator
from psycopg_pool import ConnectionPool
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import HumanMessage
from app.core.config import settings
from app.agents.graph import create_agent_graph

class AgentRunner:
    def __init__(self, business_id: str, agent_id: str, task_id: str, role: str = "assistant"):
        self.business_id = business_id
        self.agent_id = agent_id
        self.task_id = task_id
        self.role = role
        self.thread_id = f"{business_id}:{agent_id}:{task_id}"
        
        self.graph = create_agent_graph(self.business_id, self.role)
        
        # We need a psycopg connection pool for the PostgresSaver
        # In a real app, this pool should be global and passed in to avoid reconnects
        if not settings.POSTGRES_SERVER:
            raise ValueError("PostgreSQL configuration missing.")
            
        conn_string = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
        self.pool = ConnectionPool(
            conninfo=conn_string,
            max_size=10,
        )
        
    def _get_config(self) -> dict:
        return {"configurable": {"thread_id": self.thread_id}}
        
    def start(self, initial_instruction: str) -> dict:
        """
        Starts a new agent run with the initial instruction.
        """
        initial_state = {
            "business_id": self.business_id,
            "agent_id": self.agent_id,
            "task_id": self.task_id,
            "messages": [HumanMessage(content=initial_instruction)],
            "plan": "",
            "step_count": 0,
            "status": "running"
        }
        
        with PostgresSaver(self.pool) as checkpointer:
            checkpointer.setup() # Ensures checkpoint tables exist
            app = self.graph.compile(checkpointer=checkpointer)
            
            # Run until the graph ends or hits a breakpoint
            result = app.invoke(initial_state, config=self._get_config())
            return result

    def pause(self):
        """
        Pauses an agent run by updating its state status in the checkpointer.
        The actual execution loop checks for status='paused' or 'killed'.
        """
        with PostgresSaver(self.pool) as checkpointer:
            app = self.graph.compile(checkpointer=checkpointer)
            config = self._get_config()
            state = app.get_state(config)
            
            if state.values:
                app.update_state(config, {"status": "paused"})
                return True
        return False

    def kill(self):
        """
        Forces an agent run to stop by marking it as killed, and updates
        the task status in Supabase to failed.
        """
        from app.services.task_service import TaskService
        task_service = TaskService()
        
        with PostgresSaver(self.pool) as checkpointer:
            app = self.graph.compile(checkpointer=checkpointer)
            config = self._get_config()
            state = app.get_state(config)
            
            if state.values:
                app.update_state(config, {"status": "killed"})
                task_service.update_task_status(self.task_id, "failed")
                return True
        return False

    def resume(self, additional_instruction: Optional[str] = None):
        """
        Resumes a paused agent run.
        """
        with PostgresSaver(self.pool) as checkpointer:
            app = self.graph.compile(checkpointer=checkpointer)
            config = self._get_config()
            
            state = app.get_state(config)
            if not state.values:
                raise ValueError("Cannot resume: Thread state not found.")
                
            # Switch state back to running
            app.update_state(config, {"status": "running"})
            
            if additional_instruction:
                # Inject a new message into the state
                app.update_state(config, {"messages": [HumanMessage(content=additional_instruction)]})
            
            # Continue execution from the last checkpoint
            result = app.invoke(None, config=config)
            return result
