import asyncio
import logging
from typing import Optional
try:
    from psycopg_pool import ConnectionPool
    from langgraph.checkpoint.postgres import PostgresSaver
    HAS_POSTGRES = True
except ImportError:
    HAS_POSTGRES = False

from langchain_core.messages import HumanMessage
from app.core.config import settings
from app.agents.graph import create_team_graph
from app.services.task_service import TaskService
from app.agents.state import AgentStatus

class TeamRunner:
    def __init__(self, business_id: str, task_id: str):
        self.logger = logging.getLogger(__name__)
        self.business_id = business_id
        self.task_id = task_id
        self.prompt = None
        self.thread_id = f"team:{business_id}:{task_id}"
        
        self.graph = create_team_graph(self.business_id, self.task_id)
        
        self.use_postgres = bool(settings.POSTGRES_SERVER) and HAS_POSTGRES
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
        agents = self.task_service.list_agents(self.business_id) or []
        has_pa = any("assistant" in a.get("role", "").lower() or "admin" in a.get("role", "").lower() for a in agents)
        if not has_pa:
            pa_agent = {
                "id": "d38bfed5-cfec-5c65-98e1-c85c03ae93ad",
                "name": "Personal Assistant",
                "role": "Personal Assistant",
                "trust_tier": "operate",
                "business_id": self.business_id,
                "model": None
            }
            agents = [pa_agent] + list(agents)

        initial_state = {
            "business_id": self.business_id,
            "task_id": self.task_id,
            "messages": [HumanMessage(content=initial_instruction)],
            "active_agents": {a["id"]: AgentStatus(id=a["id"], role=a["role"], name=a["name"], model=a.get("model")) for a in agents},
            "task_graph": {},
            "shared_context": {},
            "pending_approvals": [],
            "execution_mode": "autonomous",
            "supervisor_thoughts": [],
            "worker_results": [],
            "risk_flags": [],
            "cost_tracker": {},
            "iteration": 0,
            "max_iterations": 20,
            "status": "running",
            "active_sub_orchestrations": {}
        }

        # Store the prompt for later use (e.g. WhatsApp reply)
        self.prompt = initial_instruction

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
                
                # If mandate was from WhatsApp or founder notifications enabled, send result back to WhatsApp
                try:
                    if self.prompt and "[WhatsApp from" in self.prompt:
                        from app.services.shared_memory import SharedMemoryService
                        from app.services.waha_service import waha_service
                        mem = SharedMemoryService()
                        last_active = mem.get(self.business_id, "whatsapp_last_active_user")
                        target_chat = None
                        if last_active and isinstance(last_active.get("value"), dict):
                            target_chat = last_active["value"].get("chat_id")
                        
                        if target_chat:
                            worker_results = result.get("worker_results", [])
                            summary_text = "\n\n".join([f"• *{r.get('agent_role', 'Agent')}*: {r.get('output', '')[:300]}" for r in worker_results[-3:]]) if worker_results else "Task successfully completed by your team."
                            reply_msg = (
                                f"✅ *Task Completed!*\n\n"
                                f"📋 *Mandate*: {self.prompt.split(']:')[-1].strip()}\n\n"
                                f"📝 *Results*:\n{summary_text}"
                            )
                            import asyncio
                            try:
                                loop = asyncio.get_event_loop()
                                if loop.is_running():
                                    import concurrent.futures
                                    with concurrent.futures.ThreadPoolExecutor() as pool:
                                        pool.submit(asyncio.run, waha_service.send_text(chat_id=target_chat, text=reply_msg)).result()
                                else:
                                    loop.run_until_complete(waha_service.send_text(chat_id=target_chat, text=reply_msg))
                            except Exception:
                                pass
                except Exception as notify_err:
                    self.logger.error(f"Failed to send WhatsApp result notification: {notify_err}")

                # Mark all agents back to Idle after completion
                for agent in agents:
                    self.task_service.update_agent_status(agent["id"], "Idle")
                    
                return result
        except Exception as e:
            import traceback
            error_msg = f"FATAL ERROR: {str(e)}\n{traceback.format_exc()}"
            self.task_service.update_task_result(self.task_id, error_msg)
            self.task_service.fail_task(self.task_id)
            # Mark agents back to Idle even on crash (the task failed, not the agents)
            for agent in agents:
                self.task_service.update_agent_status(agent["id"], "Idle")
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
