import json
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from app.agents.tool_registry import BaseTool, registry
from app.agents.tools import ReadSharedMemoryTool, WriteSharedMemoryTool, SpawnSubtaskTool

# --- Finance Specific MCP Tools ---

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
            return json.dumps([
                {"id": "tx_101", "date": "2026-07-15", "vendor": "AWS Cloud Services", "amount": 420.50, "account": "5000 - Cloud Hosting & Server Infrastructure", "status": "posted"},
                {"id": "tx_102", "date": "2026-07-18", "vendor": "OpenAI API", "amount": 185.20, "account": "5100 - LLM Inference & API Costs", "status": "posted"},
                {"id": "tx_103", "date": "2026-07-20", "vendor": "Stripe Processing", "amount": 45.00, "account": "5200 - Payment Processing Fees (Stripe)", "status": "posted"},
                {"id": "tx_104", "date": "2026-07-28", "vendor": "Google Workspace", "amount": 72.00, "account": "6000 - Software Subscriptions & SaaS Tools", "status": "posted"},
                {"id": "tx_105", "date": "2026-07-30", "vendor": "SaaS Customer A", "amount": 3500.00, "account": "4000 - Software Subscription Revenue", "status": "posted"}
            ])
        elif action == "get_chart_of_accounts":
            return json.dumps({
                "Assets (1000s)": ["1000 Cash", "1050 Operating Bank", "1100 Accounts Receivable", "1200 Prepaid Expenses"],
                "Liabilities (2000s)": ["2000 Accounts Payable", "2100 Accrued Liabilities", "2200 Corporate Credit Card"],
                "Equity (3000s)": ["3000 Common Stock", "3100 Retained Earnings"],
                "Revenue (4000s)": ["4000 Software Subscription Revenue", "4100 Professional Services"],
                "COGS (5000s)": ["5000 Cloud Hosting", "5100 LLM Inference Costs", "5200 Payment Processing"],
                "OPEX (6000s)": ["6000 Software & SaaS", "6100 Marketing", "6200 Legal & Professional", "6400 Travel & Meals", "6500 Taxes"]
            })
        elif action == "read_trial_balance":
            return json.dumps({
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
            return f"Journal Entry successfully recorded into Supabase ledger with cryptographic audit hash. Entry payload: {query_or_data}"
        elif action == "transfer_funds":
            return f"Simulated transfer execution: {query_or_data}. (Requires human founder authorization)"
        return f"Supabase ledger action '{action}' executed successfully."

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
        if action == "read_charges":
            return json.dumps([
                {"charge_id": "ch_3M901", "customer": customer_id or "cus_AcmeCorp", "amount": 2500.00, "status": "succeeded", "fee": 72.80, "created": "2026-07-22"},
                {"charge_id": "ch_3M902", "customer": "cus_BetaLLC", "amount": 1000.00, "status": "succeeded", "fee": 29.30, "created": "2026-07-24"}
            ])
        elif action == "read_invoices":
            return json.dumps([
                {"invoice_id": "in_9921", "customer": customer_id or "cus_AcmeCorp", "total": 2500.00, "status": "paid", "due_date": "2026-07-31"},
                {"invoice_id": "in_9922", "customer": "cus_GammaInc", "total": 1200.00, "status": "open", "due_date": "2026-08-15"}
            ])
        elif action == "create_draft_invoice":
            return f"Created Draft Stripe Invoice for customer '{customer_id or 'cus_default'}' in the amount of ${amount or 0.00:.2f}. Status: DRAFT (Non-destructive)."
        elif action == "issue_refund":
            return f"REFUND ACTION: Refund request for ${amount or 0.00:.2f} logged. (High-risk action - must receive founder sign-off)."
        elif action == "transfer_funds":
            return f"PAYOUT ACTION: Transfer of ${amount or 0.00:.2f} logged. (High-risk action - must receive founder sign-off)."
        return f"Stripe action '{action}' completed."

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
                return f"Google Sheets '{target}': Retrieved Monthly Budget Model (Target OPEX: $15,000/mo, Actuals: $12,470/mo, Variance: +$2,530 favorable)."
            return f"Google Sheets '{target}': Successfully updated cells with new financial actuals."
        elif app == "gmail":
            if action == "read":
                return f"Gmail inbox search for '{target}': Extracted 3 vendor invoices (AWS: $420.50, Figma: $45.00, Notion: $28.00)."
            return f"Gmail draft created for recipient '{target}'."
        return f"Google {app} action '{action}' on '{target}' completed."

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
            return (
                "Company OS Financial Governance Policy:\n"
                "1. Zero unattended external money movement without human signoff.\n"
                "2. Standard corporate income tax reserve: 21%.\n"
                "3. Double-entry general ledger must balance before closing any period.\n"
                "4. All software subscriptions > $50/mo require designated departmental owner."
            )
        elif action == "update_close_checklist":
            return f"Month-End Closing Checklist on Notion '{doc_id or 'Closing Hub'}' marked 100% complete."
        return f"Notion Financial Report '{doc_id or 'Month-End Close Memo'}' successfully published."

class PlaywrightInput(BaseModel):
    action: str = Field(description="'scrape_bank_portal' or 'download_statement'")
    url: Optional[str] = Field(None, description="Bank portal URL")

class PlaywrightTool(BaseTool):
    name = "playwright_browser"
    description = "Browser automation tool for bank portal statement downloading and third-party portal reconciliation."
    args_schema = PlaywrightInput
    cost_estimate = 0.02
    
    def _run(self, action: str, url: Optional[str] = None) -> str:
        return f"Playwright automation '{action}' on '{url or 'Primary Bank Portal'}': Downloaded verified bank statement statement_2026_07.csv (Ending Balance: $48,250.00)."

class BraveSearchInput(BaseModel):
    query: str = Field(description="Search query for tax rates, GAAP accounting standards, or FX regulations")

class BraveSearchTool(BaseTool):
    name = "brave_search"
    description = "Searches the web for latest tax rate guidelines, GAAP rules, and compliance research."
    args_schema = BraveSearchInput
    cost_estimate = 0.015

    def _run(self, query: str) -> str:
        return f"Brave Search result for '{query}': Corporate tax rate is 21%. Section 174 software development capitalization rules apply."

class FetchInput(BaseModel):
    url: str = Field(description="API URL (e.g. currency exchange rates or inflation index)")

class FetchTool(BaseTool):
    name = "fetch_api"
    description = "Fetches live foreign exchange rates and financial benchmark data."
    args_schema = FetchInput
    cost_estimate = 0.005

    def _run(self, url: str) -> str:
        return f"Live FX API response from '{url}': 1 USD = 0.92 EUR, 1 USD = 0.79 GBP, 1 USD = 155.20 JPY."

class CommInput(BaseModel):
    platform: str = Field(description="'slack' or 'whatsapp'")
    channel_or_user: str = Field(description="Target channel or user (e.g. '#finance-audit', '+15550192837')")
    message: str = Field(description="Message text regarding approval requests or audit alerts")

class CommTool(BaseTool):
    name = "internal_communication"
    description = "Sends urgent notifications and human-approval requests over Slack or WhatsApp."
    args_schema = CommInput
    cost_estimate = 0.01

    def _run(self, platform: str, channel_or_user: str, message: str) -> str:
        return f"Notification successfully dispatched via {platform.upper()} to {channel_or_user}: '{message}'"

def register_finance_tools(business_id: str, agent_id: Optional[str] = None, task_id: Optional[str] = None) -> List[BaseTool]:
    """
    Registers the full suite of allowed MCP tools for the Finance Manager.
    """
    tools = [
        SupabaseLedgerTool(),
        StripeFinanceTool(),
        GoogleWorkspaceTool(),
        FilesystemTool(),
        NotionTool(),
        PlaywrightTool(),
        BraveSearchTool(),
        FetchTool(),
        CommTool(),
        ReadSharedMemoryTool(business_id=business_id),
        WriteSharedMemoryTool(business_id=business_id),
        SpawnSubtaskTool(business_id=business_id, main_task_id=task_id)
    ]
    
    for tool in tools:
        tool.business_id = business_id
        tool.agent_id = agent_id
        tool.task_id = task_id
        
    registry.register_tools("Finance Manager", tools)
    registry.register_tools("finance_manager", tools)
    return tools

def register_subworker_tools(business_id: str, role: str, agent_id: Optional[str] = None, task_id: Optional[str] = None) -> List[BaseTool]:
    """
    Provisions strictly role-restricted MCP tools for temporary financial sub-workers.
    """
    role_normalized = role.lower().replace(" ", "_")
    
    if "bookkeeper" in role_normalized:
        tools = [
            SupabaseLedgerTool(),
            StripeFinanceTool(),
            FilesystemTool(),
            GoogleWorkspaceTool(),
            ReadSharedMemoryTool(business_id=business_id),
            WriteSharedMemoryTool(business_id=business_id)
        ]
    elif "reconciler" in role_normalized:
        tools = [
            SupabaseLedgerTool(),
            PlaywrightTool(),
            FilesystemTool(),
            GoogleWorkspaceTool(),
            ReadSharedMemoryTool(business_id=business_id),
            WriteSharedMemoryTool(business_id=business_id)
        ]
    elif "tax" in role_normalized:
        tools = [
            BraveSearchTool(),
            FetchTool(),
            NotionTool(),
            GoogleWorkspaceTool(),
            ReadSharedMemoryTool(business_id=business_id)
        ]
    elif "report" in role_normalized or "analyst" in role_normalized:
        tools = [
            GoogleWorkspaceTool(),
            NotionTool(),
            SupabaseLedgerTool(),
            ReadSharedMemoryTool(business_id=business_id),
            WriteSharedMemoryTool(business_id=business_id)
        ]
    else:
        tools = [
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
