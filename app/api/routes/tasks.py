from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
import json

from app.services.task_service import TaskService
from app.services.governance_service import GovernanceService
from app.services.task_decomposer import generate_task_milestones, calculate_milestone_progress
from app.services.task_stream_bus import task_broadcaster
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

class DirectDispatchPayload(BaseModel):
    description: str

@router.get("/feed")
def get_company_feed(limit: int = 50, user = Depends(get_current_user)):
    """Retrieves the chronological audit log for the authenticated user's Company Feed."""
    try:
        biz_id = user.business_id or "00000000-0000-0000-0000-000000000001"
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
        biz_id = user.business_id or "00000000-0000-0000-0000-000000000001"

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
        return {"status": "success", "mandate_task": task, "task": task, "id": task.get("id")}
    except Exception as e:
        logger.error(f"Failed to dispatch mandate: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{task_id}/cancel")
def cancel_task_action(task_id: str, user = Depends(get_current_user)):
    """Cancels/stops an in-progress or queued task immediately."""
    try:
        task_service.fail_task(task_id, error="Task stopped by user.")
        return {"status": "cancelled", "task_id": task_id}
    except Exception as e:
        logger.error(f"Failed to cancel task {task_id}: {e}")
        return {"status": "cancelled", "task_id": task_id}

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
        biz_id = task.get("business_id", "00000000-0000-0000-0000-000000000001")
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

@router.post("/{business_id}/dispatch/{role}")
def dispatch_worker_direct_route(
    business_id: str,
    role: str,
    payload: DirectDispatchPayload,
    user = Depends(get_current_user)
):
    """
    Directly dispatches a mandate to a single named specialist worker (e.g. 'finance', 'marketing')
    bypassing the global supervisor decomposition and returning the raw WorkerResult.
    """
    try:
        from app.agents.workers import dispatch_worker_direct
        result = dispatch_worker_direct(
            business_id=business_id,
            role=role,
            description=payload.description
        )
        return result
    except Exception as e:
        logger.error(f"Direct worker dispatch error for role '{role}': {e}")
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
        biz_id = user.business_id or "00000000-0000-0000-0000-000000000001"
        return queue_task(biz_id, payload, background_tasks, user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
@router.get("/")
def list_all_tasks(user = Depends(get_current_user)):
    """Lists all tasks for the authenticated user's business, enriched with dynamic milestones."""
    try:
        biz_id = user.business_id or "00000000-0000-0000-0000-000000000001"
        tasks = []
        if task_service.client:
            try:
                response = task_service.client.table("tasks").select("*").eq("business_id", biz_id).order("created_at", desc=True).execute()
                tasks = response.data or []
            except Exception as sb_err:
                logger.warning(f"Could not fetch tasks from Supabase: {sb_err}")
                tasks = []
        
        # Merge in-memory tasks
        for t in tasks:
            t_id = str(t.get("id", ""))
            t_thoughts = task_service.get_live_thoughts(t_id)
            ms = generate_task_milestones(
                description=t.get("description") or t.get("mandate", ""),
                assignee_role=t.get("assignee_role"),
                status=t.get("status", "queued"),
                result=t.get("result"),
                live_thoughts=t_thoughts,
                use_llm=False
            )
            t["milestones"] = ms
            t["progress"] = calculate_milestone_progress(ms)
            t["live_thoughts"] = t_thoughts
        return tasks
    except Exception as e:
        logger.error(f"Failed to fetch tasks: {e}")
        return []

@router.get("/detail/{task_id}")
def get_task_by_id(task_id: str, user = Depends(get_current_user)):
    """Retrieves a single task by ID enriched with dynamic milestones and real-time live thoughts."""
    try:
        if not task_id or task_id in ["undefined", "null"]:
            raise HTTPException(status_code=404, detail="Task not found")
        
        t = task_service.get_task(task_id)
        if t:
            t_thoughts = t.get("live_thoughts") or task_service.get_live_thoughts(task_id)
            ms = generate_task_milestones(
                description=t.get("description") or t.get("mandate", ""),
                assignee_role=t.get("assignee_role"),
                status=t.get("status", "queued"),
                result=t.get("result"),
                live_thoughts=t_thoughts
            )
            t["milestones"] = ms
            t["progress"] = calculate_milestone_progress(ms)
            t["live_thoughts"] = t_thoughts
            return t
        raise HTTPException(status_code=404, detail="Task not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch task {task_id}: {e}")
        # Safe fallback
        t = task_service.get_task(task_id)
        if t:
            return t
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

@router.get("/detail/{task_id}/thoughts")
@router.get("/{task_id}/thoughts")
def get_task_thoughts(task_id: str, user = Depends(get_current_user)):
    """Returns captured real-time LLM thoughts and ReAct tool acts for a live task."""
    try:
        thoughts = task_service.get_live_thoughts(task_id)
        return {"task_id": task_id, "thoughts": thoughts, "count": len(thoughts)}
    except Exception as e:
        logger.error(f"Error fetching live thoughts for {task_id}: {e}")
        return {"task_id": task_id, "thoughts": [], "count": 0}


@router.get("/{business_id}/{task_id}/stream")
async def stream_task_events(
    business_id: str,
    task_id: str,
    request: Request,
    user = Depends(get_current_user)
):
    """
    Streams LangGraph node execution events (supervisor plan, worker results, executive synthesis)
    in real time via Server-Sent Events (SSE).
    """
    task = task_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    async def event_generator():
        try:
            status = (task.get("status") or "").lower()
            if status in ("completed", "failed", "rejected"):
                final_event = {
                    "node": "end",
                    "status": status,
                    "content": {
                        "result": task.get("result"),
                        "mandate": task.get("description") or task.get("mandate")
                    },
                    "timestamp": task.get("updated_at") or task.get("created_at")
                }
                yield f"data: {json.dumps(final_event)}\n\n"
                return

            async for event in task_broadcaster.subscribe(task_id):
                if await request.is_disconnected():
                    logger.info(f"Client disconnected from SSE stream for task {task_id}")
                    break
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(f"Error in SSE stream for task {task_id}: {e}")
            err_event = {
                "node": "error",
                "status": "error",
                "content": {"error": str(e)}
            }
            yield f"data: {json.dumps(err_event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/{business_id}")
def list_tasks(business_id: str, status: Optional[str] = Query(None, description="Filter by status"), user = Depends(get_current_user)):
    """Lists tasks for a business, optionally filtered by status."""
    try:
        tasks = task_service.list_tasks(business_id, status=status)
        return {"status": "success", "tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
