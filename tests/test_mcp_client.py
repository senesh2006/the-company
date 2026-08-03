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
