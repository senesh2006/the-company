import json
import logging
import threading
from collections import deque
from typing import Dict, Any, List
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class UIControlService:
    """
    Real-Time AI Web-App Command & Control Service.
    Uses a polling-based command buffer instead of SSE to avoid HTTP/2 proxy
    connection drops (ERR_HTTP2_PROTOCOL_ERROR) on platforms like Railway.
    AI agents push commands into a bounded deque; the browser polls /api/v1/ui/poll
    every 3 seconds to collect pending directives.
    """

    _command_buffer: deque = deque(maxlen=100)
    _lock = threading.Lock()

    @classmethod
    def dispatch_ui_command(
        cls,
        action: str,  # 'NAVIGATE', 'OPEN_MODAL', 'SHOW_TOAST', 'HIGHLIGHT', 'CUSTOMIZE_KPI'
        payload: Dict[str, Any],
        business_id: str = "00000000-0000-0000-0000-000000000001"
    ) -> Dict[str, Any]:
        """
        Broadcasts a UI action directive from an AI agent into the command buffer.
        """
        event_data = {
            "action": action,
            "payload": payload,
            "business_id": business_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        logger.info(f"Broadcasting AI UI Directive: [{action}] -> {payload}")

        with cls._lock:
            cls._command_buffer.append(event_data)

        return event_data

    @classmethod
    def poll_commands(cls, since: str = None, business_id: str = None) -> List[Dict[str, Any]]:
        """
        Returns all pending commands since the given ISO timestamp.
        If since is None, returns the last 10 commands.
        """
        with cls._lock:
            commands = list(cls._command_buffer)

        if since:
            try:
                since_dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
                commands = [
                    c for c in commands
                    if datetime.fromisoformat(c["timestamp"].replace("Z", "+00:00")) > since_dt
                ]
            except (ValueError, KeyError):
                pass

        if business_id:
            commands = [c for c in commands if c.get("business_id") == business_id]

        return commands
