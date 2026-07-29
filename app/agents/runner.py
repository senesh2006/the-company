import asyncio
from typing import Optional
from psycopg_pool import ConnectionPool
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import HumanMessage
from app.core.config import settings
from app.agents.graph import create_team_graph
from app.services.task_service import TaskService

class TeamRunner:
    def __init__(self, business_id: str, task_id: str):
        self.business_id = business_id
        self.task_id = task_id
        self.thread_id = f"team:{business_id}:{task_id}"
        
        self.graph = create_team_graph(self.business_id, self.task_id)
        
        if not settings.POSTGRES_SERVER:
            raise ValueError("PostgreSQL configuration missing.")
            
        conn_string = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
        self.pool = ConnectionPool(
            conninfo=conn_string,
            max_size=10,
        )
        self.task_service = TaskService()
        
    def _get_config(self) -> dict:
        return {"configurable": {"thread_id": self.thread_id}}
        
    def start(self, initial_instruction: str) -> dict:
        """
        Starts a new team task run with the initial instruction.
        """
        initial_state = {
            "business_id": self.business_id,
            "task_id": self.task_id,
            "messages": [HumanMessage(content=initial_instruction)],
            "next": "supervisor",
            "step_count": 0,
            "status": "running"
        }
        
        with PostgresSaver(self.pool) as checkpointer:
            checkpointer.setup()
            app = self.graph.compile(checkpointer=checkpointer)
            result = app.invoke(initial_state, config=self._get_config())
            
            if result.get("status") == "completed":
                self.task_service.complete_task(self.task_id)
            elif result.get("status") == "failed":
                self.task_service.fail_task(self.task_id)
                
            return result

    def pause(self):
        """
        Pauses a team run by updating its state status in the checkpointer.
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
        Forces a team run to stop by marking it as killed, and updates
        the task status in Supabase to failed.
        """
        with PostgresSaver(self.pool) as checkpointer:
            app = self.graph.compile(checkpointer=checkpointer)
            config = self._get_config()
            state = app.get_state(config)
            
            if state.values:
                app.update_state(config, {"status": "killed"})
                self.task_service.update_task_status(self.task_id, "failed")
                return True
        return False

    def resume(self, additional_instruction: Optional[str] = None):
        """
        Resumes a paused team run.
        """
        with PostgresSaver(self.pool) as checkpointer:
            app = self.graph.compile(checkpointer=checkpointer)
            config = self._get_config()
            
            state = app.get_state(config)
            if not state.values:
                raise ValueError("Cannot resume: Thread state not found.")
                
            app.update_state(config, {"status": "running"})
            
            if additional_instruction:
                app.update_state(config, {"messages": [HumanMessage(content=additional_instruction)]})
            
            result = app.invoke(None, config=config)
            
            if result and result.get("status") == "completed":
                self.task_service.complete_task(self.task_id)
            elif result and result.get("status") == "failed":
                self.task_service.fail_task(self.task_id)
                
            return result

    def inject_instruction(self, instruction: str):
        """
        Injects a new human instruction directly into the state of a running supervisor.
        """
        with PostgresSaver(self.pool) as checkpointer:
            app = self.graph.compile(checkpointer=checkpointer)
            config = self._get_config()
            
            state = app.get_state(config)
            if not state.values:
                raise ValueError("Thread state not found.")
                
            app.update_state(config, {"messages": [HumanMessage(content=f"[SYSTEM INJECTION]: {instruction}")]})
            return True
