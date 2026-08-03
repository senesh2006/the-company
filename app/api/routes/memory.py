from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from app.api.deps import get_current_user
from app.services.shared_memory import SharedMemoryService

router = APIRouter()
memory_service = SharedMemoryService()

@router.get("/")
def get_memory(business_id: Optional[str] = Query(None), user = Depends(get_current_user)):
    """Fetches real shared memory entries from database."""
    try:
        entries = memory_service.list_all(business_id=business_id)
        return entries
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

