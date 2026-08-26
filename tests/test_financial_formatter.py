import pytest
from app.services.financial_deliverable_formatter import (
    extract_financial_payload_from_text,
    process_and_enrich_financial_deliverable,
    build_executive_financial_markdown
)

def test_extract_financial_payload_from_raw_text():
    sample_text = """I'll set up a complete financial tracking system with a master spreadsheet.
createdynamicfinancial_system {"sheettitle": "Complete Financial Tracking System", "accounts": [{"code": "1000", "name": "Cash", "type": "Asset", "normalbalance": "Debit"}], "journalentries": [{"debitaccount": "1000", "creditaccount": "3000", "amount": 50000, "description": "Initial capital investment"}]}"""

    payload = extract_financial_payload_from_text(sample_text)
    assert payload is not None
    assert payload.get("sheet_title") == "Complete Financial Tracking System"
    assert len(payload.get("accounts", [])) == 1
    assert payload["accounts"][0]["normal_balance"] == "Debit"
    assert len(payload.get("journal_entries", [])) == 1
    assert payload["journal_entries"][0]["amount"] == 50000

def test_process_and_enrich_financial_deliverable():
    sample_text = """I'll set up a complete financial tracking system.
createdynamicfinancial_system {"sheettitle": "Complete Financial Tracking System", "accounts": [{"code": "1000", "name": "Cash", "type": "Asset", "normalbalance": "Debit"}], "journalentries": [{"debitaccount": "1000", "creditaccount": "3000", "amount": 50000, "description": "Initial capital investment"}]}"""

    enriched = process_and_enrich_financial_deliverable(
        role="Finance Manager",
        task_desc="Set up a complete financial tracking system and master spreadsheet",
        raw_output=sample_text,
        business_id="00000000-0000-0000-0000-000000000001"
    )

    assert "docs.google.com/spreadsheets" in enriched
    assert "Complete Financial Tracking System" in enriched
    assert "Chart of Accounts" in enriched
    assert "General Journal" in enriched
    assert "$50,000.00" in enriched
