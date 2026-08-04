from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import Optional, List, Any, Dict

from app.services.task_service import TaskService
from app.services.governance_service import GovernanceService
from app.core.logging import logger
from app.api.deps import get_current_user

router = APIRouter()
task_service = TaskService()

class QueueTaskPayload(BaseModel):
    description: str
    priority: int = 0

class ClaimTaskPayload(BaseModel):
    agent_id: str

class MandatePayload(BaseModel):
    mandate: str
    cadence: Optional[str] = "once"
    priority: Optional[str] = "normal"
    assignee_role: Optional[str] = None
    authority_limit: Optional[Dict[str, Any]] = None
    trust_tier: Optional[str] = "observe"
    specialization_id: Optional[str] = None
    shared_memory_refs: Optional[List[str]] = None
    expected_output: Optional[Dict[str, Any]] = None

class ReviewPayload(BaseModel):
    verdict: str  # "approved" | "rejected" | "revise"
    feedback: Optional[str] = None

@router.get("/feed")
def get_company_feed(limit: int = 50, user = Depends(get_current_user)):
    """Retrieves the chronological audit log for the authenticated user's Company Feed."""
    try:
        biz_id = user.business_id or "default-business-id"
        return task_service.list_audit_feed(biz_id, limit=limit)
    except Exception as e:
        logger.error(f"Failed to fetch company feed: {e}")
        return []

@router.get("/{business_id}/feed")
def get_business_feed(business_id: str, limit: int = 50, user = Depends(get_current_user)):
    """Retrieves the chronological audit log for a specific business."""
    return task_service.list_audit_feed(business_id, limit=limit)

@router.post("/mandate")
def create_mandate_default(payload: MandatePayload, background_tasks: BackgroundTasks, user = Depends(get_current_user)):
    """Dispatches a structured Mandate Contract (PRD v6.0 §6.2) for the authenticated user's business."""
    try:
        biz_id = user.business_id or "default-business-id"

        task = task_service.create_task(
            business_id=biz_id,
            description=payload.mandate,
            mandate=payload.mandate,
            status="queued",
            assignee_role=payload.assignee_role,
            cadence=payload.cadence or "once",
            priority=payload.priority or "normal",
            authority_limit=payload.authority_limit,
            trust_tier=payload.trust_tier or "observe",
            specialization_id=payload.specialization_id,
            shared_memory_refs=payload.shared_memory_refs,
            expected_output=payload.expected_output
        )
        background_tasks.add_task(run_team_task_bg, biz_id, task["id"], payload.mandate)
        return {"status": "success", "mandate_task": task}
    except Exception as e:
        logger.error(f"Failed to dispatch mandate: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{task_id}/review")
def review_task_action(task_id: str, payload: ReviewPayload, user = Depends(get_current_user)):
    """
    Review Gate handler as specified in PRD v6.0 §07 & §6.1.
    Handles Founder Approval, Revision (capped at 2 retries), or Immediate Rejection/Demotion.
    """
    try:
        task_resp = task_service.client.table("tasks").select("*").eq("id", task_id).execute()
        if not task_resp.data:
            raise HTTPException(status_code=404, detail="Task not found")
        task = task_resp.data[0]
        biz_id = task.get("business_id", "default-business-id")
        agent_id = task.get("agent_id")
        
        verdict = payload.verdict.lower()
        if verdict == "approved":
            task_service.update_task_status(task_id, "completed")
            if agent_id:
                task_service.record_task_verdict(biz_id, agent_id, is_clean=True, reason="Founder approved work")
            task_service.log_audit_event(
                business_id=biz_id,
                agent_id=agent_id,
                mandate=task.get("description"),
                action="Action Approved by Founder",
                review_status="approved",
                details={"feedback": payload.feedback}
            )
            return {"status": "approved", "message": "Task approved and recorded as clean cycle."}
            
        elif verdict == "revise":
            retry_count = task.get("retry_count", 0)
            if not GovernanceService.check_retry_limit(retry_count):
                # Exceeded 2 retries -> auto-rejection & demotion
                if agent_id:
                    task_service.demote_agent(biz_id, agent_id, reason="Exceeded 2 review revise retries.")
                task_service.update_task_status(task_id, "failed")
                return {"status": "rejected", "message": "Maximum 2 revise retries exceeded. Task failed and worker demoted."}
                
            task_service.update_task_status(task_id, "queued")
            task_service.client.table("tasks").update({"retry_count": retry_count + 1}).eq("id", task_id).execute()
            task_service.log_audit_event(
                business_id=biz_id,
                agent_id=agent_id,
                mandate=task.get("description"),
                action=f"Revision Requested (Attempt {retry_count + 1}/2)",
                review_status="revise",
                details={"feedback": payload.feedback}
            )
            return {"status": "revision_requested", "attempt": retry_count + 1}
            
        elif verdict == "rejected":
            task_service.update_task_status(task_id, "rejected")
            if agent_id:
                task_service.demote_agent(biz_id, agent_id, reason=payload.feedback or "Founder rejected action")
            task_service.log_audit_event(
                business_id=biz_id,
                agent_id=agent_id,
                mandate=task.get("description"),
                action="Action Rejected by Founder (Worker Demoted)",
                review_status="rejected",
                details={"feedback": payload.feedback}
            )
            return {"status": "rejected", "message": "Task rejected and worker demoted."}
        else:
            raise HTTPException(status_code=400, detail="Invalid verdict. Use 'approved', 'rejected', or 'revise'.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Review error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{business_id}/queue")
def queue_task(business_id: str, payload: QueueTaskPayload, background_tasks: BackgroundTasks, user = Depends(get_current_user)):
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
        import traceback
        error_msg = f"FATAL ERROR: {str(e)}\n{traceback.format_exc()}"
        try:
            ts = TaskService()
            ts.update_task_result(task_id, error_msg)
            ts.fail_task(task_id)
        except Exception as db_e:
            logger.error(f"Failed to update task status in DB: {db_e}")

@router.post("/{business_id}/claim")
def claim_task(business_id: str, payload: ClaimTaskPayload, user = Depends(get_current_user)):
    """Atomically claims the highest priority pending task for an agent."""
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
def requeue_task(business_id: str, task_id: str, user = Depends(get_current_user)):
    """Requeues a failed or abandoned task."""
    try:
        task = task_service.requeue_task(task_id)
        return {"status": "success", "task": task}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
@router.post("/")
def create_default_task(payload: QueueTaskPayload, background_tasks: BackgroundTasks, user = Depends(get_current_user)):
    """Creates/queues a task for the authenticated user's business."""
    try:
        biz_id = user.business_id or "default-business-id"
        return queue_task(biz_id, payload, background_tasks, user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
@router.get("/")
def list_all_tasks(user = Depends(get_current_user)):
    """Lists all tasks for the authenticated user's business."""
    try:
        biz_id = user.business_id or "default-business-id"
        response = task_service.client.table("tasks").select("*").eq("business_id", biz_id).order("created_at", desc=True).execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Failed to fetch tasks: {e}")
        return []

@router.get("/{business_id}")
def list_tasks(business_id: str, status: Optional[str] = Query(None, description="Filter by status"), user = Depends(get_current_user)):
    """Lists tasks for a business, optionally filtered by status."""
    try:
        tasks = task_service.list_tasks(business_id, status=status)
        return {"status": "success", "tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
