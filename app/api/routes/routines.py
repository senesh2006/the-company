import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.services.routine_service import routine_service, RoutineCreateInput, DEFAULT_BUSINESS_ID

logger = logging.getLogger(__name__)

router = APIRouter()


class RoutineUpdateInput(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_role: Optional[str] = None
    schedule_type: Optional[str] = None
    schedule_config: Optional[Dict[str, Any]] = None
    priority: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("", response_model=List[Dict[str, Any]])
def list_routines(user = Depends(get_current_user)):
    """
    Returns all automated background routines for the user's business.
    """
    biz_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
    return routine_service.list_routines(str(biz_id))


@router.post("", response_model=Dict[str, Any])
def create_routine(payload: RoutineCreateInput, user = Depends(get_current_user)):
    """
    Creates a new autonomous background routine that runs automatically
    on schedule even if the user is not actively using the web app.
    """
    biz_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
    user_name = getattr(user, "email", "User") or "User"

    routine = routine_service.create_routine(
        business_id=str(biz_id),
        title=payload.title,
        description=payload.description,
        assignee_role=payload.assignee_role,
        schedule_type=payload.schedule_type,
        schedule_config=payload.schedule_config,
        priority=payload.priority,
        is_active=payload.is_active,
        created_by=user_name
    )
    return routine


@router.get("/{routine_id}", response_model=Dict[str, Any])
def get_routine(routine_id: str, user = Depends(get_current_user)):
    """
    Gets details of a specific routine.
    """
    biz_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
    routine = routine_service.get_routine(str(biz_id), routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    return routine


@router.patch("/{routine_id}", response_model=Dict[str, Any])
def update_routine(routine_id: str, payload: RoutineUpdateInput, user = Depends(get_current_user)):
    """
    Updates configuration, prompt, or enabled status for a routine.
    """
    biz_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
    user_name = getattr(user, "email", "User") or "User"

    updates = {k: v for k, v in payload.dict(exclude_unset=True).items()}
    updated = routine_service.update_routine(str(biz_id), routine_id, updates, updated_by=user_name)
    if not updated:
        raise HTTPException(status_code=404, detail="Routine not found")
    return updated


@router.delete("/{routine_id}")
def delete_routine(routine_id: str, user = Depends(get_current_user)):
    """
    Deletes an automated routine.
    """
    biz_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
    success = routine_service.delete_routine(str(biz_id), routine_id)
    if not success:
        raise HTTPException(status_code=404, detail="Routine not found")
    return {"status": "deleted", "routine_id": routine_id}


@router.post("/{routine_id}/run")
def trigger_routine_now(routine_id: str, background_tasks: BackgroundTasks, user = Depends(get_current_user)):
    """
    Triggers immediate execution of a routine in the background.
    """
    biz_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
    routine = routine_service.get_routine(str(biz_id), routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    # Dispatch to background task execution
    background_tasks.add_task(routine_service.execute_routine, str(biz_id), routine_id)

    return {
        "status": "triggered",
        "routine_id": routine_id,
        "title": routine["title"],
        "message": f"Autonomous execution for '{routine['title']}' dispatched to {routine['assignee_role']}."
    }
