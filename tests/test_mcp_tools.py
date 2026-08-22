import json
from unittest.mock import patch, Mock

from app.agents.finance_tools import (
    SupabaseLedgerTool,
    StripeFinanceTool,
    GoogleWorkspaceTool,
    NotionTool,
    PlaywrightTool,
    BraveSearchTool,
    FetchTool,
    CommTool,
)
from app.agents.marketing_tools import (
    BraveSearchTool as MarketingBraveSearchTool,
    PlaywrightTool as MarketingPlaywrightTool,
    NotionTool as MarketingNotionTool,
    GoogleWorkspaceTool as MarketingGoogleWorkspaceTool,
    CommTool as MarketingCommTool,
    FetchTool as MarketingFetchTool,
    Context7Tool,
)
from app.agents.admin_tools import (
    InboxTriageTool,
    CalendarScheduleTool,
    HelpdeskTicketTool,
)
from app.agents.tools import (
    SearchWebTool,
    SendEmailTool,
    CreateCalendarEventTool,
    RequestCollaborationTool,
)


class TestFinanceToolsFallback:
    """All finance tools should return their mock defaults when no MCP server is configured."""

    def test_supabase_ledger_read_transactions(self):
        tool = SupabaseLedgerTool()
        result = tool.run(action="read_transactions")
        data = json.loads(result)
        assert len(data) == 5
        assert data[0]["id"] == "tx_101"

    def test_supabase_ledger_chart_of_accounts(self):
        tool = SupabaseLedgerTool()
        result = tool.run(action="get_chart_of_accounts")
        data = json.loads(result)
        assert "Assets (1000s)" in data

    def test_stripe_finance_read_charges(self):
        with patch("app.agents.finance_tools.settings.STRIPE_API_KEY", None):
            tool = StripeFinanceTool()
            result = tool.run(action="read_charges", customer_id="cus_test")
            data = json.loads(result)
            assert len(data) == 2
            assert data[0]["customer"] == "cus_test"

    def test_google_workspace_sheets(self):
        tool = GoogleWorkspaceTool()
        result = tool.run(app="sheets", action="read", target="Budget")
        assert "$15,000" in result

    def test_notion_read_policy(self):
        tool = NotionTool()
        result = tool.run(action="read_policy")
        assert "Zero unattended external money movement" in result

    def test_playwright_browser(self):
        tool = PlaywrightTool()
        result = tool.run(action="download_statement")
        assert "$48,250.00" in result

    def test_brave_search(self):
        with patch("app.services.web_search.search_web", return_value="Search results for 'corporate tax rate':\n1. US corporate tax rate is 21%."):
            tool = BraveSearchTool()
            result = tool.run(query="corporate tax rate")
        assert "21%" in result

    def test_brave_search_falls_back_when_free_search_fails(self):
        with patch("app.services.web_search.search_web", return_value="Free web search for 'corporate tax rate' failed: network error"):
            tool = BraveSearchTool()
            result = tool.run(query="corporate tax rate")
        assert "21%" in result

    def test_fetch_api(self):
        tool = FetchTool()
        result = tool.run(url="https://api.example.com/fx")
        assert "USD" in result

    def test_comm_tool(self):
        tool = CommTool()
        result = tool.run(platform="slack", channel_or_user="#finance", message="test")
        assert "Notification successfully dispatched" in result


class TestMarketingToolsFallback:
    def test_marketing_brave_search(self):
        with patch("app.services.web_search.search_web", return_value="Search results for 'AI trends':\n1. AI adoption is growing."):
            tool = MarketingBraveSearchTool()
            result = tool.run(query="AI trends")
        assert "Search results" in result

    def test_marketing_playwright(self):
        tool = MarketingPlaywrightTool()
        result = tool.run(action="post_tweet", content="Hello")
        assert "Playwright executed" in result

    def test_marketing_notion_read_calendar(self):
        tool = MarketingNotionTool()
        result = tool.run(action="read_calendar")
        assert "Content Calendar" in result

    def test_marketing_google_workspace(self):
        tool = MarketingGoogleWorkspaceTool()
        result = tool.run(app="gmail", action="read", target="inbox")
        assert "Google gmail" in result

    def test_marketing_comm(self):
        tool = MarketingCommTool()
        result = tool.run(platform="slack", channel_or_user="#general", message="hello")
        assert "Communication sent" in result

    def test_marketing_fetch(self):
        tool = MarketingFetchTool()
        result = tool.run(url="https://example.com")
        assert result  # should return a string (either content or error)

    def test_context7(self):
        tool = Context7Tool()
        tool.business_id = "biz_test"
        result = tool.run(query="brand voice")
        assert "Context7" in result


class TestAdminToolsFallback:
    def test_inbox_triage_fetch_unread(self):
        tool = InboxTriageTool()
        result = tool.run(action="fetch_unread")
        data = json.loads(result)
        assert isinstance(data, list)

    def test_calendar_schedule(self):
        tool = CalendarScheduleTool()
        result = tool.run(action="schedule_meeting", title="Sync", time_slot="2026-08-05 14:00 UTC", attendees=["a@b.com"])
        assert "booked" in result

    def test_helpdesk_ticket(self):
        tool = HelpdeskTicketTool()
        result = tool.run(action="list_open")
        data = json.loads(result)
        assert isinstance(data, list)


class TestCommonToolsFallback:
    def test_search_web(self):
        tool = SearchWebTool()
        result = tool.run(query="AI trends")
        assert "Found 3 relevant" in result

    def test_send_email(self):
        tool = SendEmailTool()
        result = tool.run(to_email="test@example.com", subject="Hello", body="Body")
        assert "queued" in result

    def test_create_calendar_event(self):
        tool = CreateCalendarEventTool()
        result = tool.run(title="Sync", start_time="2026-08-05T14:00", end_time="2026-08-05T15:00", attendees=["a@b.com"])
        assert "scheduled" in result


class TestCollaborationTool:
    def test_request_collaboration_writes_to_memory(self):
        tool = RequestCollaborationTool(business_id="biz_test", main_task_id="task_1")
        result = tool.run(target_role="Finance Manager", request="Provide budget", context="Q3")
        assert "Collaboration request" in result
        assert "PENDING" in result


class TestRealMCPPaths:
    """Verify that when an MCP client is configured, the real path is used."""

    def test_supabase_ledger_uses_mcp_client(self):
        mock_client = Mock()
        mock_client.call_tool.return_value = json.dumps([{"id": "tx_real", "amount": 100.00}])

        with patch("app.agents.finance_tools.mcp_call_or_default") as mock_mcp:
            mock_mcp.return_value = json.dumps([{"id": "tx_real", "amount": 100.00}])
            tool = SupabaseLedgerTool()
            result = tool.run(action="read_transactions")

        assert "tx_real" in result
        mock_mcp.assert_called_once()

    def test_stripe_finance_uses_mcp_client_when_no_api_key(self):
        """Without STRIPE_API_KEY configured, StripeFinanceTool should use the MCP/mock path."""
        with patch("app.agents.finance_tools.settings.STRIPE_API_KEY", None):
            with patch("app.agents.finance_tools.mcp_call_or_default") as mock_mcp:
                mock_mcp.return_value = json.dumps([{"charge_id": "ch_real"}])
                tool = StripeFinanceTool()
                result = tool.run(action="read_charges", customer_id="cus_real")

        assert "ch_real" in result
        mock_mcp.assert_called_once()

    def test_stripe_finance_uses_stripe_sdk_when_api_key_is_set(self):
        """When STRIPE_API_KEY is set, StripeFinanceTool should call the Stripe SDK directly."""
        mock_charge = Mock()
        mock_charge.id = "ch_123"
        mock_charge.customer = "cus_real"
        mock_charge.amount = 25000
        mock_charge.currency = "usd"
        mock_charge.status = "succeeded"
        mock_charge.balance_transaction = None
        mock_charge.created = 1700000000

        mock_list = Mock()
        mock_list.auto_paging_iter.return_value = [mock_charge]

        mock_stripe = Mock()
        mock_stripe.Charge.list.return_value = mock_list

        with patch("app.agents.finance_tools.settings.STRIPE_API_KEY", "sk_test_123"):
            with patch.dict("sys.modules", {"stripe": mock_stripe}):
                tool = StripeFinanceTool()
                result = tool.run(action="read_charges", customer_id="cus_real")

        data = json.loads(result)
        assert len(data) == 1
        assert data[0]["charge_id"] == "ch_123"
        assert data[0]["amount"] == 250.00

    def test_stripe_finance_falls_back_when_stripe_sdk_errors(self):
        """If the Stripe SDK raises an error, the tool should return a clear error message."""
        mock_stripe = Mock()
        mock_stripe.Charge.list.side_effect = Exception("network error")

        with patch("app.agents.finance_tools.settings.STRIPE_API_KEY", "sk_test_123"):
            with patch.dict("sys.modules", {"stripe": mock_stripe}):
                tool = StripeFinanceTool()
                result = tool.run(action="read_charges", customer_id="cus_real")

        assert "Stripe integration error" in result
