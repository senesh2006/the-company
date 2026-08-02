from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class HealthCheck(BaseModel):
    status: str = "ok"

@router.get("", response_model=HealthCheck, status_code=200)
@router.get("/", response_model=HealthCheck, status_code=200)
@router.get("/health", response_model=HealthCheck, status_code=200)
def health_check() -> HealthCheck:
    """
    Health check endpoint for Docker / orchestration checks.
    """
    return HealthCheck(status="ok")
