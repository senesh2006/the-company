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

    def create_agent(self, business_id: str, name: str, role: str) -> dict[str, Any]:
        """Creates a new agent."""
        try:
            data = {
                "business_id": business_id,
                "name": name,
                "role": role
            }
            response = self.client.table("agents").insert(data).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error creating agent for business {business_id}: {e}")
            raise e

    def create_task(self, business_id: str, description: str, status: str = "pending", parent_id: Optional[str] = None, dependencies: List[str] = [], assignee_role: Optional[str] = None) -> dict[str, Any]:
        """Creates a new task."""
        try:
            data = {
                "business_id": business_id,
                "description": description,
                "status": status,
                "parent_id": parent_id,
                "dependencies": dependencies,
                "assignee_role": assignee_role
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

    def get_active_task_for_agent(self, agent_id: str) -> Optional[dict[str, Any]]:
        """Finds the currently running task for a given agent_id."""
        try:
            response = self.client.table("tasks")\
                .select("*")\
                .eq("agent_id", agent_id)\
                .eq("status", "running")\
                .execute()
            
            if not response.data:
                # Fallback to assigned tasks if none are strictly running
                response = self.client.table("tasks")\
                    .select("*")\
                    .eq("agent_id", agent_id)\
                    .eq("status", "assigned")\
                    .execute()
                    
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error fetching active task for agent {agent_id}: {e}")
            raise e

    def get_active_task_for_business(self, business_id: str) -> Optional[dict[str, Any]]:
        """Finds the currently running team task for a given business."""
        try:
            response = self.client.table("tasks")\
                .select("*")\
                .eq("business_id", business_id)\
                .eq("status", "running")\
                .execute()
                
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error fetching active task for business {business_id}: {e}")
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

    def update_task_result(self, task_id: str, result: str) -> dict[str, Any]:
        """Updates the result of a task."""
        try:
            response = self.client.table("tasks")\
                .update({"result": result, "status": "completed"})\
                .eq("id", task_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error updating task {task_id} result: {e}")
            raise e

    # --- Queue Specific Methods ---

    def queue_task(self, business_id: str, description: str, priority: int = 0) -> dict[str, Any]:
        """Creates a new task with status 'queued' and a specific priority."""
        try:
            data = {
                "business_id": business_id,
                "description": description,
                "status": "queued",
                "priority": priority
            }
            response = self.client.table("tasks").insert(data).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error queuing task for business {business_id}: {e}")
            raise e

    def claim_task(self, business_id: str, agent_id: str) -> Optional[dict[str, Any]]:
        """Atomically claims the highest priority queued task for the given agent."""
        try:
            # We call the RPC we created in the migration
            response = self.client.rpc("claim_next_task", {
                "p_business_id": business_id,
                "p_agent_id": agent_id
            }).execute()
            
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error claiming task for agent {agent_id}: {e}")
            raise e

    def requeue_task(self, task_id: str) -> dict[str, Any]:
        """Requeues a failed or running task back to 'queued' state and clears the agent."""
        try:
            response = self.client.table("tasks")\
                .update({
                    "status": "queued",
                    "agent_id": None
                })\
                .eq("id", task_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error requeuing task {task_id}: {e}")
            raise e

    def complete_task(self, task_id: str) -> dict[str, Any]:
        """Marks a task as completed."""
        return self.update_task_status(task_id, "completed")

    def fail_task(self, task_id: str) -> dict[str, Any]:
        """Marks a task as failed."""
        return self.update_task_status(task_id, "failed")

