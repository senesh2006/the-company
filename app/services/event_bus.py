import json
import logging
import threading
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

def start_event_bus():
    """Starts the event bus in a daemon thread."""
    thread = threading.Thread(target=listen_to_memory_events, daemon=True)
    thread.start()
