import json
from typing import List, Optional, Any
from pydantic import BaseModel, Field
from app.agents.tool_registry import BaseTool, registry
from app.agents.tools import ReadSharedMemoryTool, WriteSharedMemoryTool, SpawnSubtaskTool

# --- Marketing Specific MCP Tools ---

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
        return f"Playwright executed '{action}' on {url or 'target'}. Content processed: {content[:20] if content else 'None'}..."

class BraveSearchInput(BaseModel):
    query: str = Field(description="Search query for trends or competitor research")

class BraveSearchTool(BaseTool):
    name = "brave_search"
    description = "Searches the web for trend and competitor research using Brave Search."
    args_schema = BraveSearchInput
    cost_estimate = 0.015

    def _run(self, query: str) -> str:
        return f"Brave Search results for '{query}': Found 5 trending topics and 2 competitor articles."

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
        if action == "read_calendar":
            return "Content Calendar: [Monday: Tech Blog Post, Wednesday: Feature Tweet, Friday: Newsletter]"
        return f"Notion document {doc_id or 'calendar'} updated successfully."

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
        if action == "read_file":
            return f"Mock content of {path}: brand assets and copy drafts."
        return f"Successfully wrote {len(content or '')} bytes to {path}."

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
        return f"Message sent on {platform} to {channel_or_user}: '{message}'"

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
        return f"Google {app} action '{action}' on {target} completed successfully."

class FetchInput(BaseModel):
    url: str = Field(description="URL to fetch")

class FetchTool(BaseTool):
    name = "fetch_api"
    description = "Fetches raw data from a URL."
    args_schema = FetchInput
    cost_estimate = 0.005

    def _run(self, url: str) -> str:
        return f"Fetched 1.2MB of data from {url}."

class Context7Input(BaseModel):
    query: str = Field(description="Query for Context7 advanced semantic retrieval")

class Context7Tool(BaseTool):
    name = "context7"
    description = "Retrieves deep semantic context from the Context7 knowledge base."
    args_schema = Context7Input
    cost_estimate = 0.05

    def _run(self, query: str) -> str:
        return f"Context7 insight for '{query}': High relevance score. Competitor is launching a similar feature next week."

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
        SpawnSubtaskTool(business_id=business_id, main_task_id=task_id)
    ]
    
    # Inject metadata for cost tracking
    for tool in tools:
        tool.business_id = business_id
        tool.agent_id = agent_id
        tool.task_id = task_id
        
    registry.register_tools("Marketing Manager", tools)
    return tools
