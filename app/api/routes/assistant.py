import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.api.deps import get_current_user
from app.services.assistant_service import assistant_service

logger = logging.getLogger(__name__)
router = APIRouter()


class AssistantChatRequest(BaseModel):
    message: str = Field(..., description="Message from the user to the Personal Assistant")
    business_id: Optional[str] = Field(None, description="Optional business ID")
    sender_name: Optional[str] = Field("Founder", description="Name/title of the sender")
    channel: Optional[str] = Field("web", description="Chat origin channel (web, whatsapp, slack, etc.)")
    chat_id: Optional[str] = Field(None, description="Optional persistent chat or session ID")
    history: Optional[List[Dict[str, str]]] = Field(None, description="Optional conversation turns")


@router.post("/chat")
async def assistant_chat(payload: AssistantChatRequest, user = Depends(get_current_user)):
    """
    Direct chat endpoint with the Personal Assistant / Chief of Staff.
    - If input is conversational/informational: replies directly without creating a task.
    - If input is an actionable company mandate: creates and dispatches the task,
      returning task details and acknowledgment.
    """
    try:
        biz_id = payload.business_id or getattr(user, "business_id", None) or "00000000-0000-0000-0000-000000000001"
        sender = payload.sender_name or getattr(user, "email", "Founder")

        response = await assistant_service.process_chat(
            message=payload.message,
            business_id=biz_id,
            sender_name=sender,
            channel=payload.channel or "web",
            chat_id=payload.chat_id,
            history=payload.history
        )
        return response
    except Exception as e:
        logger.error(f"Assistant chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
def get_assistant_history(
    business_id: Optional[str] = None,
    channel: str = "web",
    chat_id: Optional[str] = None,
    user = Depends(get_current_user)
):
    """
    Retrieves recent conversation history with the Personal Assistant.
    """
    try:
        biz_id = business_id or getattr(user, "business_id", None) or "00000000-0000-0000-0000-000000000001"
        effective_chat_id = chat_id or "default_user"
        history = assistant_service.get_recent_history(
            business_id=biz_id,
            channel=channel,
            user_id=effective_chat_id,
            limit=20
        )
        return {"history": history, "count": len(history)}
    except Exception as e:
        logger.error(f"Failed to fetch assistant history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
