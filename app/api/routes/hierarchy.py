from fastapi import APIRouter, HTTPException, Depends
from app.api.deps import get_current_user
from app.services.task_service import TaskService

router = APIRouter()
task_service = TaskService()

@router.get("/{business_id}")
def get_hierarchy(business_id: str, user = Depends(get_current_user)):
    """Fetches the agent hierarchy tree for the business."""
    try:
        # Fetch all agents for the business
        response = task_service.client.table("agents").select("*").eq("business_id", business_id).execute()
        agents = response.data
        
        if not agents:
            return None
            
        # Mock hierarchy: Supervisor is root, others are children
        supervisor = next((a for a in agents if a["role"] == "Supervisor"), agents[0])
        children = [a for a in agents if a["id"] != supervisor["id"]]
        
        return {
            "agent": supervisor,
            "children": [{"agent": child, "children": []} for child in children]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
