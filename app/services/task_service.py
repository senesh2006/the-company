import logging
from typing import Any, Optional, List
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

class TaskService:
    def __init__(self, supabase_client: Optional[Client] = None):
        if supabase_client:
            self.client = supabase_client
        else:
            if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set to use TaskService")
            self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            
    def list_agents(self, business_id: str) -> List[dict[str, Any]]:
        """List all available agents for a business."""
        try:
            response = self.client.table("agents")\
                .select("*")\
                .eq("business_id", business_id)\
                .execute()
            return response.data
        except Exception as e:
            logger.error(f"Error listing agents for business {business_id}: {e}")
            raise e

    def create_task(self, business_id: str, description: str, status: str = "pending") -> dict[str, Any]:
        """Creates a new task."""
        try:
            data = {
                "business_id": business_id,
                "description": description,
                "status": status
            }
            response = self.client.table("tasks").insert(data).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error creating task for business {business_id}: {e}")
            raise e

    def list_tasks(self, business_id: str, status: Optional[str] = None) -> List[dict[str, Any]]:
        """List tasks for a business, optionally filtered by status."""
        try:
            query = self.client.table("tasks").select("*").eq("business_id", business_id)
            if status:
                query = query.eq("status", status)
            response = query.execute()
            return response.data
        except Exception as e:
            logger.error(f"Error listing tasks for business {business_id}: {e}")
            raise e

    def assign_task(self, task_id: str, agent_id: str) -> dict[str, Any]:
        """Assigns an agent to a task."""
        try:
            response = self.client.table("tasks")\
                .update({"agent_id": agent_id, "status": "assigned"})\
                .eq("id", task_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error assigning task {task_id} to agent {agent_id}: {e}")
            raise e

    def update_task_status(self, task_id: str, status: str) -> dict[str, Any]:
        """Updates the status of a task."""
        try:
            response = self.client.table("tasks")\
                .update({"status": status})\
                .eq("id", task_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error updating task {task_id} status to {status}: {e}")
            raise e
