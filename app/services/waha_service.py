import os
import re
import logging
import httpx
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)


def format_whatsapp_chat_id(phone_or_chat_id: str) -> str:
    """
    Normalizes a phone number or WhatsApp ID to WAHA chatId format.
    E.g. '+1 (234) 567-8900' -> '12345678900@c.us'
    '12345678900@c.us' -> '12345678900@c.us'
    '12345-67890@g.us' -> '12345-67890@g.us'
    """
    if not phone_or_chat_id:
        return ""
    
    cleaned = phone_or_chat_id.strip()
    if "@c.us" in cleaned or "@g.us" in cleaned or "@newsletter" in cleaned:
        return cleaned
    
    # Strip non-digit characters
    digits = re.sub(r"\D", "", cleaned)
    if not digits:
        return cleaned
    
    return f"{digits}@c.us"


class WAHAService:
    """
    Client service for WAHA (WhatsApp HTTP API - https://waha.devlike.pro).
    Provides methods to manage WhatsApp sessions, send messages, stream QR codes,
    and process incoming WhatsApp webhooks for automated task orchestration.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        default_session: Optional[str] = None
    ):
        self.base_url = (base_url or settings.WAHA_BASE_URL or os.getenv("WAHA_BASE_URL") or "").rstrip("/")
        self.api_key = api_key or settings.WAHA_API_KEY or os.getenv("WAHA_API_KEY")
        self.default_session = default_session or settings.WAHA_SESSION or os.getenv("WAHA_SESSION") or "default"

    def is_configured(self) -> bool:
        """Checks if WAHA_BASE_URL is configured."""
        return bool(self.base_url)

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.api_key:
            headers["X-Api-Key"] = self.api_key
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def get_status(self, session: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves the status of WAHA server and the active WhatsApp session.
        Returns status info such as 'WORKING', 'SCAN_QR_CODE', 'STOPPED', 'FAILED', or 'NOT_CONFIGURED'.
        """
        if not self.is_configured():
            return {
                "configured": False,
                "status": "NOT_CONFIGURED",
                "message": "WAHA_BASE_URL is not set in environment or config.",
                "base_url": self.base_url,
                "session": session or self.default_session
            }

        sess_name = session or self.default_session
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                # Try session-specific endpoint first
                resp = await client.get(
                    f"{self.base_url}/api/sessions/{sess_name}",
                    headers=self._get_headers()
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "configured": True,
                        "session": sess_name,
                        "status": data.get("status", "UNKNOWN"),
                        "me": data.get("me"),
                        "engine": data.get("engine"),
                        "raw": data
                    }
                elif resp.status_code == 404:
                    # Session does not exist yet
                    return {
                        "configured": True,
                        "session": sess_name,
                        "status": "STOPPED",
                        "message": f"Session '{sess_name}' is not running or does not exist."
                    }
                else:
                    return {
                        "configured": True,
                        "session": sess_name,
                        "status": "ERROR",
                        "status_code": resp.status_code,
                        "message": resp.text
                    }
        except Exception as e:
            logger.error(f"Error fetching WAHA status: {str(e)}")
            return {
                "configured": True,
                "session": sess_name,
                "status": "UNREACHABLE",
                "error": str(e),
                "base_url": self.base_url
            }

    async def start_session(self, session: Optional[str] = None) -> Dict[str, Any]:
        """
        Starts or creates a WhatsApp session in WAHA.
        """
        if not self.is_configured():
            raise ValueError("WAHA_BASE_URL is not configured.")

        sess_name = session or self.default_session
        payload = {
            "name": sess_name,
            "config": {
                "webhooks": [
                    {
                        "url": f"{settings.API_V1_STR}/whatsapp/webhook",
                        "events": ["message", "message.any", "state.change"]
                    }
                ]
            }
        }
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Try POST /api/sessions/start first, fallback to POST /api/sessions
            try:
                resp = await client.post(
                    f"{self.base_url}/api/sessions/start",
                    json={"name": sess_name},
                    headers=self._get_headers()
                )
                if resp.status_code in (200, 201):
                    return resp.json()
            except Exception:
                pass

            resp = await client.post(
                f"{self.base_url}/api/sessions",
                json=payload,
                headers=self._get_headers()
            )
            if resp.status_code not in (200, 201):
                raise RuntimeError(f"Failed to start WAHA session '{sess_name}': {resp.status_code} {resp.text}")
            return resp.json()

    async def stop_session(self, session: Optional[str] = None) -> Dict[str, Any]:
        """
        Stops an active WhatsApp session in WAHA.
        """
        if not self.is_configured():
            raise ValueError("WAHA_BASE_URL is not configured.")

        sess_name = session or self.default_session
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{self.base_url}/api/sessions/stop",
                json={"name": sess_name},
                headers=self._get_headers()
            )
            if resp.status_code not in (200, 204):
                # Try alternate path
                resp = await client.post(
                    f"{self.base_url}/api/sessions/{sess_name}/stop",
                    headers=self._get_headers()
                )
            return {"success": resp.status_code in (200, 204), "status_code": resp.status_code}

    async def get_qr(self, session: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves QR code image or data URL for scanning in the WhatsApp app.
        """
        if not self.is_configured():
            return {"error": "WAHA_BASE_URL is not configured"}

        sess_name = session or self.default_session
        async with httpx.AsyncClient(timeout=10.0) as client:
            # First check session auth QR endpoint
            urls_to_try = [
                f"{self.base_url}/api/{sess_name}/auth/qr",
                f"{self.base_url}/api/sessions/{sess_name}/auth/qr",
                f"{self.base_url}/api/screenshot?session={sess_name}"
            ]
            for url in urls_to_try:
                try:
                    resp = await client.get(url, headers=self._get_headers())
                    if resp.status_code == 200:
                        content_type = resp.headers.get("content-type", "")
                        if "image" in content_type:
                            import base64
                            b64 = base64.b64encode(resp.content).decode("utf-8")
                            return {
                                "format": "image",
                                "content_type": content_type,
                                "data_url": f"data:{content_type};base64,{b64}",
                                "raw_url": url
                            }
                        elif "json" in content_type:
                            return resp.json()
                except Exception as err:
                    logger.debug(f"QR probe {url} failed: {err}")

            return {"error": "Could not retrieve QR code. Session might already be connected or stopped."}

    async def send_text(
        self,
        chat_id: str,
        text: str,
        session: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sends a WhatsApp text message to a phone number, group, or user chatId.
        """
        if not self.is_configured():
            logger.warning(f"WAHA not configured. Mock message to {chat_id}: {text[:50]}...")
            return {
                "mock": True,
                "status": "sent",
                "chatId": format_whatsapp_chat_id(chat_id),
                "text": text,
                "message": "WAHA_BASE_URL not configured. Message simulated in mock mode."
            }

        formatted_id = format_whatsapp_chat_id(chat_id)
        sess_name = session or self.default_session
        payload = {
            "session": sess_name,
            "chatId": formatted_id,
            "text": text
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{self.base_url}/api/sendText",
                json=payload,
                headers=self._get_headers()
            )
            if resp.status_code not in (200, 201):
                logger.error(f"WAHA sendText failed ({resp.status_code}): {resp.text}")
                raise RuntimeError(f"WAHA sendText failed: {resp.status_code} {resp.text}")
            
            logger.info(f"WhatsApp message sent to {formatted_id} via session {sess_name}")
            return resp.json()

    async def send_file(
        self,
        chat_id: str,
        file_url: str,
        filename: Optional[str] = None,
        caption: Optional[str] = None,
        session: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sends an attachment (document, image, PDF) to a WhatsApp chat.
        """
        if not self.is_configured():
            return {
                "mock": True,
                "status": "sent",
                "chatId": format_whatsapp_chat_id(chat_id),
                "file_url": file_url,
                "caption": caption
            }

        formatted_id = format_whatsapp_chat_id(chat_id)
        sess_name = session or self.default_session
        payload = {
            "session": sess_name,
            "chatId": formatted_id,
            "file": {
                "url": file_url,
                "filename": filename or file_url.split("/")[-1] or "document"
            },
            "caption": caption or ""
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                f"{self.base_url}/api/sendFile",
                json=payload,
                headers=self._get_headers()
            )
            if resp.status_code not in (200, 201):
                raise RuntimeError(f"WAHA sendFile failed: {resp.status_code} {resp.text}")
            return resp.json()

    async def get_chats(self, session: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Retrieves recent chats from WAHA.
        """
        if not self.is_configured():
            return []

        sess_name = session or self.default_session
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{self.base_url}/api/chats?session={sess_name}&limit={limit}",
                headers=self._get_headers()
            )
            if resp.status_code == 200:
                return resp.json()
            return []

    async def get_chat_history(self, chat_id: str, session: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Retrieves recent messages from a specific WhatsApp chat.
        """
        if not self.is_configured():
            return []

        formatted_id = format_whatsapp_chat_id(chat_id)
        sess_name = session or self.default_session
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Try /api/messages endpoint which is standard in WAHA
            resp = await client.get(
                f"{self.base_url}/api/messages?session={sess_name}&chatId={formatted_id}&limit={limit}",
                headers=self._get_headers()
            )
            if resp.status_code == 200:
                return resp.json()
            # Try alternate WAHA endpoint format just in case
            resp = await client.get(
                f"{self.base_url}/api/chats/{formatted_id}/messages?session={sess_name}&limit={limit}",
                headers=self._get_headers()
            )
            if resp.status_code == 200:
                return resp.json()
            return []

    async def handle_webhook_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handles inbound WhatsApp webhook events from WAHA.
        If a new text message arrives from the founder or customer:
        1. Logs the message to shared memory / Company Feed.
        2. If WAHA_AUTO_DISPATCH_MANDATE is True and message is not from ourselves,
           triggers the Personal Assistant with the mandate!
        3. Sends an automated response confirming mandate receipt.
        """
        event = payload.get("event")
        data = payload.get("payload", {})
        session = payload.get("session") or self.default_session

        logger.info(f"Received WAHA webhook event: {event}")

        if event in ("message", "message.any"):
            # Check if this message was sent by us (fromMe = True)
            from_me = data.get("fromMe", False)
            if from_me:
                return {"status": "ignored", "reason": "message sent by self"}

            chat_id = data.get("from") or data.get("chatId") or ""
            body = data.get("body") or data.get("text") or ""
            sender_name = data.get("_data", {}).get("notifyName") or data.get("author") or "WhatsApp User"

            if not body or not chat_id:
                return {"status": "ignored", "reason": "empty body or chat_id"}

            logger.info(f"Inbound WhatsApp from {sender_name} ({chat_id}): {body}")

            # 1. Record to Shared Memory
            try:
                from app.services.shared_memory import SharedMemoryService
                mem = SharedMemoryService()
                msg_val = {
                    "chat_id": chat_id,
                    "sender": sender_name,
                    "text": body,
                    "timestamp": data.get("timestamp")
                }
                mem.set(
                    business_id="00000000-0000-0000-0000-000000000001",
                    key=f"whatsapp_last_msg_{chat_id}",
                    value=msg_val,
                    tags=["whatsapp", "inbound", "communication"]
                )
                mem.set(
                    business_id="00000000-0000-0000-0000-000000000001",
                    key="whatsapp_last_active_user",
                    value=msg_val,
                    tags=["whatsapp", "user", "active"]
                )
            except Exception as e:
                logger.error(f"Error saving WhatsApp to memory: {e}")

            # 2. Dispatch Mandate to Personal Assistant if enabled
            if settings.WAHA_AUTO_DISPATCH_MANDATE:
                try:
                    from app.services.task_service import TaskService
                    from app.agents.runner import AutonomousRunner
                    import asyncio

                    task_service = TaskService()
                    mandate_desc = f"[WhatsApp from {sender_name}]: {body}"
                    
                    # Create task in DB
                    task = task_service.create_task(
                        business_id="00000000-0000-0000-0000-000000000001",
                        description=mandate_desc,
                        mandate=mandate_desc,
                        status="queued",
                        assignee_role="Personal Assistant"
                    )

                    # Log to Company Feed
                    task_service.log_audit_event(
                        business_id="00000000-0000-0000-0000-000000000001",
                        role="Personal Assistant",
                        agent_name="Personal Assistant",
                        trust_tier="operate",
                        action="WhatsApp Mandate Ingested",
                        details={"from": sender_name, "chat_id": chat_id, "mandate": body}
                    )

                    # Trigger runner in background
                    runner = AutonomousRunner(business_id="00000000-0000-0000-0000-000000000001", prompt=mandate_desc)
                    asyncio.create_task(asyncio.to_thread(runner.start))

                    # 3. Acknowledge receipt via WhatsApp
                    try:
                        reply_text = (
                            f"🤖 *Company OS*: Mandate received from {sender_name}!\n\n"
                            f"📋 *Task*: \"{body}\"\n"
                            f"✨ Your Personal Assistant is now coordinating the team to execute this."
                        )
                        await self.send_text(chat_id=chat_id, text=reply_text, session=session)
                    except Exception as err:
                        logger.error(f"Error sending WhatsApp acknowledgment: {err}")

                    return {
                        "status": "mandate_dispatched",
                        "task_id": task.get("id") if isinstance(task, dict) else str(task),
                        "chat_id": chat_id
                    }
                except Exception as e:
                    logger.error(f"Error auto-dispatching WhatsApp mandate: {e}")
                    return {"status": "error", "error": str(e)}

        return {"status": "processed", "event": event}


# Global singleton instance
waha_service = WAHAService()
