import unittest
from unittest.mock import patch, MagicMock
from app.services.composio_client import ComposioService, composio_service, ComposioClientError


class TestComposioClientService(unittest.TestCase):
    def setUp(self):
        self.service = ComposioService(api_key="test_composio_key")

    def test_initiate_connection_fallback_url(self):
        """When SDK/REST is unmocked or in dev mode, initiate_connection generates a valid callback URL."""
        res = self.service.initiate_connection(
            user_id="user_12345678-0000-0000-0000-000000000000",
            toolkit="gmail"
        )
        self.assertIn("redirect_url", res)
        self.assertEqual(res["toolkit"], "gmail")
        self.assertEqual(res["status"], "pending")
        self.assertIn("toolkit=gmail", res["redirect_url"])

    def test_list_user_connections_all_toolkits(self):
        """list_user_connections returns all supported toolkits with their status."""
        items = self.service.list_user_connections(user_id="user_12345678-0000-0000-0000-000000000000")
        toolkits = [item["toolkit"] for item in items]
        self.assertIn("gmail", toolkits)
        self.assertIn("slack", toolkits)
        self.assertIn("notion", toolkits)
        self.assertIn("github", toolkits)
        self.assertIn("googlecalendar", toolkits)
        self.assertIn("googlesheets", toolkits)

    def test_get_mcp_session_returns_none_when_no_active_connection(self):
        """If user has no connected accounts, get_mcp_session returns None."""
        with patch.object(self.service, "list_user_connections", return_value=[{"toolkit": "gmail", "status": "disconnected"}]):
            session = self.service.get_mcp_session(user_id="user_123")
            self.assertIsNone(session)

    def test_get_mcp_session_returns_endpoint_when_connected(self):
        """If user has connected accounts and API key is set, returns MCP session dict."""
        with patch.object(self.service, "list_user_connections", return_value=[{"toolkit": "gmail", "status": "connected"}]):
            session = self.service.get_mcp_session(user_id="user_123")
            self.assertIsNotNone(session)
            self.assertIn("url", session)
            self.assertIn("headers", session)
            self.assertEqual(session["headers"]["x-user-id"], "user_123")
            self.assertEqual(session["headers"]["x-api-key"], "test_composio_key")

    def test_disconnect_sets_status(self):
        """disconnect calls upsert with disconnected status."""
        with patch.object(self.service, "_upsert_account_record") as mock_upsert:
            self.service.disconnect(user_id="user_123", toolkit="slack")
            mock_upsert.assert_called_once_with(
                user_id="user_123",
                toolkit="slack",
                status="disconnected",
                connection_id=None
            )


if __name__ == "__main__":
    unittest.main()
