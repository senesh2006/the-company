import json
from typing import List, Optional, Any
from pydantic import BaseModel, Field
from app.agents.tool_registry import BaseTool, registry
from app.agents.tools import ReadSharedMemoryTool, WriteSharedMemoryTool, SpawnSubtaskTool

# --- Finance Specific MCP Tools ---

class SupabaseInput(BaseModel):
    action: str = Field(description="The action to perform: 'read_transactions', 'write_invoice', or 'transfer_funds'")
    query_or_data: str = Field(description="The query or JSON data for the action")

class SupabaseTool(BaseTool):
    name = "supabase_database"
    description = "Core financial database for reading transactions, writing invoices, and executing transfers."
    args_schema = SupabaseInput
    cost_estimate = 0.05
    
    def _run(self, action: str, query_or_data: str) -> str:
        if action == "read_transactions":
            return "Retrieved 15 recent transactions. All matched expected ledgers."
        elif action == "transfer_funds":
            return f"Simulated transfer execution: {query_or_data}. (Requires Approval if >$1000)"
        return f"Supabase executed '{action}' successfully."

class GoogleWorkspaceInput(BaseModel):
    app: str = Field(description="'sheets', 'gmail', or 'docs'")
    action: str = Field(description="'read' or 'write'")
    target: str = Field(description="Email address, Sheet ID, or Doc ID")
    content: Optional[str] = Field(None, description="Content to send or write")

class GoogleWorkspaceTool(BaseTool):
    name = "google_workspace"
    description = "Interacts with Google Workspace (Sheets for models, Gmail for invoices)."
    args_schema = GoogleWorkspaceInput
    cost_estimate = 0.02

    def _run(self, app: str, action: str, target: str, content: str = None) -> str:
        return f"Google {app} action '{action}' on {target} completed successfully."

class FilesystemInput(BaseModel):
    action: str = Field(description="'read_file' or 'write_file'")
    path: str = Field(description="Path to the file")
    content: Optional[str] = Field(None, description="Content to write")

class FilesystemTool(BaseTool):
    name = "filesystem"
    description = "Reads or writes files to the local filesystem (useful for receipts and local audit logs)."
    args_schema = FilesystemInput
    cost_estimate = 0.005

    def _run(self, action: str, path: str, content: str = None) -> str:
        if action == "read_file":
            return f"Mock content of {path}: Receipt data extracted."
        return f"Successfully wrote {len(content or '')} bytes to {path}."

class NotionInput(BaseModel):
    action: str = Field(description="'read_policy' or 'write_report'")
    doc_id: Optional[str] = Field(None, description="ID of the Notion document")
    content: Optional[str] = Field(None, description="Content to write")

class NotionTool(BaseTool):
    name = "notion_workspace"
    description = "Interacts with Notion to read financial policies or write month-end reports."
    args_schema = NotionInput
    cost_estimate = 0.01

    def _run(self, action: str, doc_id: str = None, content: str = None) -> str:
        if action == "read_policy":
            return "Financial Policy: All transfers > $1000 require human approval. Corporate tax rate is 21%."
        return f"Notion report {doc_id or 'financial_summary'} updated successfully."

class PlaywrightInput(BaseModel):
    action: str = Field(description="The action to perform (e.g. 'scrape_bank_portal', 'download_statement')")
    url: Optional[str] = Field(None, description="The URL to interact with")

class PlaywrightTool(BaseTool):
    name = "playwright_browser"
    description = "Browser automation tool for interacting with external bank portals or tax sites."
    args_schema = PlaywrightInput
    cost_estimate = 0.02
    
    def _run(self, action: str, url: str = None) -> str:
        return f"Playwright executed '{action}' on {url or 'bank_portal'}. Downloaded statement CSV."

class BraveSearchInput(BaseModel):
    query: str = Field(description="Search query for tax rates, compliance, or regulations")

class BraveSearchTool(BaseTool):
    name = "brave_search"
    description = "Searches the web for financial compliance and tax rate research."
    args_schema = BraveSearchInput
    cost_estimate = 0.015

    def _run(self, query: str) -> str:
        return f"Brave Search results for '{query}': Current regulations indicate standard deduction applies."

class CommInput(BaseModel):
    platform: str = Field(description="'slack' or 'whatsapp'")
    channel_or_user: str = Field(description="Target channel or user (e.g. 'finance_approvals')")
    message: str = Field(description="Message content")

class CommTool(BaseTool):
    name = "internal_communication"
    description = "Sends messages via WhatsApp or Slack to request human approval or notify of risks."
    args_schema = CommInput
    cost_estimate = 0.01

    def _run(self, platform: str, channel_or_user: str, message: str) -> str:
        return f"Urgent notification sent on {platform} to {channel_or_user}: '{message}'"

class FetchInput(BaseModel):
    url: str = Field(description="URL to fetch (e.g. exchange rates API)")

class FetchTool(BaseTool):
    name = "fetch_api"
    description = "Fetches raw JSON data from a URL, useful for live exchange rates."
    args_schema = FetchInput
    cost_estimate = 0.005

    def _run(self, url: str) -> str:
        return f"Fetched live exchange rates from {url}: 1 USD = 0.92 EUR."

def register_finance_tools(business_id: str, agent_id: str = None, task_id: str = None):
    """
    Registers the specific allowed MCP tools for the Finance Manager role.
    """
    tools = [
        SupabaseTool(),
        GoogleWorkspaceTool(),
        FilesystemTool(),
        NotionTool(),
        PlaywrightTool(),
        BraveSearchTool(),
        CommTool(),
        FetchTool(),
        ReadSharedMemoryTool(business_id=business_id),
        WriteSharedMemoryTool(business_id=business_id),
        SpawnSubtaskTool(business_id=business_id, main_task_id=task_id)
    ]
    
    # Inject metadata for cost tracking
    for tool in tools:
        tool.business_id = business_id
        tool.agent_id = agent_id
        tool.task_id = task_id
        
    registry.register_tools("Finance Manager", tools)
    return tools
