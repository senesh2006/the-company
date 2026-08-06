from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.api.deps import get_current_user
from app.services.ui_control_service import UIControlService

router = APIRouter()

class UICommandRequest(BaseModel):
    action: str  # 'NAVIGATE', 'OPEN_MODAL', 'SHOW_TOAST', 'HIGHLIGHT', 'CUSTOMIZE_KPI'
    payload: Dict[str, Any]

@router.get("/stream")
async def stream_ui_commands():
    """
    Server-Sent Events (SSE) endpoint for live browser UI control by AI agents.
    """
    return StreamingResponse(
        UIControlService.subscribe(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

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
