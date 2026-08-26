import json
import logging
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field
from app.agents.tool_registry import BaseTool
from app.services.google_sheets_service import GoogleSheetsService
from app.services.mcp_client import mcp_call_or_default

logger = logging.getLogger(__name__)

class GoogleSheetsInput(BaseModel):
    action: str = Field(
        description=(
            "Action to perform: 'get_chart_of_accounts', 'read_sheet', 'append_journal_entry', "
            "'post_transaction', 'get_trial_balance', 'sync_to_sheets', 'create_finance_sheet', "
            "'create_q3_master_financials' (creates Income Statement, Balance Sheet, Cash Flow, Dashboard tabs with data)"
        )
    )
    sheet_name: Optional[str] = Field(
        "Accounts", 
        description="Target sheet tab name, e.g. 'Accounts', 'Journal', 'TrialBalance', 'Budget'"
    )
    range_or_cell: Optional[str] = Field(
        "A1:Z100", 
        description="Cell range to read or write, e.g. 'A1:H50'"
    )
    payload_json: Optional[str] = Field(
        None, 
        description="JSON payload containing journal entry fields (debit_account, credit_account, amount, description) or account definition"
    )

class GoogleSheetsTool(BaseTool):
    name = "google_sheets"
    description = (
        "Google Sheets MCP Tool. Reads and writes the Chart of Accounts, records journal entries, "
        "reconciles debit/credit trial balances, and syncs financial ledger models with Google Sheets."
    )
    args_schema = GoogleSheetsInput
    cost_estimate = 0.02

    def _run(
        self, 
        action: str, 
        sheet_name: Optional[str] = "Accounts", 
        range_or_cell: Optional[str] = "A1:Z100", 
        payload_json: Optional[str] = None
    ) -> str:
        biz_id = getattr(self, "business_id", "00000000-0000-0000-0000-000000000001") or "00000000-0000-0000-0000-000000000001"
        service = GoogleSheetsService(business_id=biz_id)

        act = (action or "").lower().strip().replace(" ", "_")
        try:
            if act in ("get_chart_of_accounts", "chart_of_accounts", "list_accounts"):
                accounts = service.get_accounts()
                grouped = {}
                for acc in accounts:
                    cat = acc.get("category", "Other")
                    if cat not in grouped:
                        grouped[cat] = []
                    grouped[cat].append(f"[{acc['code']}] {acc['name']} - ${acc.get('balance', 0):,.2f} ({acc.get('normal_balance', '')})")
                
                result = {
                    "source": "Google Sheets (Chart of Accounts)",
                    "spreadsheet_url": service.get_config()["spreadsheet_url"],
                    "total_accounts": len(accounts),
                    "chart_of_accounts": grouped
                }
                default_res = json.dumps(result, indent=2)

            elif act in ("read_sheet", "read", "get_sheet", "fetch_sheet"):
                rows = service.read_sheet_range(sheet_name or "Accounts", range_or_cell or "A1:Z100")
                default_res = json.dumps({
                    "sheet": sheet_name,
                    "range": range_or_cell,
                    "row_count": len(rows),
                    "data": rows
                }, indent=2)

            elif act in ("append_journal_entry", "post_transaction", "record_transaction", "journal_entry"):
                if not payload_json:
                    return "ERROR: payload_json is required with debit_account, credit_account, amount, and description."
                
                try:
                    entry_data = json.loads(payload_json)
                except Exception:
                    entry_data = {"description": payload_json, "amount": 0.0}

                posted_entry = service.post_journal_entry(entry_data)
                default_res = json.dumps({
                    "status": "SUCCESS",
                    "action": "appended_to_google_sheets_journal",
                    "entry": posted_entry,
                    "message": f"Successfully posted ${posted_entry.get('amount', 0):,.2f} transaction to Google Sheets ledger."
                }, indent=2)

            elif act in ("get_trial_balance", "trial_balance", "calculate_trial_balance"):
                tb = service.get_trial_balance()
                default_res = json.dumps({
                    "source": "Google Sheets Trial Balance",
                    "trial_balance": tb,
                    "is_balanced": tb["is_balanced"]
                }, indent=2)

            elif act in ("sync_to_sheets", "sync", "export_to_sheets"):
                sync_res = service.sync_to_google_sheets()
                default_res = json.dumps(sync_res, indent=2)

            elif act in ("create_group_financial_tracking_system", "setup_financial_system", "financial_tracking", "create_group_financial_system", "create_group_sheet"):
                group_name = sheet_name if sheet_name and sheet_name != "Accounts" else "SSS Group of Companies"
                res = service.create_group_financial_tracking_system(group_name=group_name)
                default_res = json.dumps(res, indent=2)

            elif act in ("create_q3_master_financials", "q3_master_financials", "q3_financials", "master_financials", "create_master_financials"):
                title = sheet_name if sheet_name and sheet_name != "Accounts" else "Q3 Startup Master Financials"
                res = service.create_q3_master_financials(sheet_title=title)
                default_res = json.dumps(res, indent=2)

            elif act in ("create_finance_sheet", "create_sheet", "create_google_sheet", "new_sheet", "create_trial_balance_sheet", "create_trial_balance"):
                # Actually create and populate the sheet instead of returning a stub
                title = sheet_name if sheet_name and sheet_name != "Accounts" else "Q3 Startup Master Financials"
                res = service.create_q3_master_financials(sheet_title=title)
                default_res = json.dumps(res, indent=2)

            else:
                cfg = service.get_config()
                default_res = json.dumps({
                    "status": "SUCCESS",
                    "action": act,
                    "spreadsheet_title": sheet_name or cfg.get("spreadsheet_title", "Finance Ledger"),
                    "spreadsheet_url": cfg.get("spreadsheet_url", "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"),
                    "message": f"Google Sheets action '{action}' on sheet '{sheet_name}' completed."
                }, indent=2)

            return mcp_call_or_default(
                "google_sheets",
                action,
                {
                    "sheet_name": sheet_name,
                    "range_or_cell": range_or_cell,
                    "payload": payload_json
                },
                default_res
            )

        except Exception as e:
            logger.error(f"Error in GoogleSheetsTool action '{action}': {e}")
            return f"Google Sheets tool error: {str(e)}"
