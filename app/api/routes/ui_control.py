from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from app.api.deps import get_current_user
from app.services.ui_control_service import UIControlService

router = APIRouter()

class UICommandRequest(BaseModel):
    action: str  # 'NAVIGATE', 'OPEN_MODAL', 'SHOW_TOAST', 'HIGHLIGHT', 'CUSTOMIZE_KPI'
    payload: Dict[str, Any]

@router.get("/stream")
def stream_ui_commands_deprecated():
    """
    DEPRECATED: Legacy SSE endpoint stub for backwards compatibility.
    Old cached frontend builds still hit this route. Returns 200 with
    empty body so it doesn't spam 404s in Railway logs.
    """
    return {"deprecated": True, "message": "Use /api/v1/ui/poll instead"}

@router.get("/poll")
def poll_ui_commands(since: Optional[str] = Query(None, description="ISO timestamp to fetch commands after")):
    """
    Polling endpoint for UI commands. The browser polls this every 3 seconds
    to collect pending AI directives. Replaces SSE to avoid ERR_HTTP2_PROTOCOL_ERROR
    on Railway's HTTP/2 proxy.
    """
    commands = UIControlService.poll_commands(since=since)
    return {"commands": commands}

@router.post("/command")
def trigger_ui_command(req: UICommandRequest, user = Depends(get_current_user)):
    """
    Allows backend services or AI agents to trigger UI commands.
    """
    biz_id = user.business_id or "default-business-id"
    event = UIControlService.dispatch_ui_command(
        action=req.action,
        payload=req.payload,
        business_id=biz_id
    )
    return {"status": "broadcasted", "event": event}
