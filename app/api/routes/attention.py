from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from app.api.deps import get_current_user
from app.services.task_service import TaskService

router = APIRouter()
task_service = TaskService()

@router.get("")
@router.get("/")
def get_needs_attention(user = Depends(get_current_user)):
    """Fetches items that require human attention for the authenticated user's business."""
    try:
        items: List[Dict[str, Any]] = []
        biz_id = user.business_id or "00000000-0000-0000-0000-000000000001"

        # 1. Fetch tasks from DB requiring review or blocked
        try:
            tasks_resp = task_service.client.table("tasks")\
                .select("*")\
                .eq("business_id", biz_id)\
                .in_("status", ["needs_approval", "blocked", "failed", "queued"])\
                .order("created_at", desc=True)\
                .limit(20).execute()
            if tasks_resp.data:
                for t in tasks_resp.data:
                    # If status is needs_approval or blocked or has retry count > 0
                    status = (t.get("status") or "").lower()
                    if status in ["needs_approval", "blocked", "failed"] or t.get("retry_count", 0) > 0:
                        items.append({
                            "id": t.get("id"),
                            "type": "approval" if status == "needs_approval" else "warning",
                            "title": t.get("description") or t.get("mandate") or "Task Requires Review",
                            "description": f"Worker {t.get('assignee_role') or 'Agent'} requires review (Attempt: {t.get('retry_count', 0)}/2).",
                            "agentId": t.get("agent_id") or "agent-lead",
                            "agentName": t.get("assignee_role") or "Personal Assistant",
                            "timestamp": t.get("created_at") or ""
                        })
        except Exception:
            pass

        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

