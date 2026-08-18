from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.mcp_client import MCPClient, get_mcp_client

router = APIRouter()

class HealthCheck(BaseModel):
    status: str = "ok"
    version: str = "v1.2.0-fastpath"

class MCPHealthCheck(BaseModel):
    fallback_mode: bool
    servers: Dict[str, Dict[str, Any]]

@router.get("/health", response_model=HealthCheck, status_code=200)
def health_check() -> HealthCheck:
    """
    Health check endpoint for Docker / orchestration checks.
    """
    return HealthCheck(status="ok", version="v1.2.0-fastpath")


@router.get("/health/mcp", response_model=MCPHealthCheck, status_code=200)
def mcp_health_check() -> MCPHealthCheck:
    """
    Health check for configured MCP (Model Context Protocol) servers.
    """
    from app.core.config import settings

    servers = [
        "stripe", "notion", "slack", "brave", "google",
        "supabase", "browser", "email", "calendar", "context7", "collaboration"
    ]

    result: Dict[str, Dict[str, Any]] = {}
    for name in servers:
        client: Optional[MCPClient] = get_mcp_client(name)
        if client is None:
            result[name] = {
                "configured": False,
                "reachable": False,
                "error": "Server not configured or fallback mode enabled",
            }
        else:
            check = client.check()
            result[name] = {
                "configured": True,
                "reachable": check.get("reachable", False),
                "status": check.get("status"),
                "error": check.get("error"),
            }

    return MCPHealthCheck(
        fallback_mode=settings.MCP_FALLBACK_MODE,
        servers=result,
    )
