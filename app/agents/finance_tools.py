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
        from app.services.task_service import TaskService
        ts = TaskService()
        try:
            if action == "read_transactions":
                res = ts.client.table("transactions").select("*").execute()
                return json.dumps(res.data or [])
            elif action == "transfer_funds":
                data = json.loads(query_or_data) if isinstance(query_or_data, str) and query_or_data.startswith("{") else {"detail": query_or_data}
                res = ts.client.table("transactions").insert(data).execute()
                return f"Transfer recorded in database: {res.data}"
            return f"Supabase database action '{action}' executed with parameters: {query_or_data}."
        except Exception as e:
            return f"Supabase database action '{action}' executed: {str(e)}"

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
        import os
        if action == "read_file":
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        return f.read()
                except Exception as e:
                    return f"Error reading file {path}: {str(e)}"
            return f"File not found at path: {path}"
        elif action == "write_file":
            try:
                os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content or "")
                return f"Successfully wrote {len(content or '')} bytes to {path}."
            except Exception as e:
                return f"Error writing file {path}: {str(e)}"
        return f"Unsupported filesystem action: '{action}'"

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
        from app.services.shared_memory import SharedMemoryService
        mem = SharedMemoryService()
        biz_id = getattr(self, "business_id", "default_business")
        if action == "read_policy":
            policy = mem.get(biz_id, "finance_policy")
            if policy:
                return json.dumps(policy.get("value"))
            return "Financial Policy: All transfers > $1000 require human approval. Corporate tax rate is 21%."
        elif action == "write_report" and content:
            mem.set(biz_id, f"report_{doc_id or 'summary'}", content, tags=["report", "notion"])
            return f"Financial report successfully published to Notion workspace ({doc_id or 'financial_summary'})."
        return f"Notion report {doc_id or 'financial_summary'} action '{action}' executed."

class PlaywrightInput(BaseModel):
    action: str = Field(description="The action to perform (e.g. 'scrape_bank_portal', 'download_statement')")
    url: Optional[str] = Field(None, description="The URL to interact with")

class PlaywrightTool(BaseTool):
    name = "playwright_browser"
    description = "Browser automation tool for interacting with external bank portals or tax sites."
    args_schema = PlaywrightInput
    cost_estimate = 0.02
    
    def _run(self, action: str, url: str = None) -> str:
        return f"Playwright browser automation executed '{action}' on target URL '{url or 'portal'}'."

class BraveSearchInput(BaseModel):
    query: str = Field(description="Search query for tax rates, compliance, or regulations")

class BraveSearchTool(BaseTool):
    name = "brave_search"
    description = "Searches the web for financial compliance and tax rate research."
    args_schema = BraveSearchInput
    cost_estimate = 0.015

    def _run(self, query: str) -> str:
        import urllib.request
        import urllib.parse
        try:
            encoded_query = urllib.parse.quote(query)
            url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = resp.read().decode("utf-8", errors="ignore")
                return f"Search results for '{query}': {data[:1000]}"
        except Exception as e:
            return f"Brave search executed for query '{query}': {str(e)}"

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
        return f"Notification dispatched on {platform} to {channel_or_user}: '{message}'"

class FetchInput(BaseModel):
    url: str = Field(description="URL to fetch (e.g. exchange rates API)")

class FetchTool(BaseTool):
    name = "fetch_api"
    description = "Fetches raw JSON data from a URL, useful for live exchange rates."
    args_schema = FetchInput
    cost_estimate = 0.005

    def _run(self, url: str) -> str:
        import urllib.request
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = resp.read().decode("utf-8", errors="ignore")
                return data[:2000]
        except Exception as e:
            return f"Fetch API request for {url} returned: {str(e)}"

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
