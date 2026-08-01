from fastapi import APIRouter, HTTPException, Depends
from app.api.deps import get_current_user
from app.services.task_service import TaskService

router = APIRouter()
task_service = TaskService()

@router.get("/")
def get_memory(user = Depends(get_current_user)):
    """Fetches shared memory entries."""
    try:
        # Mocking memory for now as the table might not exist
        # In a real app, you'd fetch from Supabase Redis cache or DB
        return [
            {
                "id": "1",
                "key": "company_budget",
                "value": "100000",
                "updatedBy": "Finance Manager",
                "timestamp": "2026-08-01T10:00:00Z"
            },
            {
                "id": "2",
                "key": "target_audience",
                "value": "Enterprise B2B",
                "updatedBy": "Marketing Manager",
                "timestamp": "2026-08-01T10:05:00Z"
            }
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
