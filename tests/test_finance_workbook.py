import pytest
from unittest.mock import MagicMock, patch
from app.services.google_sheets_service import GoogleSheetsService
from app.services.composio_client import composio_service, ComposioClientError

def test_google_sheets_service_workbook_data():
    service = GoogleSheetsService(business_id="test-biz-workbook-001")
    # Initialize some accounts
    service.create_dynamic_financial_system(
        sheet_title="Test Startup Master Financials",
        accounts=[
            {"code": "1000", "name": "Cash", "category": "Assets", "type": "Current Asset", "balance": 100000.0, "normal_balance": "Debit"},
            {"code": "4000", "name": "SaaS Revenue", "category": "Revenue", "type": "Operating Revenue", "balance": 25000.0, "normal_balance": "Credit"},
            {"code": "5000", "name": "Hosting Costs", "category": "COGS", "type": "COGS", "balance": 5000.0, "normal_balance": "Debit"},
            {"code": "6000", "name": "Payroll", "category": "OPEX", "type": "Operating Expense", "balance": 12000.0, "normal_balance": "Debit"},
        ],
        journal_entries=[
            {"id": "JE-001", "date": "2026-08-01", "reference": "REV-01", "description": "August SaaS Subscriptions", "debit_account": "1000", "credit_account": "4000", "amount": 25000.0, "status": "Posted"}
        ]
    )

    wb = service.get_workbook_data()
    assert wb is not None
    assert "tabs" in wb
    tabs = wb["tabs"]
    assert "Dashboard" in tabs
    assert "Income Statement" in tabs
    assert "Balance Sheet" in tabs
    assert "Cash Flow" in tabs
    assert "Chart of Accounts" in tabs
    assert "General Journal" in tabs

    # Verify Dashboard rows
    dash = tabs["Dashboard"]
    assert len(dash) >= 5
    assert any("Total Revenue / MRR" in str(r) for r in dash)

    # Verify script generation
    script = service.generate_apps_script()
    assert "importCompanyOSFinancials" in script
    assert "SpreadsheetApp.getActiveSpreadsheet()" in script
    assert "Test Startup Master Financials" in script


def test_ensure_sheet_tab_exists_and_live_push():
    """Verify that _push_live_composio_sheet creates the tab first before BATCH_UPDATE."""
    service = GoogleSheetsService(business_id="test-biz-live-002")
    service.spreadsheet_id = "1real_spreadsheet_id_xyz789"

    calls = []

    def mock_execute_tool(user_id, slug, arguments=None):
        calls.append({"user_id": user_id, "slug": slug, "arguments": arguments})
        if slug == "GOOGLESHEETS_ADD_SHEET":
            return {"status": "SUCCESS", "message": "Sheet added"}
        elif slug == "GOOGLESHEETS_BATCH_UPDATE":
            return {"status": "SUCCESS", "updatedCells": 20}
        return {}

    with patch.object(composio_service, "resolve_user_id", return_value="user_test_123"), \
         patch.object(composio_service, "execute_tool", side_effect=mock_execute_tool):

        # 1. Test _ensure_sheet_tab_exists directly
        ok = service._ensure_sheet_tab_exists("Income Statement")
        assert ok is True
        assert len(calls) == 1
        assert calls[0]["slug"] == "GOOGLESHEETS_ADD_SHEET"
        assert calls[0]["arguments"]["title"] == "Income Statement"
        assert calls[0]["arguments"]["spreadsheet_id"] == "1real_spreadsheet_id_xyz789"

        # 2. Test _push_live_composio_sheet calls add sheet then batch update
        calls.clear()
        pushed = service._push_live_composio_sheet("Balance Sheet", [["Header1", "Header2"], ["Val1", "Val2"]])
        assert pushed is True
        assert len(calls) == 2
        assert calls[0]["slug"] == "GOOGLESHEETS_ADD_SHEET"
        assert calls[0]["arguments"]["title"] == "Balance Sheet"
        assert calls[1]["slug"] == "GOOGLESHEETS_BATCH_UPDATE"
        assert calls[1]["arguments"]["sheet_name"] == "Balance Sheet"
        assert calls[1]["arguments"]["first_cell_location"] == "A1"


def test_ensure_sheet_tab_already_exists_graceful_handling():
    """Verify that if tab already exists, _ensure_sheet_tab_exists treats it as success."""
    service = GoogleSheetsService(business_id="test-biz-live-003")
    service.spreadsheet_id = "1real_spreadsheet_id_xyz789"

    def mock_execute_already_exists(user_id, slug, arguments=None):
        if slug == "GOOGLESHEETS_ADD_SHEET":
            raise Exception("A sheet with name 'Dashboard' already exists in spreadsheet")
        return {"status": "SUCCESS"}

    with patch.object(composio_service, "resolve_user_id", return_value="user_test_123"), \
         patch.object(composio_service, "execute_tool", side_effect=mock_execute_already_exists):

        ok = service._ensure_sheet_tab_exists("Dashboard")
        assert ok is True

        pushed = service._push_live_composio_sheet("Dashboard", [["Row1"]])
        assert pushed is True


def test_resolve_user_id_handles_unresolvable_users():
    """Verify that resolve_user_id returns None for unresolvable dummy IDs instead of silently failing downstream."""
    # Test None
    assert composio_service.resolve_user_id(None) is None
    # Test dummy placeholder UUID with no DB record
    assert composio_service.resolve_user_id("00000000-0000-0000-0000-000000000001") is None

