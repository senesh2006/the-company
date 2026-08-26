import pytest
from app.services.google_sheets_service import GoogleSheetsService

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
