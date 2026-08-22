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

    def test_cross_user_connection_isolation(self):
        """
        Regression test: Connected accounts for User A must NEVER leak into or influence
        User B's connection list or status, and vice versa.
        """
        user_a = "user_aaaa-1111-2222-3333-444444444444"
        user_b = "user_bbbb-5555-6666-7777-888888888888"

        # Mock live composio accounts to avoid external network calls during unit test
        with patch.object(self.service, "_fetch_live_composio_accounts", return_value={}):
            # 1. Connect Gmail for User A only
            self.service.set_connection_status(
                user_id=user_a,
                toolkit="gmail",
                status="connected",
                connection_id="ca_user_a_gmail"
            )

            # 2. Check User A connections
            conns_a = {c["toolkit"]: c for c in self.service.list_user_connections(user_id=user_a)}
            self.assertEqual(conns_a["gmail"]["status"], "connected")
            self.assertEqual(conns_a["gmail"]["composio_connection_id"], "ca_user_a_gmail")

            # 3. Check User B connections - must be strictly disconnected for Gmail
            conns_b = {c["toolkit"]: c for c in self.service.list_user_connections(user_id=user_b)}
            self.assertEqual(conns_b["gmail"]["status"], "disconnected")
            self.assertIsNone(conns_b["gmail"]["composio_connection_id"])
            self.assertEqual(self.service.get_connection_status(user_id=user_b, toolkit="gmail"), "disconnected")

            # 4. Connect Slack for User B only
            self.service.set_connection_status(
                user_id=user_b,
                toolkit="slack",
                status="connected",
                connection_id="ca_user_b_slack"
            )

            # 5. Re-verify User A: has Gmail connected, but Slack disconnected
            conns_a2 = {c["toolkit"]: c for c in self.service.list_user_connections(user_id=user_a)}
            self.assertEqual(conns_a2["gmail"]["status"], "connected")
            self.assertEqual(conns_a2["slack"]["status"], "disconnected")
            self.assertIsNone(conns_a2["slack"]["composio_connection_id"])

            # 6. Re-verify User B: has Slack connected, but Gmail disconnected
            conns_b2 = {c["toolkit"]: c for c in self.service.list_user_connections(user_id=user_b)}
            self.assertEqual(conns_b2["slack"]["status"], "connected")
            self.assertEqual(conns_b2["slack"]["composio_connection_id"], "ca_user_b_slack")
            self.assertEqual(conns_b2["gmail"]["status"], "disconnected")


if __name__ == "__main__":
    unittest.main()
