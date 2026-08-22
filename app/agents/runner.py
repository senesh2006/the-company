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

    def _build_initial_state(self, initial_instruction: str) -> tuple[dict, list]:
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
        return initial_state, agents
        
    def start(self, initial_instruction: str) -> dict:
        initial_state, agents = self._build_initial_state(initial_instruction)

        # Store the prompt for later use (e.g. WhatsApp reply)
        self.prompt = initial_instruction

        # Mark the main task as running in the DB
        self.task_service.update_task_status(self.task_id, "running")
        
        from app.services.task_stream_bus import task_broadcaster
        task_broadcaster.publish_sync(self.task_id, {
            "node": "start",
            "status": "running",
            "content": {"mandate": initial_instruction}
        })
        
        try:
            with self._get_checkpointer() as checkpointer:
                app = self.graph.compile(checkpointer=checkpointer)
                result = app.invoke(initial_state, config=self._get_config())
                
                if result.get("status") == "completed":
                    self.task_service.complete_task(self.task_id)
                elif result.get("status") == "failed":
                    self.task_service.fail_task(self.task_id)
                
                task_broadcaster.publish_sync(self.task_id, {
                    "node": "end",
                    "status": result.get("status", "completed"),
                    "content": {"result": result.get("messages", [])[-1].content if result.get("messages") else ""}
                })
                
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
            task_broadcaster.publish_sync(self.task_id, {
                "node": "end",
                "status": "failed",
                "content": {"error": str(e)}
            })
            # Mark agents back to Idle even on crash (the task failed, not the agents)
            for agent in agents:
                self.task_service.update_agent_status(agent["id"], "Idle")
            return {"status": "failed", "error": str(e)}

    async def stream(self, initial_instruction: str):
        """
        Executes the LangGraph pipeline asynchronously, yielding normalized SSE events
        per node completion and broadcasting them to task_broadcaster.
        """
        initial_state, agents = self._build_initial_state(initial_instruction)
        self.prompt = initial_instruction

        from app.services.task_stream_bus import task_broadcaster

        self.task_service.update_task_status(self.task_id, "running")
        start_event = {
            "node": "start",
            "status": "running",
            "content": {"mandate": initial_instruction}
        }
        await task_broadcaster.publish(self.task_id, start_event)
        yield start_event

        final_status = "completed"
        try:
            with self._get_checkpointer() as checkpointer:
                app = self.graph.compile(checkpointer=checkpointer)
                
                async for update_dict in app.astream(initial_state, config=self._get_config(), stream_mode="updates"):
                    for node_name, node_state in update_dict.items():
                        event = None
                        if node_name == "global_supervisor":
                            thoughts = node_state.get("supervisor_thoughts", [])
                            tasks = node_state.get("task_graph", {})
                            event = {
                                "node": "global_supervisor",
                                "status": "completed",
                                "content": {
                                    "thoughts": thoughts[-1] if thoughts else "",
                                    "new_tasks": [
                                        t.model_dump() if hasattr(t, "model_dump") else t
                                        for t in (tasks.values() if isinstance(tasks, dict) else tasks)
                                    ]
                                }
                            }
                        elif node_name.startswith("worker_"):
                            w_results = node_state.get("worker_results", [])
                            event = {
                                "node": node_name,
                                "status": "completed",
                                "content": {
                                    "results": [
                                        r.model_dump() if hasattr(r, "model_dump") else r
                                        for r in w_results
                                    ]
                                }
                            }
                        elif node_name == "executive_synthesis":
                            msgs = node_state.get("messages", [])
                            last_msg = msgs[-1].content if msgs else ""
                            event = {
                                "node": "executive_synthesis",
                                "status": "completed",
                                "content": {"synthesis": last_msg}
                            }

                        if event:
                            await task_broadcaster.publish(self.task_id, event)
                            yield event

                self.task_service.complete_task(self.task_id)
                end_event = {
                    "node": "end",
                    "status": "completed",
                    "content": {"status": "completed"}
                }
                await task_broadcaster.publish(self.task_id, end_event)
                yield end_event

        except Exception as e:
            import traceback
            error_msg = f"FATAL ERROR: {str(e)}\n{traceback.format_exc()}"
            self.task_service.update_task_result(self.task_id, error_msg)
            self.task_service.fail_task(self.task_id)
            err_event = {
                "node": "end",
                "status": "failed",
                "content": {"error": str(e)}
            }
            await task_broadcaster.publish(self.task_id, err_event)
            yield err_event
        finally:
            for agent in agents:
                try:
                    self.task_service.update_agent_status(agent["id"], "Idle")
                except Exception:
                    pass

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
