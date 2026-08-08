from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from app.services.waha_service import waha_service, format_whatsapp_chat_id
from app.core.config import settings
from app.core.logging import logger

router = APIRouter()


class SendMessageRequest(BaseModel):
    chat_id: str = Field(..., description="Phone number or WhatsApp chat ID (e.g. '+1234567890', '1234567890@c.us')")
    text: str = Field(..., description="Message text to send")
    session: Optional[str] = Field(None, description="Optional session override")


class SendFileRequest(BaseModel):
    chat_id: str = Field(..., description="Phone number or WhatsApp chat ID")
    file_url: str = Field(..., description="Public or accessible URL of the file to attach")
    filename: Optional[str] = Field(None, description="Optional filename")
    caption: Optional[str] = Field(None, description="Optional message caption")
    session: Optional[str] = Field(None, description="Optional session override")


class SessionActionRequest(BaseModel):
    session: Optional[str] = Field("default", description="Session name")


@router.get("/status")
async def get_whatsapp_status(session: Optional[str] = None):
    """
    Returns the current status of the WAHA WhatsApp instance and session.
    """
    status_info = await waha_service.get_status(session=session)
    return status_info


@router.post("/session/start")
async def start_whatsapp_session(req: Optional[SessionActionRequest] = None):
    """
    Starts or creates a WhatsApp session in WAHA.
    """
    sess = req.session if req else "default"
    try:
        result = await waha_service.start_session(session=sess)
        return {"status": "started", "session": sess, "result": result}
    except Exception as e:
        logger.error(f"Failed to start WAHA session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/stop")
async def stop_whatsapp_session(req: Optional[SessionActionRequest] = None):
    """
    Stops an active WhatsApp session in WAHA.
    """
    sess = req.session if req else "default"
    try:
        result = await waha_service.stop_session(session=sess)
        return {"status": "stopped", "session": sess, "result": result}
    except Exception as e:
        logger.error(f"Failed to stop WAHA session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/qr")
async def get_whatsapp_qr(session: Optional[str] = None):
    """
    Retrieves the QR code data for linking WhatsApp Web on your phone.
    """
    qr_data = await waha_service.get_qr(session=session)
    if "error" in qr_data and qr_data.get("error"):
        return qr_data
    return qr_data


@router.post("/send")
async def send_whatsapp_message(req: SendMessageRequest):
    """
    Sends a WhatsApp message to a phone number or group chat.
    """
    try:
        result = await waha_service.send_text(
            chat_id=req.chat_id,
            text=req.text,
            session=req.session
        )
        return {"success": True, "result": result}
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-file")
async def send_whatsapp_file(req: SendFileRequest):
    """
    Sends a file or image to a WhatsApp chat.
    """
    try:
        result = await waha_service.send_file(
            chat_id=req.chat_id,
            file_url=req.file_url,
            filename=req.filename,
            caption=req.caption,
            session=req.session
        )
        return {"success": True, "result": result}
    except Exception as e:
        logger.error(f"Failed to send WhatsApp file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chats")
async def get_whatsapp_chats(session: Optional[str] = None, limit: int = 20):
    """
    Returns recent chats from WAHA.
    """
    chats = await waha_service.get_chats(session=session, limit=limit)
    return {"chats": chats, "count": len(chats)}


@router.post("/webhook")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Inbound webhook receiver for WAHA events.
    When a WhatsApp message is received from the founder or customer,
    it automatically ingests into Company OS, triggers the Personal Assistant
    to decompose and delegate tasks, and returns real-time responses!
    """
    try:
        payload = await request.json()
        logger.info(f"Incoming WAHA webhook: event={payload.get('event')}")
        
        # Process the webhook in the background to respond immediately with 200 OK to WAHA
        background_tasks.add_task(waha_service.handle_webhook_event, payload)
        return {"status": "accepted", "event": payload.get("event")}
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        return {"status": "error", "message": str(e)}
