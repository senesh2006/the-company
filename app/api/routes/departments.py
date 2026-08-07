from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.api.deps import get_current_user
from app.services.department_service import DepartmentService
from app.services.task_service import TaskService
from app.api.routes.tasks import run_team_task_bg

router = APIRouter()
dept_service = DepartmentService()
task_service = TaskService()

class AlertCreate(BaseModel):
    alert_type: str = "info"
    title: str
    desc: str

class ActivityCreate(BaseModel):
    text: str
    badge: str = "EXEC"
    badge_class: str = "bg-indigo-50 text-indigo-800 border-indigo-200"

class AttentionCreate(BaseModel):
    title: str
    action: str
    priority: str = "normal"

class DispatchDirective(BaseModel):
    directive: str
    priority: str = "normal"

@router.get("/{dept_id}")
def get_department_details(dept_id: str, user = Depends(get_current_user)):
    """
    Returns live department telemetry, alerts, activity stream, attention items,
    and setup guide checklist.
    """
    biz_id = user.business_id or "default-business-id"
    data = dept_service.get_department_data(biz_id, dept_id)
    return data

@router.post("/{dept_id}/alerts")
def create_department_alert(dept_id: str, payload: AlertCreate, user = Depends(get_current_user)):
    """
    Creates a new operational alert for a department.
    """
    biz_id = user.business_id or "default-business-id"
    alert = dept_service.create_department_alert(
        business_id=biz_id,
        dept_id=dept_id,
        alert_type=payload.alert_type,
        title=payload.title,
        desc=payload.desc
    )
    return alert

@router.post("/{dept_id}/activities")
def log_department_activity(dept_id: str, payload: ActivityCreate, user = Depends(get_current_user)):
    """
    Logs an execution activity for a department.
    """
    biz_id = user.business_id or "default-business-id"
    activity = dept_service.log_department_activity(
        business_id=biz_id,
        dept_id=dept_id,
        text=payload.text,
        badge=payload.badge,
        badge_class=payload.badge_class
    )
    return activity

@router.post("/{dept_id}/attention")
def push_department_attention(dept_id: str, payload: AttentionCreate, user = Depends(get_current_user)):
    """
    Pushes an item requiring founder/executive attention to the department queue.
    """
    biz_id = user.business_id or "default-business-id"
    item = dept_service.push_attention_item(
        business_id=biz_id,
        dept_id=dept_id,
        title=payload.title,
        action=payload.action,
        priority=payload.priority
    )
    return item

@router.post("/{dept_id}/checklist/{task_id}")
def toggle_checklist(dept_id: str, task_id: int, user = Depends(get_current_user)):
    """
    Toggles a department checklist task's completed state.
    """
    biz_id = user.business_id or "default-business-id"
    checklist = dept_service.toggle_checklist_task(biz_id, dept_id, task_id)
    return {"checklist": checklist}

@router.post("/{dept_id}/dispatch")
def dispatch_department_directive(
    dept_id: str,
    payload: DispatchDirective,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    """
    Dispatches a prompt/objective to department AI agents and triggers immediate background execution.
    """
    biz_id = user.business_id or "default-business-id"
    
    # 1. Dispatch task to workforce
    task = task_service.create_task(
        business_id=biz_id,
        description=f"[{dept_id.upper()} DIRECTIVE] {payload.directive}",
        mandate=payload.directive,
        priority=payload.priority,
        assignee_role=f"{dept_id.capitalize()} Specialist",
        status="queued"
    )

    # 2. Add background execution runner so AI workers pick it up immediately
    background_tasks.add_task(run_team_task_bg, biz_id, task["id"], payload.directive)

    # 3. Autonomously log activity & update department telemetry
    dept_service.log_department_activity(
        business_id=biz_id,
        dept_id=dept_id,
        text=f"Dispatched objective: '{payload.directive[:60]}...'",
        badge="DISPATCH",
        badge_class="bg-emerald-50 text-emerald-800 border-emerald-200"
    )

    return {"status": "dispatched", "task": task}
