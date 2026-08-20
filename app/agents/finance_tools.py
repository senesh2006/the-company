import json
import logging
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from app.agents.tool_registry import BaseTool, registry
from app.agents.tools import ReadSharedMemoryTool, WriteSharedMemoryTool, SpawnSubtaskTool, AskUserForInputTool
from app.agents.google_sheets_tool import GoogleSheetsTool
from app.core.config import settings
from app.services.mcp_client import mcp_call_or_default

logger = logging.getLogger(__name__)

# --- Finance Specific MCP Tools ---

def _finance_mcp_call(mcp_name: str, tool_name: str, arguments: Dict[str, Any], default_result: Any) -> Any:
    """Call a real MCP server if configured, otherwise return the default mock result."""
    return mcp_call_or_default(mcp_name, tool_name, arguments, default_result)


# --- Stripe helpers ---

def _stripe_client_available() -> bool:
    """Return True if the Stripe Python SDK is installed and a key is configured."""
    try:
        import stripe
    except ImportError:
        return False
    return bool(settings.STRIPE_API_KEY)


def _stripe_run(action: str, customer_id: Optional[str], amount: Optional[float], metadata: Optional[str]) -> str:
    """Execute a Stripe API call using the official Python SDK."""
    import stripe
    stripe.api_key = settings.STRIPE_API_KEY

    try:
        if action == "read_charges":
            params = {"limit": 10}
            if customer_id:
                params["customer"] = customer_id
            charges = stripe.Charge.list(**params)
            return json.dumps([
                {
                    "charge_id": ch.id,
                    "customer": ch.customer,
                    "amount": ch.amount / 100.0,
                    "currency": ch.currency,
                    "status": ch.status,
                    "fee": getattr(ch, "balance_transaction", None) or 0,
                    "created": datetime.fromtimestamp(ch.created).isoformat(),
                }
                for ch in charges.auto_paging_iter()
            ])

        elif action == "read_invoices":
            params = {"limit": 10}
            if customer_id:
                params["customer"] = customer_id
            invoices = stripe.Invoice.list(**params)
            return json.dumps([
                {
                    "invoice_id": inv.id,
                    "customer": inv.customer,
                    "total": inv.total / 100.0,
                    "status": inv.status,
                    "due_date": inv.due_date and datetime.fromtimestamp(inv.due_date).isoformat(),
                }
                for inv in invoices.auto_paging_iter()
            ])

        elif action == "create_draft_invoice":
            if not customer_id:
                return "ERROR: customer_id is required to create a draft invoice."
            amount_cents = int((amount or 0) * 100)
            invoice_item = stripe.InvoiceItem.create(
                customer=customer_id,
                amount=amount_cents,
                currency="usd",
                description=metadata or "Company OS generated invoice item",
            )
            invoice = stripe.Invoice.create(
                customer=customer_id,
                auto_advance=False,
                metadata={"source": "company_os", "description": metadata or ""},
            )
            return (
                f"Created Draft Stripe Invoice for customer '{customer_id}' in the amount of ${amount or 0.00:.2f}. "
                f"Invoice ID: {invoice.id}. Status: DRAFT (Non-destructive)."
            )

        elif action == "issue_refund":
            # Refunds require a charge_id; the current schema only exposes amount.
            # We stage the refund request instead of executing blindly.
            return (
                f"REFUND ACTION: Refund request for ${amount or 0.00:.2f} logged for customer '{customer_id or 'unknown'}'. "
                f"High-risk action - requires founder sign-off and a charge_id to execute."
            )

        elif action == "transfer_funds":
            # Stripe transfers/payouts are high-risk; require explicit approval.
            return (
                f"PAYOUT ACTION: Transfer of ${amount or 0.00:.2f} logged for customer '{customer_id or 'unknown'}'. "
                f"High-risk action - must receive founder sign-off."
            )

        return f"Stripe action '{action}' completed."

    except Exception as e:
        stripe_err_cls = getattr(getattr(stripe, "error", None), "StripeError", None)
        if stripe_err_cls and isinstance(stripe_err_cls, type) and issubclass(stripe_err_cls, BaseException) and isinstance(e, stripe_err_cls):
            logger.error(f"Stripe API error for action '{action}': {e}")
            return f"Stripe API error: {getattr(e, 'user_message', None) or str(e)}"
        logger.error(f"Unexpected Stripe error for action '{action}': {e}")
        return f"Stripe integration error: {str(e)}"

class SupabaseInput(BaseModel):
    action: str = Field(description="'read_transactions', 'get_chart_of_accounts', 'read_trial_balance', 'post_journal_entry', 'transfer_funds'")
    query_or_data: Optional[str] = Field(None, description="Query string, account filter, or JSON journal entry data")

class SupabaseLedgerTool(BaseTool):
    name = "supabase_database"
    description = "Core double-entry financial database for reading transactions, trial balances, and posting journal entries."
    args_schema = SupabaseInput
    cost_estimate = 0.05
    
    def _run(self, action: str, query_or_data: Optional[str] = None) -> str:
        if action == "read_transactions":
            default = json.dumps([
                {"id": "tx_101", "date": "2026-07-15", "vendor": "AWS Cloud Services", "amount": 420.50, "account": "5000 - Cloud Hosting & Server Infrastructure", "status": "posted"},
                {"id": "tx_102", "date": "2026-07-18", "vendor": "OpenAI API", "amount": 185.20, "account": "5100 - LLM Inference & API Costs", "status": "posted"},
                {"id": "tx_103", "date": "2026-07-20", "vendor": "Stripe Processing", "amount": 45.00, "account": "5200 - Payment Processing Fees (Stripe)", "status": "posted"},
                {"id": "tx_104", "date": "2026-07-28", "vendor": "Google Workspace", "amount": 72.00, "account": "6000 - Software Subscriptions & SaaS Tools", "status": "posted"},
                {"id": "tx_105", "date": "2026-07-30", "vendor": "SaaS Customer A", "amount": 3500.00, "account": "4000 - Software Subscription Revenue", "status": "posted"}
            ])
        elif action == "get_chart_of_accounts":
            default = json.dumps({
                "Assets (1000s)": ["1000 Cash", "1050 Operating Bank", "1100 Accounts Receivable", "1200 Prepaid Expenses"],
                "Liabilities (2000s)": ["2000 Accounts Payable", "2100 Accrued Liabilities", "2200 Corporate Credit Card"],
                "Equity (3000s)": ["3000 Common Stock", "3100 Retained Earnings"],
                "Revenue (4000s)": ["4000 Software Subscription Revenue", "4100 Professional Services"],
                "COGS (5000s)": ["5000 Cloud Hosting", "5100 LLM Inference Costs", "5200 Payment Processing"],
                "OPEX (6000s)": ["6000 Software & SaaS", "6100 Marketing", "6200 Legal & Professional", "6400 Travel & Meals", "6500 Taxes"]
            })
        elif action == "read_trial_balance":
            default = json.dumps({
                "Cash (1050)": {"debit": 48250.00, "credit": 0.00},
                "Accounts Receivable (1100)": {"debit": 12400.00, "credit": 0.00},
                "Accounts Payable (2000)": {"debit": 0.00, "credit": 4350.00},
                "Common Stock (3000)": {"debit": 0.00, "credit": 30000.00},
                "Retained Earnings (3100)": {"debit": 0.00, "credit": 15000.00},
                "Subscription Revenue (4000)": {"debit": 0.00, "credit": 18500.00},
                "Cloud Hosting (5000)": {"debit": 3200.00, "credit": 0.00},
                "Inference Costs (5100)": {"debit": 1800.00, "credit": 0.00},
                "SaaS Tools (6000)": {"debit": 2200.00, "credit": 0.00},
                "Total": {"debit": 67850.00, "credit": 67850.00, "balanced": True}
            })
        elif action == "post_journal_entry":
            default = f"Journal Entry successfully recorded into Supabase ledger with cryptographic audit hash. Entry payload: {query_or_data}"
        elif action == "transfer_funds":
            default = f"Simulated transfer execution: {query_or_data}. (Requires human founder authorization)"
        else:
            return f"Supabase ledger action '{action}' executed successfully."

        return _finance_mcp_call(
            "supabase",
            action,
            {"query_or_data": query_or_data},
            default,
        )

class StripeInput(BaseModel):
    action: str = Field(description="'read_charges', 'read_invoices', 'create_draft_invoice', 'issue_refund', 'transfer_funds'")
    customer_id: Optional[str] = Field(None, description="Stripe customer ID")
    amount: Optional[float] = Field(None, description="Amount in USD")
    metadata: Optional[str] = Field(None, description="Additional JSON metadata or invoice description")

class StripeFinanceTool(BaseTool):
    name = "stripe_finance"
    description = "Stripe MCP Tool for checking customer charges, subscriptions, drafting invoices, and managing payment records."
    args_schema = StripeInput
    cost_estimate = 0.05

    def _run(self, action: str, customer_id: Optional[str] = None, amount: Optional[float] = None, metadata: Optional[str] = None) -> str:
        # 1. Use the official Stripe Python SDK if available and configured.
        if _stripe_client_available():
            return _stripe_run(action, customer_id, amount, metadata)

        # 2. Fall back to the original mock responses.
        if action == "read_charges":
            default = json.dumps([
                {"charge_id": "ch_3M901", "customer": customer_id or "cus_AcmeCorp", "amount": 2500.00, "status": "succeeded", "fee": 72.80, "created": "2026-07-22"},
                {"charge_id": "ch_3M902", "customer": "cus_BetaLLC", "amount": 1000.00, "status": "succeeded", "fee": 29.30, "created": "2026-07-24"}
            ])
        elif action == "read_invoices":
            default = json.dumps([
                {"invoice_id": "in_9921", "customer": customer_id or "cus_AcmeCorp", "total": 2500.00, "status": "paid", "due_date": "2026-07-31"},
                {"invoice_id": "in_9922", "customer": "cus_GammaInc", "total": 1200.00, "status": "open", "due_date": "2026-08-15"}
            ])
        elif action == "create_draft_invoice":
            default = f"Created Draft Stripe Invoice for customer '{customer_id or 'cus_default'}' in the amount of ${amount or 0.00:.2f}. Status: DRAFT (Non-destructive)."
        elif action == "issue_refund":
            default = f"REFUND ACTION: Refund request for ${amount or 0.00:.2f} logged. (High-risk action - must receive founder sign-off)."
        elif action == "transfer_funds":
            default = f"PAYOUT ACTION: Transfer of ${amount or 0.00:.2f} logged. (High-risk action - must receive founder sign-off)."
        else:
            return f"Stripe action '{action}' completed."

        # 3. Optional: delegate to a real Stripe MCP server if one is configured.
        return _finance_mcp_call(
            "stripe",
            action,
            {
                "customer_id": customer_id,
                "amount": amount,
                "metadata": metadata,
            },
            default,
        )

class GoogleWorkspaceInput(BaseModel):
    app: str = Field(description="'sheets', 'gmail', or 'docs'")
    action: str = Field(description="'read' or 'write'")
    target: str = Field(description="Email address, Sheet ID/Tab name, or Document ID")
    content: Optional[str] = Field(None, description="Content to send, append, or write")

class GoogleWorkspaceTool(BaseTool):
    name = "google_workspace"
    description = "Interacts with Google Workspace (Sheets for financial modeling and budgets, Gmail for vendor invoices)."
    args_schema = GoogleWorkspaceInput
    cost_estimate = 0.02

    def _run(self, app: str, action: str, target: str, content: Optional[str] = None) -> str:
        if app == "sheets":
            if action == "read":
                default = f"Google Sheets '{target}': Retrieved Monthly Budget Model (Target OPEX: $15,000/mo, Actuals: $12,470/mo, Variance: +$2,530 favorable)."
            else:
                default = f"Google Sheets '{target}': Successfully updated cells with new financial actuals."
        elif app == "gmail":
            if action == "read":
                default = f"Gmail inbox search for '{target}': Extracted 3 vendor invoices (AWS: $420.50, Figma: $45.00, Notion: $28.00)."
            else:
                default = f"Gmail draft created for recipient '{target}'."
        else:
            return f"Google {app} action '{action}' on '{target}' completed."

        return _finance_mcp_call(
            "google",
            f"{app}_{action}",
            {"app": app, "action": action, "target": target, "content": content},
            default,
        )

class FilesystemInput(BaseModel):
    action: str = Field(description="'read_file' or 'write_file'")
    path: str = Field(description="Filepath to receipt, CSV bank export, or local audit summary")
    content: Optional[str] = Field(None, description="Content to write")

class FilesystemTool(BaseTool):
    name = "filesystem"
    description = "Reads and writes files on the local filesystem (receipts, CSV bank statements, closing exports)."
    args_schema = FilesystemInput
    cost_estimate = 0.005

    def _run(self, action: str, path: str, content: Optional[str] = None) -> str:
        if action == "read_file":
            return f"Content of {path}: Date,Vendor,Amount,Type\n2026-07-02,Silicon Valley Bank Fee,15.00,Debit\n2026-07-10,Stripe Payout,12500.00,Credit\n2026-07-25,Google Cloud,310.00,Debit"
        return f"Successfully wrote {len(content or '')} bytes to {path}."

class NotionInput(BaseModel):
    action: str = Field(description="'read_policy', 'write_report', or 'update_close_checklist'")
    doc_id: Optional[str] = Field(None, description="ID or title of the Notion document/page")
    content: Optional[str] = Field(None, description="Report markdown or checklist items")

class NotionTool(BaseTool):
    name = "notion_workspace"
    description = "Reads company financial policies and writes SOX-compliant month-end closing memos to Notion."
    args_schema = NotionInput
    cost_estimate = 0.01

    def _run(self, action: str, doc_id: Optional[str] = None, content: Optional[str] = None) -> str:
        if action == "read_policy":
            default = (
                "Company OS Financial Governance Policy:\n"
                "1. Zero unattended external money movement without human signoff.\n"
                "2. Standard corporate income tax reserve: 21%.\n"
                "3. Double-entry general ledger must balance before closing any period.\n"
                "4. All software subscriptions > $50/mo require designated departmental owner."
            )
        elif action == "update_close_checklist":
            default = f"Month-End Closing Checklist on Notion '{doc_id or 'Closing Hub'}' marked 100% complete."
        else:
            default = f"Notion Financial Report '{doc_id or 'Month-End Close Memo'}' successfully published."

        return _finance_mcp_call(
            "notion",
            action,
            {"doc_id": doc_id, "content": content},
            default,
        )

class PlaywrightInput(BaseModel):
    action: str = Field(description="'scrape_bank_portal' or 'download_statement'")
    url: Optional[str] = Field(None, description="Bank portal URL")

class PlaywrightTool(BaseTool):
    name = "playwright_browser"
    description = "Browser automation tool for bank portal statement downloading and third-party portal reconciliation."
    args_schema = PlaywrightInput
    cost_estimate = 0.02
    
    def _run(self, action: str, url: Optional[str] = None) -> str:
        default = f"Playwright automation '{action}' on '{url or 'Primary Bank Portal'}': Downloaded verified bank statement statement_2026_07.csv (Ending Balance: $48,250.00)."
        return _finance_mcp_call(
            "browser",
            action,
            {"url": url},
            default,
        )

class BraveSearchInput(BaseModel):
    query: str = Field(description="Search query for tax rates, GAAP accounting standards, or FX regulations")

class BraveSearchTool(BaseTool):
    name = "brave_search"
    description = "Searches the web for latest tax rate guidelines, GAAP rules, and compliance research."
    args_schema = BraveSearchInput
    cost_estimate = 0.015

    def _run(self, query: str) -> str:
        # Try the free DuckDuckGo HTML search first (no API key required).
        from app.services.web_search import search_web
        free_result = search_web(query)
        if free_result and "failed" not in free_result.lower():
            return free_result

        # Fall back to the original static response if DuckDuckGo fails.
        default = f"Brave Search result for '{query}': Corporate tax rate is 21%. Section 174 software development capitalization rules apply."
        return _finance_mcp_call(
            "brave",
            "search",
            {"query": query},
            default,
        )

class FetchInput(BaseModel):
    url: str = Field(description="API URL (e.g. currency exchange rates or inflation index)")

class FetchTool(BaseTool):
    name = "fetch_api"
    description = "Fetches live foreign exchange rates and financial benchmark data."
    args_schema = FetchInput
    cost_estimate = 0.005

    def _run(self, url: str) -> str:
        default = f"Live FX API response from '{url}': 1 USD = 0.92 EUR, 1 USD = 0.79 GBP, 1 USD = 155.20 JPY."
        return _finance_mcp_call(
            "fetch",
            "get",
            {"url": url},
            default,
        )

class CommInput(BaseModel):
    platform: str = Field(description="'slack'")
    channel_or_user: str = Field(description="Target channel or user (e.g. '#finance-audit')")
    message: str = Field(description="Message text regarding approval requests or audit alerts")

class CommTool(BaseTool):
    name = "internal_communication"
    description = "Sends urgent notifications and human-approval requests over Slack."
    args_schema = CommInput
    cost_estimate = 0.01

    def _run(self, platform: str, channel_or_user: str, message: str) -> str:
        default = f"Notification successfully dispatched via {platform.upper()} to {channel_or_user}: '{message}'"
        mcp_name = "slack"
        return _finance_mcp_call(
            mcp_name,
            "send_message",
            {"platform": platform, "channel_or_user": channel_or_user, "message": message},
            default,
        )


# =====================================================================
# --- Specialized Operations & Finance Desks (PRD Extended Suite) ---
# =====================================================================

class ContractDeskInput(BaseModel):
    action: str = Field(description="'pipeline_summary', 'extract_terms', 'flag_blocked', or 'review_contract'")
    contract_id: Optional[str] = Field(None, description="Contract or agreement reference ID / filename")
    contract_text: Optional[str] = Field(None, description="Raw or summarized contract text")
    stage: Optional[str] = Field(None, description="Filter by stage: 'Drafting', 'In Review', 'Legal Audit', 'Signed', 'Blocked'")
    owner: Optional[str] = Field(None, description="Contract internal owner or counterparty")

class ContractDeskTool(BaseTool):
    name = "contract_desk"
    description = (
        "Contract Desk: See the week of paper at a glance. "
        "Summarizes by stage and owner, pulls key terms (SLA, liability cap, payment terms, auto-renewal), "
        "and flags blocked reviews or high-risk clauses."
    )
    args_schema = ContractDeskInput
    cost_estimate = 0.01

    def _run(
        self,
        action: str,
        contract_id: Optional[str] = None,
        contract_text: Optional[str] = None,
        stage: Optional[str] = None,
        owner: Optional[str] = None
    ) -> str:
        if action == "pipeline_summary":
            return json.dumps({
                "status": "success",
                "desk": "Contract Desk",
                "summary": "Weekly paper pipeline summarized across active stages and owners.",
                "total_contracts": 8,
                "stages": {
                    "Drafting": [{"id": "CTR-2026-081", "title": "Enterprise Cloud Master Services Agreement (MSA)", "owner": "VP Sales", "value": "$120,000/yr", "status": "Drafting"}],
                    "In Review": [
                        {"id": "CTR-2026-079", "title": "Vendor Data Processing Addendum (DPA)", "owner": "Security Lead", "value": "N/A", "status": "In Review"},
                        {"id": "CTR-2026-077", "title": "API Reseller Agreement", "owner": "Founder", "value": "$45,000/yr", "status": "In Review"}
                    ],
                    "Legal Audit": [{"id": "CTR-2026-075", "title": "SOC2 Compliance Auditor SOW", "owner": "Finance Manager", "value": "$18,500", "status": "Legal Audit"}],
                    "Signed": [
                        {"id": "CTR-2026-071", "title": "Customer Subscription Agreement (Acme Corp)", "owner": "Growth Lead", "value": "$60,000/yr", "status": "Signed"},
                        {"id": "CTR-2026-068", "title": "Office Space Sublease Agreement", "owner": "Ops Manager", "value": "$36,000/yr", "status": "Signed"}
                    ],
                    "Blocked": [
                        {"id": "CTR-2026-074", "title": "Enterprise Tier SLA & Indemnity Rider", "owner": "Legal / Founder", "value": "$250,000/yr", "block_reason": "Unlimited liability clause requested by customer counterparty. Requires redline approval."}
                    ]
                },
                "blocked_count": 1,
                "actionable_takeaway": "1 contract (CTR-2026-074) blocked due to liability cap redlines. 2 contracts pending final review."
            }, indent=2)

        elif action == "extract_terms":
            text_sample = contract_text or f"Contract Reference: {contract_id or 'CTR-2026-Enterprise'}"
            return json.dumps({
                "status": "success",
                "contract_id": contract_id or "CTR-2026-081",
                "key_terms": {
                    "contract_value": "$120,000.00 USD / Year (Billed Annually)",
                    "effective_dates": "September 1, 2026 – August 31, 2027 (12 Month Term)",
                    "payment_terms": "Net 30 from invoice receipt via ACH / Wire",
                    "sla_commitment": "99.9% Platform Availability (10% credit for downtime > 0.1%)",
                    "liability_cap": "12 Months Fees Paid (Standard Mutual Cap)",
                    "auto_renewal": "Renews automatically for 12 months unless cancelled with 30-day written notice",
                    "governing_law": "State of Delaware, United States",
                    "data_protection": "GDPR, CCPA & SOC2 compliant processing addendum attached"
                },
                "risk_assessment": "LOW RISK - Terms comply with standard Company OS financial and legal guidelines."
            }, indent=2)

        elif action == "flag_blocked":
            return json.dumps({
                "status": "success",
                "blocked_reviews": [
                    {
                        "contract_id": "CTR-2026-074",
                        "title": "Enterprise Tier SLA & Indemnity Rider",
                        "owner": "Legal / Founder",
                        "blocked_days": 4,
                        "flagged_clauses": [
                            "Customer requested uncapped consequential damages",
                            "SLA rebate proposed at 50% for <99.95% uptime"
                        ],
                        "suggested_remedy": "Counter with standard 12-month trailing fee liability cap and maximum 15% SLA service credit."
                    }
                ]
            }, indent=2)

        else: # review_contract
            return json.dumps({
                "status": "success",
                "review_score": "88/100",
                "verdict": "APPROVED WITH STANDARD REDLINES",
                "clauses_analyzed": ["Payment Schedule", "Termination for Convenience", "IP Ownership", "Confidentiality", "Audit Rights"],
                "notes": "Reviewed against Company OS financial governance rules. Non-standard payment terms (Net 60) should be negotiated down to Net 30."
            }, indent=2)


class ExpenseManagerInput(BaseModel):
    action: str = Field(description="'weekly_summary', 'log_receipt', 'audit_categories', or 'nudge_missing_receipts'")
    receipt_data: Optional[Dict[str, Any]] = Field(None, description="Parsed receipt fields: vendor, amount, date, category, owner")
    timeframe: Optional[str] = Field("weekly", description="'weekly' or 'monthly'")
    missing_threshold_days: Optional[int] = Field(3, description="Days missing before nudging owner")

class ExpenseManagerTool(BaseTool):
    name = "expense_manager"
    description = (
        "Expense Manager: Stay on top of the money. "
        "Builds the weekly summary from your expense manager and Google Sheets, "
        "logs new receipts extracted from email, and nudges owners on missing categories before review."
    )
    args_schema = ExpenseManagerInput
    cost_estimate = 0.01

    def _run(
        self,
        action: str,
        receipt_data: Optional[Dict[str, Any]] = None,
        timeframe: Optional[str] = "weekly",
        missing_threshold_days: Optional[int] = 3
    ) -> str:
        if action == "weekly_summary":
            return json.dumps({
                "status": "success",
                "desk": "Expense Manager",
                "period": "Week Ending August 19, 2026",
                "total_expenses_usd": 12450.80,
                "budget_usd": 15000.00,
                "budget_utilization_pct": "83.0%",
                "breakdown_by_category": {
                    "Cloud & AI Infrastructure (COGS 5000)": 5210.40,
                    "Software Subscriptions (OPEX 6000)": 2840.00,
                    "Marketing & Inbound Ads (OPEX 6100)": 3150.00,
                    "Travel & Team Operations (OPEX 6200)": 1250.40
                },
                "receipts_logged_this_week": 14,
                "unclassified_transactions": 2,
                "sync_status": "Google Sheets 'Company Ledger' synchronized"
            }, indent=2)

        elif action == "log_receipt":
            data = receipt_data or {
                "vendor": "OpenAI / Anthropic API",
                "amount": 420.50,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "category": "COGS 5100 (LLM Inference & API Costs)",
                "owner": "Engineering Lead"
            }
            return json.dumps({
                "status": "success",
                "receipt_id": f"RCP-{int(datetime.now().timestamp())}",
                "message": f"Successfully logged receipt from '{data.get('vendor')}' for ${data.get('amount')}.",
                "mapped_account": data.get("category", "OPEX 6000 (Software Subscriptions)"),
                "ledger_entry": "Appended to Google Sheets and Supabase cost_records table.",
                "owner_notified": True
            }, indent=2)

        elif action == "audit_categories":
            return json.dumps({
                "status": "success",
                "flagged_transactions": [
                    {
                        "transaction_id": "TXN-9842",
                        "vendor": "AWS EMEA",
                        "amount": 1450.00,
                        "issue": "Missing sub-account tag (EU Central vs US East)",
                        "assigned_owner": "Lead DevOps",
                        "suggested_category": "COGS 5000 (Cloud Hosting & Compute)"
                    },
                    {
                        "transaction_id": "TXN-9847",
                        "vendor": "Uber for Business",
                        "amount": 84.20,
                        "issue": "Missing client billing code / project tag",
                        "assigned_owner": "Growth Lead",
                        "suggested_category": "OPEX 6200 (Travel & Client Entertainment)"
                    }
                ]
            }, indent=2)

        else: # nudge_missing_receipts
            return json.dumps({
                "status": "success",
                "nudges_dispatched": [
                    {
                        "owner": "Lead DevOps",
                        "channel": "Slack #finance-ops & Email",
                        "message": "Hi! You have 1 pending transaction from 'AWS EMEA' ($1,450.00) missing an invoice receipt. Please reply or upload before the Friday review close."
                    },
                    {
                        "owner": "Growth Lead",
                        "channel": "Slack #finance-ops",
                        "message": "Hi! Please specify the project tag for 'Uber for Business' ($84.20) to ensure accurate tax categorization."
                    }
                ]
            }, indent=2)


class InvoiceCoordinatorInput(BaseModel):
    action: str = Field(description="'match_invoice', 'track_vendor_actuals', 'aging_summary', or 'nudge_approver'")
    invoice_id: Optional[str] = Field(None, description="Invoice identifier or vendor invoice #")
    vendor_name: Optional[str] = Field(None, description="Vendor name e.g. 'Datadog', 'Figma', 'Stripe'")
    amount: Optional[float] = Field(None, description="Invoice amount in USD")
    po_number: Optional[str] = Field(None, description="Associated Purchase Order #")
    approver_email: Optional[str] = Field(None, description="Department head approver email")

class InvoiceCoordinatorTool(BaseTool):
    name = "invoice_coordinator"
    description = (
        "Invoice Coordinator: Stop invoices from sitting. "
        "Forwards invoices, matches what it can (PO, Contract, Receipt 3-way match), "
        "tracks campus or vendor actuals, and nudges the right owner when something needs human sign-off."
    )
    args_schema = InvoiceCoordinatorInput
    cost_estimate = 0.01

    def _run(
        self,
        action: str,
        invoice_id: Optional[str] = None,
        vendor_name: Optional[str] = None,
        amount: Optional[float] = None,
        po_number: Optional[str] = None,
        approver_email: Optional[str] = None
    ) -> str:
        if action == "match_invoice":
            inv_amt = amount or 3200.00
            v_name = vendor_name or "Datadog Cloud Observability"
            return json.dumps({
                "status": "success",
                "desk": "Invoice Coordinator",
                "invoice_id": invoice_id or "INV-2026-9042",
                "vendor": v_name,
                "amount": inv_amt,
                "po_matched": po_number or "PO-2026-044",
                "3_way_match_status": "MATCHED (100% Variance Tolerance OK)",
                "contract_comparison": "Invoice matches rate card ($3,200/mo) specified in signed MSA.",
                "routing_decision": "AUTO-APPROVED for payment batch. No human bottleneck required."
            }, indent=2)

        elif action == "track_vendor_actuals":
            v_name = vendor_name or "All Top Vendors"
            return json.dumps({
                "status": "success",
                "vendor_actuals": [
                    {"vendor": "Amazon Web Services", "contract_cap": "$60,000/yr", "actual_ytd": "$34,200.00", "burn_rate_status": "ON TRACK (57%)"},
                    {"vendor": "Datadog", "contract_cap": "$38,400/yr", "actual_ytd": "$22,400.00", "burn_rate_status": "ON TRACK (58%)"},
                    {"vendor": "Google Workspace & Cloud", "contract_cap": "$18,000/yr", "actual_ytd": "$11,200.00", "burn_rate_status": "ON TRACK (62%)"},
                    {"vendor": "OpenAI API", "contract_cap": "$25,000/yr", "actual_ytd": "$19,800.00", "burn_rate_status": "HIGH UTILIZATION (79%) - Recommend Tier Upgrade"}
                ]
            }, indent=2)

        elif action == "aging_summary":
            return json.dumps({
                "status": "success",
                "ap_aging_summary": {
                    "current_0_30_days": "$14,500.00 (8 Invoices, All on Net 30)",
                    "past_due_31_60_days": "$0.00",
                    "past_due_61_90_days": "$0.00",
                    "total_accounts_payable": "$14,500.00",
                    "invoices_awaiting_human_approval": 1
                }
            }, indent=2)

        else: # nudge_approver
            target = approver_email or "founder@example.com"
            return json.dumps({
                "status": "success",
                "nudge_status": f"Sent approval nudge to {target} regarding Invoice INV-2026-9048 ($4,500.00 for External Legal Counsel).",
                "direct_link": "/approvals?type=invoice&id=INV-2026-9048"
            }, indent=2)


class SecurityQuestionnaireInput(BaseModel):
    action: str = Field(description="'draft_answers', 'query_trust_center', 'park_submission', or 'review_coverage'")
    portal_name: Optional[str] = Field(None, description="Vendor / Customer security portal (e.g. Whistic, Vanta, OneTrust, RFP form)")
    questions: Optional[List[str]] = Field(None, description="List of specific security or compliance questions to answer")
    questionnaire_text: Optional[str] = Field(None, description="Full raw questionnaire text")

class SecurityQuestionnaireTool(BaseTool):
    name = "security_questionnaire_filler"
    description = (
        "Security Questionnaire Filler: Speed through vendor security portals. "
        "Pulls answers from your trust center, security policies, and past RFPs in Shared Memory, "
        "drafts every field, and parks the submit for human sign-off."
    )
    args_schema = SecurityQuestionnaireInput
    cost_estimate = 0.01

    def _run(
        self,
        action: str,
        portal_name: Optional[str] = None,
        questions: Optional[List[str]] = None,
        questionnaire_text: Optional[str] = None
    ) -> str:
        portal = portal_name or "Enterprise Customer Vendor Security Review (Whistic / OneTrust)"

        if action == "draft_answers":
            sample_answers = [
                {
                    "question": "Do you encrypt customer data at rest and in transit?",
                    "answer": "Yes. All customer data is encrypted at rest using AES-256 and in transit via TLS 1.3 across all endpoints.",
                    "evidence_source": "Trust Center Policy & AWS KMS Architecture Doc",
                    "confidence": "100%"
                },
                {
                    "question": "Do you maintain SOC2 Type II and ISO 27001 certifications?",
                    "answer": "Yes. Company OS undergoes annual SOC2 Type II audits covering Security, Confidentiality, and Availability criteria.",
                    "evidence_source": "Shared Memory / SOC2 Audit Report 2026",
                    "confidence": "98%"
                },
                {
                    "question": "What is your Disaster Recovery (DR) and Backup RTO/RPO target?",
                    "answer": "RTO (Recovery Time Objective) is < 1 hour, and RPO (Recovery Point Objective) is < 15 minutes with automated multi-region automated replication.",
                    "evidence_source": "Business Continuity & DR Plan v4.2",
                    "confidence": "95%"
                },
                {
                    "question": "Do you perform periodic penetration testing by independent third parties?",
                    "answer": "Yes. External third-party gray-box penetration tests are conducted bi-annually. Executive summaries are available under NDA.",
                    "evidence_source": "Penetration Test Executive Summary Q2 2026",
                    "confidence": "96%"
                }
            ]
            return json.dumps({
                "status": "success",
                "desk": "Security Questionnaire Filler",
                "portal": portal,
                "total_questions_parsed": 24,
                "auto_drafted_count": 24,
                "completion_pct": "100%",
                "sample_drafted_responses": sample_answers,
                "staged_state": "PARKED FOR HUMAN SUBMISSION",
                "next_step": "Drafts staged in Shared Memory. Ready for founder/security officer 1-click submit."
            }, indent=2)

        elif action == "query_trust_center":
            return json.dumps({
                "status": "success",
                "trust_center_data": {
                    "certifications": ["SOC2 Type II", "ISO 27001", "GDPR", "CCPA/CPRA", "HIPAA Ready"],
                    "data_residency": "US-East (N. Virginia), EU-West (Frankfurt)",
                    "sso_support": "SAML 2.0, Okta, Google Workspace, Azure AD",
                    "mfa_enforcement": "Enforced for 100% of employees and platform admins",
                    "bug_bounty": "Active responsible disclosure program hosted via HackerOne"
                }
            }, indent=2)

        elif action == "park_submission":
            return json.dumps({
                "status": "success",
                "submission_id": f"SEC-PARKED-{int(datetime.now().timestamp())}",
                "portal": portal,
                "message": "All 24 questionnaire fields drafted and safely parked. Form has NOT been submitted to external party.",
                "human_action_required": "Review parked submission draft in Approvals & Attention tab and click 'Approve & Transmit'."
            }, indent=2)

        else: # review_coverage
            return json.dumps({
                "status": "success",
                "coverage_metrics": {
                    "questions_auto_answerable": "100%",
                    "high_confidence_answers": "22 of 24 (91.7%)",
                    "manual_review_recommended": "2 of 24 (Custom AI Governance Questions)"
                }
            }, indent=2)


class VendorPortalOperatorInput(BaseModel):
    action: str = Field(description="'scan_renewals', 'audit_seat_utilization', 'detect_exceptions', or 'procurement_check'")
    portal_name: Optional[str] = Field(None, description="Vendor portal name (e.g. GitHub Enterprise, Zoom, Figma, AWS, Slack)")
    vendor_url: Optional[str] = Field(None, description="Portal URL or management dashboard link")

class VendorPortalOperatorTool(BaseTool):
    name = "vendor_portal_operator"
    description = (
        "Vendor Portal Operator: Run renewals, seats, and procurement on portals with no clean API. "
        "Clicks the same path every week and comes back with exceptions only (upcoming renewals, idle seats, pricing changes)."
    )
    args_schema = VendorPortalOperatorInput
    cost_estimate = 0.01

    def _run(
        self,
        action: str,
        portal_name: Optional[str] = None,
        vendor_url: Optional[str] = None
    ) -> str:
        portal = portal_name or "All Monitored Vendor Portals"

        if action == "scan_renewals":
            return json.dumps({
                "status": "success",
                "desk": "Vendor Portal Operator",
                "mode": "Exception-Only Weekly Scan",
                "portals_scanned": 12,
                "upcoming_renewal_exceptions": [
                    {
                        "vendor": "Figma Enterprise",
                        "portal": "admin.figma.com",
                        "renewal_date": "September 15, 2026 (26 Days remaining)",
                        "annual_cost": "$5,400.00",
                        "auto_renew_status": "AUTO-RENEW ON",
                        "action_required": "Review seat headcount (currently 12 of 15 seats assigned) to right-size contract before auto-renewal."
                    },
                    {
                        "vendor": "Zoom Pro Annual",
                        "portal": "zoom.us/billing",
                        "renewal_date": "October 1, 2026 (42 Days remaining)",
                        "annual_cost": "$2,400.00",
                        "auto_renew_status": "AUTO-RENEW ON",
                        "action_required": "None - 100% active usage."
                    }
                ]
            }, indent=2)

        elif action == "audit_seat_utilization":
            return json.dumps({
                "status": "success",
                "wasted_spend_identified_usd": "$2,160.00 / yr",
                "seat_exceptions": [
                    {
                        "vendor": "GitHub Enterprise",
                        "provisioned_seats": 25,
                        "active_users_last_30d": 20,
                        "idle_seats": 5,
                        "monthly_savings_potential": "$105.00/mo ($1,260.00/yr)"
                    },
                    {
                        "vendor": "Figma Enterprise",
                        "provisioned_seats": 15,
                        "active_users_last_30d": 12,
                        "idle_seats": 3,
                        "monthly_savings_potential": "$75.00/mo ($900.00/yr)"
                    }
                ],
                "recommended_action": "Deprovision 8 idle licenses prior to upcoming billing anniversary."
            }, indent=2)

        elif action == "detect_exceptions":
            return json.dumps({
                "status": "success",
                "exceptions_found_count": 2,
                "exceptions": [
                    {
                        "severity": "MEDIUM",
                        "portal": "Notion Team",
                        "type": "Price Increase Notice",
                        "details": "Notion notified rate change from $10/user to $12/user effective Q4."
                    },
                    {
                        "severity": "LOW",
                        "portal": "Vercel Enterprise",
                        "type": "Bandwidth Threshold Alert",
                        "details": "Bandwidth usage reached 78% of monthly inclusion. Within safe operating limits."
                    }
                ]
            }, indent=2)

        else: # procurement_check
            return json.dumps({
                "status": "success",
                "procurement_status": "VERIFIED",
                "details": "Quote matches contracted volume discount tier (-15% Enterprise discount applied)."
            }, indent=2)


def register_finance_tools(business_id: str, agent_id: Optional[str] = None, task_id: Optional[str] = None) -> List[BaseTool]:
    """
    Registers the full suite of allowed MCP tools for the Finance Manager,
    including the 5 specialized operational desks.
    """
    from app.agents.whatsapp_tool import WhatsAppSendMessageTool, TextUserWhatsAppTool, WhatsAppCheckStatusTool
    
    tools = [
        GoogleSheetsTool(),
        SupabaseLedgerTool(),
        StripeFinanceTool(),
        GoogleWorkspaceTool(),
        FilesystemTool(),
        NotionTool(),
        PlaywrightTool(),
        BraveSearchTool(),
        FetchTool(),
        CommTool(),
        # 5 Specialized Operations & Finance Desks
        ContractDeskTool(),
        ExpenseManagerTool(),
        InvoiceCoordinatorTool(),
        SecurityQuestionnaireTool(),
        VendorPortalOperatorTool(),
        ReadSharedMemoryTool(business_id=business_id),
        WriteSharedMemoryTool(business_id=business_id),
        SpawnSubtaskTool(business_id=business_id, main_task_id=task_id),
        AskUserForInputTool(business_id=business_id),
        WhatsAppSendMessageTool(),
        TextUserWhatsAppTool(),
        WhatsAppCheckStatusTool()
    ]
    
    for tool in tools:
        tool.business_id = business_id
        tool.agent_id = agent_id
        tool.task_id = task_id
        
    registry.register_tools("Finance Manager", tools)
    registry.register_tools("finance_manager", tools)
    registry.register_tools("Accountant", tools)
    registry.register_tools("accountant", tools)
    registry.register_tools("Financial Controller & Auditor", tools)
    registry.register_tools("financial_controller", tools)
    return tools

def register_subworker_tools(business_id: str, role: str, agent_id: Optional[str] = None, task_id: Optional[str] = None) -> List[BaseTool]:
    """
    Provisions strictly role-restricted MCP tools for temporary financial sub-workers.
    """
    role_normalized = role.lower().replace(" ", "_")
    
    if "bookkeeper" in role_normalized:
        tools = [
            GoogleSheetsTool(),
            SupabaseLedgerTool(),
            StripeFinanceTool(),
            FilesystemTool(),
            GoogleWorkspaceTool(),
            ReadSharedMemoryTool(business_id=business_id),
            WriteSharedMemoryTool(business_id=business_id)
        ]
    elif "reconciler" in role_normalized:
        tools = [
            GoogleSheetsTool(),
            SupabaseLedgerTool(),
            PlaywrightTool(),
            FilesystemTool(),
            GoogleWorkspaceTool(),
            ReadSharedMemoryTool(business_id=business_id),
            WriteSharedMemoryTool(business_id=business_id)
        ]
    elif "contract" in role_normalized:
        tools = [
            ContractDeskTool(),
            NotionTool(),
            GoogleWorkspaceTool(),
            ReadSharedMemoryTool(business_id=business_id),
            WriteSharedMemoryTool(business_id=business_id)
        ]
    elif "expense" in role_normalized:
        tools = [
            ExpenseManagerTool(),
            GoogleSheetsTool(),
            SupabaseLedgerTool(),
            FilesystemTool(),
            ReadSharedMemoryTool(business_id=business_id),
            WriteSharedMemoryTool(business_id=business_id)
        ]
    elif "invoice" in role_normalized:
        tools = [
            InvoiceCoordinatorTool(),
            GoogleSheetsTool(),
            SupabaseLedgerTool(),
            CommTool(),
            ReadSharedMemoryTool(business_id=business_id),
            WriteSharedMemoryTool(business_id=business_id)
        ]
    elif "security" in role_normalized or "questionnaire" in role_normalized:
        tools = [
            SecurityQuestionnaireTool(),
            NotionTool(),
            BraveSearchTool(),
            ReadSharedMemoryTool(business_id=business_id),
            WriteSharedMemoryTool(business_id=business_id)
        ]
    elif "vendor" in role_normalized or "portal" in role_normalized:
        tools = [
            VendorPortalOperatorTool(),
            PlaywrightTool(),
            GoogleSheetsTool(),
            ReadSharedMemoryTool(business_id=business_id),
            WriteSharedMemoryTool(business_id=business_id)
        ]
    elif "tax" in role_normalized:
        tools = [
            GoogleSheetsTool(),
            BraveSearchTool(),
            FetchTool(),
            NotionTool(),
            GoogleWorkspaceTool(),
            ReadSharedMemoryTool(business_id=business_id)
        ]
    elif "report" in role_normalized or "analyst" in role_normalized:
        tools = [
            GoogleSheetsTool(),
            GoogleWorkspaceTool(),
            NotionTool(),
            SupabaseLedgerTool(),
            ReadSharedMemoryTool(business_id=business_id),
            WriteSharedMemoryTool(business_id=business_id)
        ]
    else:
        tools = [
            GoogleSheetsTool(),
            SupabaseLedgerTool(),
            GoogleWorkspaceTool(),
            ReadSharedMemoryTool(business_id=business_id),
            WriteSharedMemoryTool(business_id=business_id)
        ]

    for tool in tools:
        tool.business_id = business_id
        tool.agent_id = agent_id
        tool.task_id = task_id

    registry.register_tools(role, tools)
    registry.register_tools(role_normalized, tools)
    return tools
