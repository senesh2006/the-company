import json
import logging
import threading
import time
import psycopg
from app.core.config import settings
from app.services.task_service import TaskService
from app.agents.runner import TeamRunner

logger = logging.getLogger(__name__)

def listen_to_memory_events():
    """
    Background daemon that listens for Postgres LISTEN/NOTIFY events.
    """
    if not settings.POSTGRES_SERVER or not settings.POSTGRES_DB:
        logger.info("PostgreSQL configuration not present. Event bus will operate in local in-memory mode.")
        return
        
    conn_string = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    
    try:
        task_service = TaskService()
        
        with psycopg.connect(conn_string, autocommit=True) as conn:
            conn.execute("LISTEN memory_events")
            logger.info("Event Bus: Listening to 'memory_events'...")
            
            gen = conn.notifies()
            for notify in gen:
                try:
                    payload = json.loads(notify.payload)
                    business_id = payload.get("business_id")
                    key = payload.get("key")
                    value = payload.get("value")
                    
                    if not business_id or not key:
                        continue
                        
                    logger.info(f"Event Bus: Shared Memory updated - {key}={value}")
                    
                    # Find active task for business
                    active_task = task_service.get_active_task_for_business(business_id)
                    if active_task:
                        runner = TeamRunner(business_id, active_task["id"])
                        msg = f"Shared Memory key '{key}' was updated to '{value}'. Please review and delegate to the relevant agents (e.g. Accountant, Social) if necessary."
                        runner.inject_instruction(msg)
                        logger.info(f"Event Bus: Injected notification for '{key}' into TeamRunner.")
                except Exception as e:
                    logger.error(f"Event Bus error processing notification: {e}")
    except Exception as e:
        logger.error(f"Event Bus connection failed: {e}")

def process_queued_tasks_daemon():
    """
    Background daemon that continuously checks for any tasks stuck in 'queued' or 'pending' status
    and automatically dispatches them to TeamRunner.
    """
    logger.info("Task Queue Dispatcher Daemon started.")
    task_service = TaskService()
    
    while True:
        try:
            time.sleep(5)
            # Check for queued tasks in Supabase or memory
            if settings.SUPABASE_URL and settings.SUPABASE_KEY:
                try:
                    resp = task_service.client.table("tasks").select("*").in_("status", ["queued", "pending"]).execute()
                    tasks = resp.data or []
                    for t in tasks:
                        task_id = t["id"]
                        biz_id = t.get("business_id", "default-business-id")
                        desc = t.get("description") or t.get("mandate") or "Execute mandate"
                        
                        logger.info(f"Task Queue Dispatcher: Found queued task '{task_id}'. Dispatching to TeamRunner...")
                        # Mark as running
                        task_service.update_task_status(task_id, "running")
                        
                        def run_bg(b_id, t_id, d):
                            try:
                                runner = TeamRunner(b_id, t_id)
                                runner.start(d)
                            except Exception as ex:
                                logger.error(f"Execution error for task {t_id}: {ex}")
                                task_service.fail_task(t_id)

                        t_thread = threading.Thread(target=run_bg, args=(biz_id, task_id, desc), daemon=True)
                        t_thread.start()
                except Exception as sb_err:
                    logger.debug(f"Queue poll error: {sb_err}")
        except Exception as e:
            logger.error(f"Error in task queue dispatcher loop: {e}")

def start_event_bus():
    """Starts the event bus and task queue dispatcher daemon threads."""
    thread_bus = threading.Thread(target=listen_to_memory_events, daemon=True)
    thread_bus.start()

    thread_queue = threading.Thread(target=process_queued_tasks_daemon, daemon=True)
    thread_queue.start()
