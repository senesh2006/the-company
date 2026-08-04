from fastapi import APIRouter, HTTPException, Depends
from app.api.deps import get_current_user
from app.services.task_service import TaskService

router = APIRouter()
task_service = TaskService()

@router.get("")
@router.get("/")
def get_default_hierarchy(user = Depends(get_current_user)):
    """Fetches the agent hierarchy tree for the authenticated user's business."""
    try:
        biz_id = user.business_id or "default-business-id"
        response = task_service.client.table("agents").select("*").eq("business_id", biz_id).execute()
        agents = response.data or []

        if not agents:
            return {"agent": None, "children": []}

        # Supervisor is root, others are children
        supervisor = next((a for a in agents if a.get("role") == "Supervisor"), agents[0])
        children = [a for a in agents if a.get("id") != supervisor.get("id")]

        return {
            "agent": supervisor,
            "children": [{"agent": child, "children": []} for child in children]
        }
    except Exception as e:
        return {"agent": None, "children": []}

@router.get("/{business_id}")
def get_hierarchy(business_id: str, user = Depends(get_current_user)):
    """Fetches the agent hierarchy tree for the business."""
    try:
        response = task_service.client.table("agents").select("*").eq("business_id", business_id).execute()
        agents = response.data or []
        
        if not agents:
            return {"agent": None, "children": []}
            
        supervisor = next((a for a in agents if a.get("role") == "Supervisor"), agents[0])
        children = [a for a in agents if a.get("id") != supervisor.get("id")]
        
        return {
            "agent": supervisor,
            "children": [{"agent": child, "children": []} for child in children]
        }
    except Exception as e:
        return {"agent": None, "children": []}
