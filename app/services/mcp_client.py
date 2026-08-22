import json
import logging
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class MCPClientError(Exception):
    """Raised when an MCP server call fails."""
    pass


class MCPClient:
    """
    Lightweight HTTP client for Model Context Protocol (MCP) servers.

    Each MCP server is expected to expose a JSON-RPC-like endpoint at:
        POST {server_url}/call
    with a body like:
        {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": {...}},
            "id": 1
        }

    The exact transport is intentionally simple so it can adapt to most MCP
    bridge implementations (e.g., a small FastAPI wrapper around an MCP stdio
    server, or a native HTTP MCP server).
    """

    def __init__(
        self,
        server_url: str,
        api_key: Optional[str] = None,
        custom_headers: Optional[Dict[str, str]] = None,
        timeout: float = 30.0,
    ):
        self.server_url = server_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

        headers: Dict[str, str] = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        if custom_headers:
            headers.update(custom_headers)

        self.client = httpx.Client(base_url=self.server_url, headers=headers, timeout=timeout)

    def _build_payload(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": arguments},
            "id": 1,
        }

    def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """
        Call a tool on the MCP server and return the structured result.
        """
        payload = self._build_payload(tool_name, arguments)
        try:
            response = self.client.post("/call", json=payload)
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise MCPClientError(
                f"MCP server returned {e.response.status_code}: {e.response.text}"
            ) from e
        except httpx.RequestError as e:
            raise MCPClientError(f"MCP server request failed: {e}") from e

        try:
            data = response.json()
        except json.JSONDecodeError as e:
            raise MCPClientError(f"MCP server returned invalid JSON: {response.text}") from e

        if not isinstance(data, dict):
            raise MCPClientError(f"MCP server returned unexpected response type: {type(data)}")

        error = data.get("error")
        if error:
            raise MCPClientError(f"MCP tool error: {error}")

        result = data.get("result")
        if result is None:
            raise MCPClientError(f"MCP server response missing 'result' field: {data}")

        # Some MCP servers return content as a list of text/image objects.
        if isinstance(result, dict) and "content" in result:
            content = result["content"]
            if isinstance(content, list):
                text_parts = [
                    item.get("text", "") for item in content if isinstance(item, dict) and item.get("type") == "text"
                ]
                return "\n".join(text_parts) if text_parts else content
            return content

        return result

    def check(self) -> Dict[str, Any]:
        """
        Lightweight connectivity check. Returns a dict with reachable status.
        """
        try:
            response = self.client.get("/health", timeout=5.0)
            response.raise_for_status()
            return {"reachable": True, "status": response.status_code}
        except Exception as e:
            return {"reachable": False, "error": str(e)}

    def __del__(self):
        try:
            self.client.close()
        except Exception:
            pass


# --- Per-tool MCP client factory helpers ---

def get_mcp_client(name: str, user_id: Optional[str] = None) -> Optional[MCPClient]:
    """
    Build an MCPClient for a named external service.
    
    1. If user_id is provided and MCP_FALLBACK_MODE is False:
       First checks if a per-user Composio MCP session is available.
       If active, returns an MCPClient pointed to the user's Composio session.
    2. Otherwise, falls back to the static env-var-configured MCP server.
    3. Returns None if MCP fallback mode is enabled or no server is configured.
    """
    if getattr(settings, "MCP_FALLBACK_MODE", True):
        return None

    # Try per-user Composio MCP session if user_id is given
    if user_id:
        try:
            from app.services.composio_client import composio_service
            session = composio_service.get_mcp_session(user_id=user_id)
            if session and session.get("url"):
                return MCPClient(
                    server_url=session["url"],
                    custom_headers=session.get("headers")
                )
        except Exception as e:
            logger.debug(f"Per-user Composio MCP lookup note for {user_id}: {e}")

    # Static / shared MCP server fallback
    server_url: Optional[str] = getattr(settings, f"{name.upper()}_MCP_URL", None)
    api_key: Optional[str] = getattr(settings, f"{name.upper()}_MCP_API_KEY", None)

    if not server_url:
        return None

    return MCPClient(server_url=server_url, api_key=api_key)


def mcp_call_or_default(
    mcp_name: str,
    tool_name: str,
    arguments: Dict[str, Any],
    default_result: Any,
    error_result: Any = None,
    user_id: Optional[str] = None,
) -> Any:
    """
    Convenience wrapper: call an MCP tool if configured, otherwise return the default.
    """
    client = get_mcp_client(mcp_name, user_id=user_id)
    if client is None:
        return default_result

    try:
        return client.call_tool(tool_name, arguments)
    except MCPClientError as e:
        logger.warning(f"MCP call failed for {mcp_name}/{tool_name}: {e}. Returning default.")
        return error_result if error_result is not None else default_result
