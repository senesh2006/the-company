import logging
import uuid
from typing import Any, Optional, List
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

class TaskService:
    _local_tasks: dict = {}
    _local_agents: dict = {}

    def __init__(self, supabase_client: Optional[Client] = None):
        self._client = supabase_client

    @property
    def client(self) -> Optional[Client]:
        if self._client:
            return self._client
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                return self._client
            except Exception as e:
                logger.warning(f"Could not connect to Supabase: {e}")
                return None
        return None
            
    def list_agents(self, business_id: str) -> List[dict[str, Any]]:
        """List all available agents for a business."""
        client = self.client
        if client:
            try:
                response = client.table("agents")\
                    .select("*")\
                    .eq("business_id", business_id)\
                    .execute()
                if response.data is not None:
                    return response.data
            except Exception as e:
                logger.warning(f"Error listing agents for business {business_id}: {e}")
        return [a for a in self._local_agents.values() if a.get("business_id") == business_id]

    def create_agent(self, business_id: str, name: str, role: str, status: str = "Idle") -> dict[str, Any]:
        """Creates a new agent."""
        agent_id = str(uuid.uuid4())
        data = {
            "id": agent_id,
            "business_id": business_id,
            "name": name,
            "role": role,
            "status": status
        }
        self._local_agents[agent_id] = data
        client = self.client
        if client:
            try:
                response = client.table("agents").insert({
                    "business_id": business_id,
                    "name": name,
                    "role": role,
                    "status": status
                }).execute()
                if response.data:
                    return response.data[0]
            except Exception as e:
                if "status" in str(e) and "PGRST204" in str(e):
                    logger.warning("agents table missing 'status' column — inserting without it.")
                    try:
                        response = client.table("agents").insert({
                            "business_id": business_id,
                            "name": name,
                            "role": role
                        }).execute()
                        if response.data:
                            return response.data[0]
                    except Exception as inner_e:
                        logger.warning(f"Failed fallback agent insert: {inner_e}")
                logger.warning(f"Error creating agent for business {business_id}: {e}")
        return data

    def update_agent_status(self, agent_id: str, status: str) -> dict[str, Any]:
        """Updates the status of an agent in the database."""
        if agent_id in self._local_agents:
            self._local_agents[agent_id]["status"] = status
        client = self.client
        if client:
            try:
                response = client.table("agents")\
                    .update({"status": status})\
                    .eq("id", agent_id)\
                    .execute()
                if response.data:
                    return response.data[0]
            except Exception as e:
                if "PGRST204" in str(e):
                    logger.warning(f"Cannot update agent status — 'status' column missing.")
                else:
                    logger.warning(f"Error updating agent {agent_id} status to {status}: {e}")
        return self._local_agents.get(agent_id, {"id": agent_id, "status": status})

    def create_task(self, business_id: str, description: str, status: str = "pending", parent_id: Optional[str] = None, dependencies: List[str] = [], assignee_role: Optional[str] = None, id: Optional[str] = None) -> dict[str, Any]:
        """Creates a new task."""
        task_id = id or str(uuid.uuid4())
        data = {
            "id": task_id,
            "business_id": business_id,
            "description": description,
            "status": status,
            "parent_id": parent_id,
            "dependencies": dependencies,
            "assignee_role": assignee_role
        }
        self._local_tasks[task_id] = data
        client = self.client
        if client:
            try:
                response = client.table("tasks").insert(data).execute()
                if response.data:
                    return response.data[0]
            except Exception as e:
                logger.warning(f"Error creating task for business {business_id}: {e}")
        return data

    def list_tasks(self, business_id: str, status: Optional[str] = None) -> List[dict[str, Any]]:
        """List tasks for a business, optionally filtered by status."""
        client = self.client
        if client:
            try:
                query = client.table("tasks").select("*").eq("business_id", business_id)
                if status:
                    query = query.eq("status", status)
                response = query.execute()
                if response.data is not None:
                    return response.data
            except Exception as e:
                logger.warning(f"Error listing tasks for business {business_id}: {e}")
        tasks = [t for t in self._local_tasks.values() if t.get("business_id") == business_id]
        if status:
            tasks = [t for t in tasks if t.get("status") == status]
        return tasks

    def assign_task(self, task_id: str, agent_id: str) -> dict[str, Any]:
        """Assigns an agent to a task."""
        if task_id in self._local_tasks:
            self._local_tasks[task_id]["agent_id"] = agent_id
            self._local_tasks[task_id]["status"] = "assigned"
        client = self.client
        if client:
            try:
                response = client.table("tasks")\
                    .update({"agent_id": agent_id, "status": "assigned"})\
                    .eq("id", task_id)\
                    .execute()
                if response.data:
                    return response.data[0]
            except Exception as e:
                logger.warning(f"Error assigning task {task_id} to agent {agent_id}: {e}")
        return self._local_tasks.get(task_id, {"id": task_id, "agent_id": agent_id, "status": "assigned"})

    def get_active_task_for_agent(self, agent_id: str) -> Optional[dict[str, Any]]:
        """Finds the currently running task for a given agent_id."""
        client = self.client
        if client:
            try:
                response = client.table("tasks")\
                    .select("*")\
                    .eq("agent_id", agent_id)\
                    .eq("status", "running")\
                    .execute()
                if response.data:
                    return response.data[0]
                response = client.table("tasks")\
                    .select("*")\
                    .eq("agent_id", agent_id)\
                    .eq("status", "assigned")\
                    .execute()
                if response.data:
                    return response.data[0]
            except Exception as e:
                logger.warning(f"Error fetching active task for agent {agent_id}: {e}")
        for t in self._local_tasks.values():
            if t.get("agent_id") == agent_id and t.get("status") in ["running", "assigned"]:
                return t
        return None

    def get_active_task_for_business(self, business_id: str) -> Optional[dict[str, Any]]:
        """Finds the currently running team task for a given business."""
        client = self.client
        if client:
            try:
                response = client.table("tasks")\
                    .select("*")\
                    .eq("business_id", business_id)\
                    .eq("status", "running")\
                    .execute()
                if response.data:
                    return response.data[0]
            except Exception as e:
                logger.warning(f"Error fetching active task for business {business_id}: {e}")
        for t in self._local_tasks.values():
            if t.get("business_id") == business_id and t.get("status") == "running":
                return t
        return None

    def update_task_status(self, task_id: str, status: str) -> dict[str, Any]:
        """Updates the status of a task."""
        if task_id in self._local_tasks:
            self._local_tasks[task_id]["status"] = status
        client = self.client
        if client:
            try:
                response = client.table("tasks")\
                    .update({"status": status})\
                    .eq("id", task_id)\
                    .execute()
                if response.data:
                    return response.data[0]
            except Exception as e:
                logger.warning(f"Error updating task {task_id} status to {status}: {e}")
        return self._local_tasks.get(task_id, {"id": task_id, "status": status})

    def update_task_result(self, task_id: str, result: str) -> dict[str, Any]:
        """Updates the result of a task."""
        if task_id in self._local_tasks:
            self._local_tasks[task_id]["result"] = result
            self._local_tasks[task_id]["status"] = "completed"
        client = self.client
        if client:
            try:
                response = client.table("tasks")\
                    .update({"result": result, "status": "completed"})\
                    .eq("id", task_id)\
                    .execute()
                if response.data:
                    return response.data[0]
            except Exception as e:
                logger.warning(f"Error updating task {task_id} result: {e}")
        return self._local_tasks.get(task_id, {"id": task_id, "result": result, "status": "completed"})

    def queue_task(self, business_id: str, description: str, priority: int = 0) -> dict[str, Any]:
        """Creates a new task with status 'queued' and a specific priority."""
        task_id = str(uuid.uuid4())
        data = {
            "id": task_id,
            "business_id": business_id,
            "description": description,
            "status": "queued",
            "priority": priority
        }
        self._local_tasks[task_id] = data
        client = self.client
        if client:
            try:
                response = client.table("tasks").insert(data).execute()
                if response.data:
                    return response.data[0]
            except Exception as e:
                logger.warning(f"Error queuing task for business {business_id}: {e}")
        return data

    def claim_task(self, business_id: str, agent_id: str) -> Optional[dict[str, Any]]:
        """Atomically claims the highest priority queued task for the given agent."""
        client = self.client
        if client:
            try:
                response = client.rpc("claim_next_task", {
                    "p_business_id": business_id,
                    "p_agent_id": agent_id
                }).execute()
                if response.data:
                    return response.data[0]
            except Exception as e:
                logger.warning(f"Error claiming task for agent {agent_id}: {e}")
        for t in self._local_tasks.values():
            if t.get("business_id") == business_id and t.get("status") == "queued":
                t["status"] = "assigned"
                t["agent_id"] = agent_id
                return t
        return None

    def requeue_task(self, task_id: str) -> dict[str, Any]:
        """Requeues a failed or running task back to 'queued' state and clears the agent."""
        if task_id in self._local_tasks:
            self._local_tasks[task_id]["status"] = "queued"
            self._local_tasks[task_id]["agent_id"] = None
        client = self.client
        if client:
            try:
                response = client.table("tasks")\
                    .update({
                        "status": "queued",
                        "agent_id": None
                    })\
                    .eq("id", task_id)\
                    .execute()
                if response.data:
                    return response.data[0]
            except Exception as e:
                logger.warning(f"Error requeuing task {task_id}: {e}")
        return self._local_tasks.get(task_id, {"id": task_id, "status": "queued", "agent_id": None})

    def complete_task(self, task_id: str) -> dict[str, Any]:
        """Marks a task as completed."""
        return self.update_task_status(task_id, "completed")

    def fail_task(self, task_id: str) -> dict[str, Any]:
        """Marks a task as failed."""
        return self.update_task_status(task_id, "failed")

task_service = TaskService()
