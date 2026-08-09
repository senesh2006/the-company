import json
import logging
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from app.agents.tool_registry import BaseTool, registry
from app.agents.tools import ReadSharedMemoryTool, WriteSharedMemoryTool, SpawnSubtaskTool, AskUserForInputTool
from app.services.mcp_client import mcp_call_or_default

logger = logging.getLogger(__name__)

# --- Marketing Specific MCP Tools ---

def _marketing_mcp_call(mcp_name: str, tool_name: str, arguments: Dict[str, Any], default_result: Any) -> Any:
    """Call a real MCP server if configured, otherwise return the default mock result."""
    return mcp_call_or_default(mcp_name, tool_name, arguments, default_result)

class PlaywrightInput(BaseModel):
    action: str = Field(description="The action to perform (e.g. 'post_tweet', 'scrape_page')")
    url: Optional[str] = Field(None, description="The URL to interact with")
    content: Optional[str] = Field(None, description="Content to post or type")

class PlaywrightTool(BaseTool):
    name = "playwright_browser"
    description = "Browser automation tool for posting to social media and scraping pages."
    args_schema = PlaywrightInput
    cost_estimate = 0.02
    
    def _run(self, action: str, url: str = None, content: str = None) -> str:
        default = f"Playwright executed '{action}' on {url or 'target'}. Content processed: {content[:20] if content else 'None'}..."
        return _marketing_mcp_call(
            "browser",
            action,
            {"url": url, "content": content},
            default,
        )

class BraveSearchInput(BaseModel):
    query: str = Field(description="Search query for trends or competitor research")

class BraveSearchTool(BaseTool):
    name = "brave_search"
    description = "Searches the web for trend and competitor research using free web search."
    args_schema = BraveSearchInput
    cost_estimate = 0.015

    def _run(self, query: str) -> str:
        from app.services.web_search import search_web
        result = search_web(query)
        if result and "failed" not in result.lower():
            return result

        # If DuckDuckGo fails, fall back to the MCP/mock path.
        default = f"Brave search executed for query '{query}': no results."
        return _marketing_mcp_call(
            "brave",
            "search",
            {"query": query},
            default,
        )

class NotionInput(BaseModel):
    action: str = Field(description="'read_calendar' or 'update_calendar'")
    doc_id: Optional[str] = Field(None, description="ID of the Notion document")
    content: Optional[str] = Field(None, description="Content to write")

class NotionTool(BaseTool):
    name = "notion_workspace"
    description = "Interacts with Notion to manage the content calendar and documents."
    args_schema = NotionInput
    cost_estimate = 0.01

    def _run(self, action: str, doc_id: str = None, content: str = None) -> str:
        from app.services.shared_memory import SharedMemoryService
        mem = SharedMemoryService()
        biz_id = getattr(self, "business_id", "default_business")
        if action == "read_calendar":
            calendar_data = mem.get(biz_id, "content_calendar")
            if calendar_data:
                default = json.dumps(calendar_data.get("value"))
            else:
                default = "Content Calendar: No scheduled posts currently in workspace."
        elif action == "update_calendar" and content:
            mem.set(biz_id, "content_calendar", content, tags=["calendar", "notion"])
            default = f"Content Calendar updated successfully in Notion workspace ({doc_id or 'main'})."
        else:
            default = f"Notion workspace action '{action}' on document '{doc_id or 'main'}' completed."

        return _marketing_mcp_call(
            "notion",
            action,
            {"doc_id": doc_id, "content": content},
            default,
        )

class FilesystemInput(BaseModel):
    action: str = Field(description="'read_file' or 'write_file'")
    path: str = Field(description="Path to the file")
    content: Optional[str] = Field(None, description="Content to write")

class FilesystemTool(BaseTool):
    name = "filesystem"
    description = "Reads or writes files to the local filesystem (useful for asset management)."
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

class CommInput(BaseModel):
    platform: str = Field(description="'slack' or 'whatsapp'")
    channel_or_user: str = Field(description="Target channel or user")
    message: str = Field(description="Message content")

class CommTool(BaseTool):
    name = "internal_communication"
    description = "Sends messages via WhatsApp or Slack for internal communication."
    args_schema = CommInput
    cost_estimate = 0.01

    def _run(self, platform: str, channel_or_user: str, message: str) -> str:
        default = f"Communication sent on {platform} to {channel_or_user}: '{message}'"
        mcp_name = "slack" if platform.lower() == "slack" else "whatsapp"
        return _marketing_mcp_call(
            mcp_name,
            "send_message",
            {"platform": platform, "channel_or_user": channel_or_user, "message": message},
            default,
        )

class GoogleWorkspaceInput(BaseModel):
    app: str = Field(description="'gmail' or 'docs'")
    action: str = Field(description="'read' or 'write'")
    target: str = Field(description="Email address or Doc ID")
    content: Optional[str] = Field(None, description="Content to send or write")

class GoogleWorkspaceTool(BaseTool):
    name = "google_workspace"
    description = "Interacts with Google Workspace (Gmail + Docs)."
    args_schema = GoogleWorkspaceInput
    cost_estimate = 0.02

    def _run(self, app: str, action: str, target: str, content: str = None) -> str:
        default = f"Google {app} action '{action}' on {target} completed successfully."
        return _marketing_mcp_call(
            "google",
            f"{app}_{action}",
            {"app": app, "action": action, "target": target, "content": content},
            default,
        )

class FetchInput(BaseModel):
    url: str = Field(description="URL to fetch")

class FetchTool(BaseTool):
    name = "fetch_api"
    description = "Fetches raw data from a URL."
    args_schema = FetchInput
    cost_estimate = 0.005

    def _run(self, url: str) -> str:
        import urllib.request
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = resp.read().decode("utf-8", errors="ignore")
                default = data[:2000]
        except Exception as e:
            default = f"Fetch API request for {url} returned: {str(e)}"

        return _marketing_mcp_call(
            "fetch",
            "get",
            {"url": url},
            default,
        )

class Context7Input(BaseModel):
    query: str = Field(description="Query for Context7 advanced semantic retrieval")

class Context7Tool(BaseTool):
    name = "context7"
    description = "Retrieves deep semantic context from the Context7 knowledge base."
    args_schema = Context7Input
    cost_estimate = 0.05

    def _run(self, query: str) -> str:
        from app.services.shared_memory import SharedMemoryService
        mem = SharedMemoryService()
        biz_id = getattr(self, "business_id", "default_business")
        results = mem.list_by_tags(biz_id, ["context7", "knowledge"])
        if results:
            default = json.dumps(results)
        else:
            default = f"Context7 knowledge query '{query}' returned no matching records for business {biz_id}."

        return _marketing_mcp_call(
            "context7",
            "search",
            {"query": query, "business_id": biz_id},
            default,
        )

def register_marketing_tools(business_id: str, agent_id: str = None, task_id: str = None):
    """
    Registers the specific allowed MCP tools for the Marketing Manager role.
    """
    tools = [
        PlaywrightTool(),
        BraveSearchTool(),
        NotionTool(),
        FilesystemTool(),
        CommTool(),
        GoogleWorkspaceTool(),
        FetchTool(),
        Context7Tool(),
        ReadSharedMemoryTool(business_id=business_id),
        WriteSharedMemoryTool(business_id=business_id),
        SpawnSubtaskTool(business_id=business_id, main_task_id=task_id),
        AskUserForInputTool(business_id=business_id)
    ]
    
    # Inject metadata for cost tracking
    for tool in tools:
        tool.business_id = business_id
        tool.agent_id = agent_id
        tool.task_id = task_id
        
    registry.register_tools("Marketing Manager", tools)
    return tools
