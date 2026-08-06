import asyncio
import json
import logging
from typing import AsyncGenerator, Dict, Any, List
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class UIControlService:
    """
    Real-Time AI Web-App Command & Control Service.
    Maintains subscriber queues for Server-Sent Events (SSE) streaming UI control directives
    (navigation, modal triggers, toast notifications, component highlights, KPI customization)
    directly to active user browser sessions.
    """

    _subscribers: List[asyncio.Queue] = []

    @classmethod
    async def subscribe(cls) -> AsyncGenerator[str, None]:
        """
        Subscribe a client browser to the real-time SSE stream.
        """
        queue = asyncio.Queue()
        cls._subscribers.append(queue)
        logger.info(f"New browser session connected to UI Agent Control Bus. Total active: {len(cls._subscribers)}")
        
        try:
            # Send initial ping event
            yield f"data: {json.dumps({'type': 'CONNECTED', 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
            
            while True:
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            logger.info("Browser session disconnected from UI Agent Control Bus.")
        finally:
            if queue in cls._subscribers:
                cls._subscribers.remove(queue)

    @classmethod
    def dispatch_ui_command(
        cls,
        action: str,  # 'NAVIGATE', 'OPEN_MODAL', 'SHOW_TOAST', 'HIGHLIGHT', 'CUSTOMIZE_KPI'
        payload: Dict[str, Any],
        business_id: str = "default-business-id"
    ) -> Dict[str, Any]:
        """
        Broadcasts a UI action directive from an AI agent to all active browser sessions.
        """
        event_data = {
            "action": action,
            "payload": payload,
            "business_id": business_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        logger.info(f"Broadcasting AI UI Directive: [{action}] -> {payload}")

        # Put into all active queues
        for queue in list(cls._subscribers):
            try:
                queue.put_nowait(event_data)
            except Exception as e:
                logger.warning(f"Failed to queue UI command: {e}")

        return event_data
