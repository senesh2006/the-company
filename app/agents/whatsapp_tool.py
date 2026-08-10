import json
import logging
import asyncio
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from app.agents.tool_registry import BaseTool, registry
from app.services.waha_service import waha_service, format_whatsapp_chat_id
from app.core.config import settings

logger = logging.getLogger(__name__)


class WhatsAppSendMessageInput(BaseModel):
    chat_id: str = Field(
        description="The recipient phone number or WhatsApp chat ID (e.g. '+1234567890', '1234567890@c.us', or 'founder')"
    )
    message: str = Field(
        description="The text content of the message to send via WhatsApp."
    )


class WhatsAppSendMessageTool(BaseTool):
    """
    Allows agents to send WhatsApp messages, notifications, executive briefs,
    and alerts to customers or the founder via WAHA.
    """
    name = "send_whatsapp_message"
    description = (
        "Send a WhatsApp message or alert to a phone number, group, or founder via WAHA WhatsApp API. "
        "Use 'founder' as chat_id to automatically message the founder's phone number."
    )
    args_schema = WhatsAppSendMessageInput
    cost_estimate = 0.005

    def _run(self, chat_id: str, message: str) -> str:
        # If chat_id is 'founder' or 'me', use WAHA_FOUNDER_PHONE
        target_id = chat_id
        if chat_id.strip().lower() in ("founder", "me", "owner", "admin"):
            target_id = settings.WAHA_FOUNDER_PHONE or chat_id
            if not target_id:
                return (
                    f"Warning: WAHA_FOUNDER_PHONE is not configured in settings. "
                    f"Please provide a direct phone number or configure WAHA_FOUNDER_PHONE."
                )

        try:
            # Run async send_text in sync tool execution context
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    result = pool.submit(
                        asyncio.run,
                        waha_service.send_text(chat_id=target_id, text=message)
                    ).result()
            else:
                result = loop.run_until_complete(
                    waha_service.send_text(chat_id=target_id, text=message)
                )

            formatted = format_whatsapp_chat_id(target_id)
            return f"WhatsApp message successfully dispatched to {formatted}: '{message[:60]}...'"
        except Exception as e:
            logger.error(f"WhatsApp tool error: {str(e)}")
            return f"WhatsApp tool execution encountered error: {str(e)}"


class WhatsAppCheckStatusInput(BaseModel):
    session: Optional[str] = Field("default", description="WhatsApp session name in WAHA")


class WhatsAppCheckStatusTool(BaseTool):
    """
    Allows agents to check if WhatsApp connectivity is online and ready.
    """
    name = "check_whatsapp_status"
    description = "Check the connectivity and session status of the WAHA WhatsApp API gateway."
    args_schema = WhatsAppCheckStatusInput
    cost_estimate = 0.001

    def _run(self, session: Optional[str] = "default") -> str:
        try:
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    status_data = pool.submit(
                        asyncio.run,
                        waha_service.get_status(session=session)
                    ).result()
            else:
                status_data = loop.run_until_complete(
                    waha_service.get_status(session=session)
                )

            return json.dumps(status_data, indent=2)
        except Exception as e:
            return f"Failed to check WhatsApp status: {str(e)}"


class TextUserInput(BaseModel):
    message: str = Field(
        description="The message, answer, update, question, or report to text directly to the user on WhatsApp."
    )


class TextUserWhatsAppTool(BaseTool):
    """
    Direct tool for any agent to text the user/founder on WhatsApp.
    """
    name = "text_user_whatsapp"
    description = (
        "Text the user / founder directly on WhatsApp. "
        "Use this tool to send updates, ask clarifying questions, send deliverables, or give summaries directly to the user's phone."
    )
    args_schema = TextUserInput
    cost_estimate = 0.005

    def _run(self, message: str) -> str:
        target_id = settings.WAHA_FOUNDER_PHONE
        if not target_id:
            # Check shared memory for last active WhatsApp chatter
            try:
                from app.services.shared_memory import SharedMemoryService
                mem = SharedMemoryService()
                last_chat = mem.get(getattr(self, "business_id", "00000000-0000-0000-0000-000000000001"), "whatsapp_last_active_user")
                if last_chat and isinstance(last_chat.get("value"), dict):
                    target_id = last_chat["value"].get("chat_id")
            except Exception:
                pass

        if not target_id:
            return (
                "Could not text user: WAHA_FOUNDER_PHONE is not configured in settings, "
                "and no incoming WhatsApp user has been recorded yet."
            )

        try:
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    result = pool.submit(
                        asyncio.run,
                        waha_service.send_text(chat_id=target_id, text=message)
                    ).result()
            else:
                result = loop.run_until_complete(
                    waha_service.send_text(chat_id=target_id, text=message)
                )

            formatted = format_whatsapp_chat_id(target_id)
            return f"Successfully texted user on WhatsApp ({formatted}): '{message[:60]}...'"
        except Exception as e:
            logger.error(f"Text user WhatsApp error: {str(e)}")
            return f"Failed to text user on WhatsApp: {str(e)}"


# Register WhatsApp tools to global registry for key worker roles
whatsapp_send_tool = WhatsAppSendMessageTool()
whatsapp_text_user_tool = TextUserWhatsAppTool()
whatsapp_status_tool = WhatsAppCheckStatusTool()

# Register to Personal Assistant, Admin/Ops, Marketing, Finance, and Customer Support
for role in [
    "Personal Assistant",
    "Admin/Ops",
    "Admin & Operations Worker",
    "Social Media Manager",
    "Social Media & Growth Lead",
    "Accountant",
    "Accountant & Controller",
    "Customer Support",
    "Coder",
    "Researcher",
    "default"
]:
    registry.register_tools(role, [whatsapp_send_tool, whatsapp_text_user_tool, whatsapp_status_tool])

