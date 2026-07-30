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
        
        self.use_postgres = bool(settings.POSTGRES_SERVER)
        if self.use_postgres:
            conn_string = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
            self.pool = ConnectionPool(conninfo=conn_string, max_size=10)
        else:
            from langgraph.checkpoint.memory import MemorySaver
            self.memory_saver = MemorySaver()
            
        self.task_service = TaskService()
        
    from contextlib import contextmanager

    @contextmanager
    def _get_checkpointer(self):
        if self.use_postgres:
            with PostgresSaver(self.pool) as checkpointer:
                checkpointer.setup()
                yield checkpointer
        else:
            yield self.memory_saver

    def _get_config(self) -> dict:
        return {"configurable": {"thread_id": self.thread_id}}
        
    def start(self, initial_instruction: str) -> dict:
        initial_state = {
            "business_id": self.business_id,
            "task_id": self.task_id,
            "messages": [HumanMessage(content=initial_instruction)],
            "next": "supervisor",
            "step_count": 0,
            "status": "running"
        }
        
        # Mark the main task as running in the DB
        self.task_service.update_task_status(self.task_id, "running")
        
        try:
            with self._get_checkpointer() as checkpointer:
                app = self.graph.compile(checkpointer=checkpointer)
                result = app.invoke(initial_state, config=self._get_config())
                
                if result.get("status") == "completed":
                    self.task_service.complete_task(self.task_id)
                elif result.get("status") == "failed":
                    self.task_service.fail_task(self.task_id)
                    
                return result
        except Exception as e:
            import traceback
            error_msg = f"FATAL ERROR: {str(e)}\n{traceback.format_exc()}"
            self.task_service.update_task_result(self.task_id, error_msg)
            self.task_service.fail_task(self.task_id)
            return {"status": "failed", "error": str(e)}

    def pause(self):
        with self._get_checkpointer() as checkpointer:
            app = self.graph.compile(checkpointer=checkpointer)
            config = self._get_config()
            state = app.get_state(config)
            
            if state.values:
                app.update_state(config, {"status": "paused"})
                return True
        return False

    def kill(self):
        with self._get_checkpointer() as checkpointer:
            app = self.graph.compile(checkpointer=checkpointer)
            config = self._get_config()
            state = app.get_state(config)
            
            if state.values:
                app.update_state(config, {"status": "killed"})
                self.task_service.update_task_status(self.task_id, "failed")
                return True
        return False

    def resume(self, additional_instruction: Optional[str] = None):
        with self._get_checkpointer() as checkpointer:
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
        with self._get_checkpointer() as checkpointer:
            app = self.graph.compile(checkpointer=checkpointer)
            config = self._get_config()
            
            state = app.get_state(config)
            if not state.values:
                raise ValueError("Thread state not found.")
                
            app.update_state(config, {"messages": [HumanMessage(content=f"[SYSTEM INJECTION]: {instruction}")]})
            return True
