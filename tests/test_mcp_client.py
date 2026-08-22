import json
import pytest
import httpx
from unittest.mock import patch, Mock

from app.services.mcp_client import MCPClient, MCPClientError, mcp_call_or_default, get_mcp_client


class TestMCPClient:
    def test_call_tool_success(self):
        """MCPClient should parse a successful JSON-RPC response."""
        client = MCPClient(server_url="http://localhost:9999", api_key="test-key")
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "result": {"balance": 48250.00},
            "id": 1,
        }
        mock_response.raise_for_status = Mock()
        mock_response.text = json.dumps(mock_response.json.return_value)

        with patch.object(client.client, "post", return_value=mock_response):
            result = client.call_tool("read_balance", {"account": "1050"})

        assert result == {"balance": 48250.00}

    def test_call_tool_error_response(self):
        """MCPClient should raise MCPClientError when the server returns an error."""
        client = MCPClient(server_url="http://localhost:9999")
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "error": {"code": -32601, "message": "Method not found"},
            "id": 1,
        }
        mock_response.raise_for_status = Mock()

        with patch.object(client.client, "post", return_value=mock_response):
            with pytest.raises(MCPClientError):
                client.call_tool("missing_tool", {})

    def test_call_tool_http_error(self):
        """MCPClient should raise MCPClientError on HTTP errors."""
        client = MCPClient(server_url="http://localhost:9999")
        error_response = Mock()
        error_response.status_code = 500
        error_response.text = "Internal Server Error"
        error_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Server error", request=Mock(), response=error_response
        )

        with patch.object(client.client, "post", return_value=error_response):
            with pytest.raises(MCPClientError):
                client.call_tool("read_balance", {})


class TestMCPFallback:
    def test_get_mcp_client_returns_none_in_fallback_mode(self):
        """When MCP_FALLBACK_MODE is True, get_mcp_client should return None."""
        client = get_mcp_client("stripe")
        assert client is None

    def test_mcp_call_or_default_returns_default_in_fallback_mode(self):
        """mcp_call_or_default should return the default when no MCP client is configured."""
        result = mcp_call_or_default("stripe", "read_charges", {"customer_id": "cus_123"}, "default")
        assert result == "default"

    def test_mcp_call_or_default_calls_client_when_configured(self):
        """mcp_call_or_default should call the MCP client if one is configured."""
        mock_client = Mock()
        mock_client.call_tool.return_value = {"charges": []}

        with patch("app.services.mcp_client.get_mcp_client", return_value=mock_client):
            with patch("app.services.mcp_client.settings.MCP_FALLBACK_MODE", False):
                result = mcp_call_or_default("stripe", "read_charges", {"customer_id": "cus_123"}, "default")

        assert result == {"charges": []}
        mock_client.call_tool.assert_called_once_with("read_charges", {"customer_id": "cus_123"})


class TestPerUserComposioMCP:
    def test_get_mcp_client_uses_composio_session_when_available(self):
        """When user_id is provided and Composio session exists, get_mcp_client should use it."""
        mock_session = {
            "url": "https://connect.composio.dev/mcp",
            "headers": {"x-api-key": "comp_key", "x-user-id": "user_abc"}
        }

        with patch("app.services.composio_client.composio_service.get_mcp_session", return_value=mock_session):
            with patch("app.services.mcp_client.settings.MCP_FALLBACK_MODE", False):
                client = get_mcp_client("gmail", user_id="user_abc")
                assert client is not None
                assert client.server_url == "https://connect.composio.dev/mcp"

    def test_get_mcp_client_falls_back_to_static_when_no_user_session(self):
        """When no Composio session exists for user, falls back to static env MCP server."""
        with patch("app.services.composio_client.composio_service.get_mcp_session", return_value=None):
            with patch("app.services.mcp_client.settings.MCP_FALLBACK_MODE", False):
                with patch("app.services.mcp_client.settings.SLACK_MCP_URL", "http://static-slack:8080"):
                    client = get_mcp_client("slack", user_id="user_abc")
                    assert client is not None
                    assert client.server_url == "http://static-slack:8080"


class TestMCPCompression:
    def test_large_tool_result_compressed_under_nvidia(self):
        """When NVIDIA NIM is the active provider, large tool responses should be compressed."""
        large_content = "Item row entry data log transaction detail. " * 150
        mock_client = Mock()
        mock_client.call_tool.return_value = large_content

        mock_compressor = Mock()
        mock_compressor.compress_prompt.return_value = {"compressed_prompt": "Item row entry data log transaction detail."}

        with patch("app.services.mcp_client.get_mcp_client", return_value=mock_client), \
             patch("app.services.context_compressor.ContextCompressor._get_compressor", return_value=mock_compressor), \
             patch("app.services.mcp_client.settings.MCP_FALLBACK_MODE", False), \
             patch("app.services.mcp_client.is_nvidia_provider_active", return_value=True), \
             patch("app.services.mcp_client.settings.MCP_COMPRESS_THRESHOLD_TOKENS", 100):

            result = mcp_call_or_default("gmail", "fetch_inbox", {}, default_result="")
            assert len(result) < len(large_content)



