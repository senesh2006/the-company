from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Any

from app.services.task_service import TaskService
from app.core.logging import logger

router = APIRouter()
task_service = TaskService()

class QueueTaskPayload(BaseModel):
    description: str
    priority: int = 0

class ClaimTaskPayload(BaseModel):
    agent_id: str

@router.post("/{business_id}/queue")
def queue_task(business_id: str, payload: QueueTaskPayload, background_tasks: BackgroundTasks):
    """Adds a new task to the queue and starts processing it."""
    try:
        task = task_service.queue_task(business_id, payload.description, payload.priority)
        background_tasks.add_task(run_team_task_bg, business_id, task["id"], payload.description)
        return {"status": "success", "task": task}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def run_team_task_bg(business_id: str, task_id: str, description: str):
    try:
        from app.agents.runner import TeamRunner
        runner = TeamRunner(business_id, task_id)
        runner.start(description)
    except Exception as e:
        logger.error(f"Background task failed for {task_id}: {e}")

@router.post("/{business_id}/claim")
def claim_task(business_id: str, payload: ClaimTaskPayload):
    """
    Atomically claims the highest priority pending task for an agent.
    Returns 404 if no tasks are available.
    """
    try:
        task = task_service.claim_task(business_id, payload.agent_id)
        if not task:
            raise HTTPException(status_code=404, detail="No tasks available in queue.")
        return {"status": "success", "task": task}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{business_id}/{task_id}/requeue")
def requeue_task(business_id: str, task_id: str):
    """Requeues a failed or abandoned task."""
    try:
        task = task_service.requeue_task(task_id)
        return {"status": "success", "task": task}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{business_id}")
def list_tasks(business_id: str, status: Optional[str] = Query(None, description="Filter by status (e.g., queued, running, failed)")):
    """Lists tasks for a business, optionally filtered by status."""
    try:
        tasks = task_service.list_tasks(business_id, status=status)
        return {"status": "success", "tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
