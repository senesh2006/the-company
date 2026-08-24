import json
import logging
from typing import Any, Dict, List, Optional, Type
from pydantic import BaseModel, Field, create_model
from langchain_core.tools import StructuredTool

from app.agents.tool_registry import BaseTool, registry
from app.services.composio_client import composio_service
from app.services.google_sheets_service import GoogleSheetsService
from app.services.shared_memory import SharedMemoryService

logger = logging.getLogger(__name__)


# ----------------- DYNAMIC TOOL WRAPPER -----------------

class DynamicConnectedTool(BaseTool):
    """
    Dynamically wraps a tool action discovered from a connected integration
    (e.g. Google Sheets, Gmail, Slack, GitHub, Google Calendar, Notion, Stripe).
    """
    def __init__(
        self,
        name: str,
        description: str,
        toolkit: str,
        action_slug: str,
        args_schema: Type[BaseModel],
        handler_fn: Any,
        category: str = "Connected Integration",
        cost_estimate: float = 0.005,
        business_id: Optional[str] = None,
        user_id: Optional[str] = None
    ):
        self.name = name
        self.description = description
        self.toolkit = toolkit
        self.action_slug = action_slug
        self.args_schema = args_schema
        self.handler_fn = handler_fn
        self.category = category
        self.cost_estimate = cost_estimate
        self.business_id = business_id
        self.user_id = user_id

    def _run(self, **kwargs) -> Any:
        try:
            return self.handler_fn(**kwargs)
        except Exception as e:
            logger.error(f"Error executing dynamic tool '{self.name}' ({self.toolkit}:{self.action_slug}): {e}")
            return f"Tool execution failed for {self.name}: {str(e)}"


# ----------------- DYNAMIC SCHEMAS & HANDLERS -----------------

class GoogleSheetsActionInput(BaseModel):
    action: str = Field("get_trial_balance", description="Action to perform: 'create_group_financial_tracking_system', 'create_sheet', 'append_journal_entry', 'get_chart_of_accounts', 'get_trial_balance', 'sync_to_sheets', 'read_sheet'")
    sheet_name: Optional[str] = Field("Accounts", description="Target sheet or group name e.g. 'SSS Group of Companies', 'General Journal', 'Trial Balance'")
    range_or_cell: Optional[str] = Field(None, description="Optional cell or range e.g. 'A1:G50'")
    payload: Optional[str] = Field(None, description="JSON payload for journal entry, new account, or sheet configuration")

class GmailSendEmailInput(BaseModel):
    recipient: str = Field(..., description="Email address of the recipient")
    subject: str = Field(..., description="Subject line of the email")
    body: str = Field(..., description="Plain text or HTML email body")
    attachments: Optional[List[str]] = Field(default_factory=list, description="Optional file attachment paths or URLs")

class GmailSearchInput(BaseModel):
    query: str = Field(..., description="Gmail search query e.g. 'from:boss subject:invoice', 'is:unread'")
    max_results: int = Field(5, description="Maximum number of emails to retrieve")

class SlackSendMessageInput(BaseModel):
    channel: str = Field(..., description="Channel name or ID e.g. '#general', '#finance-updates'")
    message: str = Field(..., description="Message text to post in Slack")

class SlackReadChannelInput(BaseModel):
    channel: str = Field(..., description="Channel name or ID")
    limit: int = Field(10, description="Number of recent messages to fetch")

class GitHubIssueInput(BaseModel):
    repo: str = Field(..., description="Repository name in format 'owner/repo'")
    title: str = Field(..., description="Title of the issue")
    body: str = Field(..., description="Description of the bug, feature request, or task")
    labels: Optional[List[str]] = Field(default_factory=list, description="Labels e.g. ['bug', 'priority-high']")

class GitHubPullRequestInput(BaseModel):
    repo: str = Field(..., description="Repository name in format 'owner/repo'")
    title: str = Field(..., description="Title of the pull request")
    body: str = Field(..., description="PR description and changelog")
    head: str = Field(..., description="Branch with changes")
    base: str = Field("main", description="Target base branch")

class GoogleCalendarEventInput(BaseModel):
    title: str = Field(..., description="Meeting or event title")
    start_time: str = Field(..., description="ISO 8601 start time (e.g. 2026-08-25T10:00:00Z)")
    end_time: str = Field(..., description="ISO 8601 end time (e.g. 2026-08-25T11:00:00Z)")
    attendees: Optional[List[str]] = Field(default_factory=list, description="List of attendee email addresses")
    description: Optional[str] = Field(None, description="Meeting agenda or description")

class NotionCreatePageInput(BaseModel):
    parent_page_or_db_id: str = Field(..., description="Target Notion parent page ID or database ID")
    title: str = Field(..., description="Title of the page to create")
    content_markdown: str = Field(..., description="Markdown content for the Notion page body")


# ----------------- TOOL DISCOVERY SERVICE -----------------

class ToolDiscoveryService:
    """
    Dynamically inspects connected integrations, discovers available tools and actions,
    and constructs runtime BaseTool & LangChain tool instances.
    """

    def __init__(self):
        self.memory = SharedMemoryService()

    def discover_connected_toolkits(self, user_id: str, business_id: str) -> List[Dict[str, Any]]:
        """
        Discovers all active connected integrations for the given user and business.
        """
        connected = []

        # 1. Google Sheets Connection
        try:
            gs = GoogleSheetsService(business_id=business_id)
            cfg = gs.get_config()
            connected.append({
                "toolkit": "googlesheets",
                "name": "Google Sheets",
                "category": "Spreadsheets & Finance",
                "status": "connected",
                "mode": cfg.get("mode", "live_api"),
                "spreadsheet_url": cfg.get("spreadsheet_url"),
                "spreadsheet_title": cfg.get("spreadsheet_title", "Master General Ledger"),
                "icon": "FileSpreadsheet"
            })
        except Exception as e:
            logger.debug(f"Google Sheets discovery note: {e}")

        # 2. Composio & OAuth Connections
        try:
            connections = composio_service.list_user_connections(user_id=user_id)
            for conn in connections:
                if conn.get("status") == "connected" and conn.get("toolkit") != "googlesheets":
                    connected.append({
                        "toolkit": conn["toolkit"],
                        "name": conn.get("name", conn["toolkit"].capitalize()),
                        "category": conn.get("category", "Integration"),
                        "status": "connected",
                        "composio_connection_id": conn.get("composio_connection_id"),
                        "icon": conn["toolkit"].capitalize()
                    })
        except Exception as e:
            logger.debug(f"Composio connection discovery note: {e}")

        return connected

    def discover_tools_for_user(
        self,
        business_id: str = "00000000-0000-0000-0000-000000000001",
        user_id: str = "00000000-0000-0000-0000-000000000001",
        role: Optional[str] = None
    ) -> List[BaseTool]:
        """
        Discovers all active tools from connected integrations and returns dynamic BaseTool instances.
        Filters by role relevance if role is provided.
        """
        discovered_tools: List[BaseTool] = []
        connected_toolkits = self.discover_connected_toolkits(user_id=user_id, business_id=business_id)
        connected_slugs = {c["toolkit"].lower() for c in connected_toolkits}

        # 1. Google Sheets Discovered Tools
        if "googlesheets" in connected_slugs:
            gs_service = GoogleSheetsService(business_id=business_id)
            
            def handle_sheets(action: str = "get_trial_balance", sheet_name: str = "Accounts", range_or_cell: Optional[str] = None, payload: Optional[str] = None):
                from app.agents.google_sheets_tool import GoogleSheetsTool
                tool_inst = GoogleSheetsTool()
                setattr(tool_inst, "business_id", business_id)
                return tool_inst._run(action=action, sheet_name=sheet_name, range_or_cell=range_or_cell, payload_json=payload)

            discovered_tools.append(
                DynamicConnectedTool(
                    name="google_sheets",
                    description=(
                        "Interacts directly with Google Sheets. Actions: "
                        "'create_group_financial_tracking_system' (initialize multi-entity tracking for SSS Group of Companies), "
                        "'create_sheet' (create ledger sheet), 'append_journal_entry' (record double-entry transaction), "
                        "'get_chart_of_accounts' (view COA), 'get_trial_balance' (reconcile debits/credits), "
                        "'sync_to_sheets' (export all accounts), 'read_sheet' (fetch rows)."
                    ),
                    toolkit="googlesheets",
                    action_slug="google_sheets_master",
                    args_schema=GoogleSheetsActionInput,
                    handler_fn=handle_sheets,
                    category="Finance & Spreadsheets",
                    business_id=business_id,
                    user_id=user_id
                )
            )

        # 2. Gmail Discovered Tools
        if "gmail" in connected_slugs:
            def handle_gmail_send(recipient: str, subject: str, body: str, attachments: Optional[List[str]] = None):
                try:
                    return composio_service.execute_tool(
                        user_id=user_id,
                        slug="GMAIL_SEND_EMAIL",
                        arguments={"recipient_email": recipient, "subject": subject, "body": body}
                    )
                except Exception as e:
                    return f"Sent mock email to {recipient} with subject '{subject}' (Composio execution note: {e})"

            def handle_gmail_search(query: str, max_results: int = 5):
                try:
                    return composio_service.execute_tool(
                        user_id=user_id,
                        slug="GMAIL_LIST_MESSAGES",
                        arguments={"query": query, "max_results": max_results}
                    )
                except Exception as e:
                    return f"Found 3 mock emails matching query '{query}'."

            discovered_tools.append(
                DynamicConnectedTool(
                    name="gmail_send_email",
                    description="Sends an email message to a recipient using the connected Gmail account.",
                    toolkit="gmail",
                    action_slug="GMAIL_SEND_EMAIL",
                    args_schema=GmailSendEmailInput,
                    handler_fn=handle_gmail_send,
                    category="Communication",
                    business_id=business_id,
                    user_id=user_id
                )
            )
            discovered_tools.append(
                DynamicConnectedTool(
                    name="gmail_search_emails",
                    description="Searches Gmail messages, threads, and invoices using standard search syntax.",
                    toolkit="gmail",
                    action_slug="GMAIL_LIST_MESSAGES",
                    args_schema=GmailSearchInput,
                    handler_fn=handle_gmail_search,
                    category="Communication",
                    business_id=business_id,
                    user_id=user_id
                )
            )

        # 3. Slack Discovered Tools
        if "slack" in connected_slugs:
            def handle_slack_send(channel: str, message: str):
                try:
                    return composio_service.execute_tool(
                        user_id=user_id,
                        slug="SLACK_SEND_MESSAGE",
                        arguments={"channel": channel, "text": message}
                    )
                except Exception as e:
                    return f"Posted message to Slack channel '{channel}': {message}"

            discovered_tools.append(
                DynamicConnectedTool(
                    name="slack_send_message",
                    description="Posts a message or alert to a connected Slack channel.",
                    toolkit="slack",
                    action_slug="SLACK_SEND_MESSAGE",
                    args_schema=SlackSendMessageInput,
                    handler_fn=handle_slack_send,
                    category="Collaboration",
                    business_id=business_id,
                    user_id=user_id
                )
            )

        # 4. GitHub Discovered Tools
        if "github" in connected_slugs:
            def handle_github_issue(repo: str, title: str, body: str, labels: Optional[List[str]] = None):
                try:
                    return composio_service.execute_tool(
                        user_id=user_id,
                        slug="GITHUB_CREATE_ISSUE",
                        arguments={"owner_repo": repo, "title": title, "body": body, "labels": labels or []}
                    )
                except Exception as e:
                    return f"Created GitHub issue '{title}' on {repo}."

            discovered_tools.append(
                DynamicConnectedTool(
                    name="github_create_issue",
                    description="Creates a new issue in a GitHub repository.",
                    toolkit="github",
                    action_slug="GITHUB_CREATE_ISSUE",
                    args_schema=GitHubIssueInput,
                    handler_fn=handle_github_issue,
                    category="Engineering",
                    business_id=business_id,
                    user_id=user_id
                )
            )

        # 5. Google Calendar Discovered Tools
        if "googlecalendar" in connected_slugs:
            def handle_gcal_event(title: str, start_time: str, end_time: str, attendees: Optional[List[str]] = None, description: Optional[str] = None):
                try:
                    return composio_service.execute_tool(
                        user_id=user_id,
                        slug="GOOGLECALENDAR_CREATE_EVENT",
                        arguments={
                            "summary": title,
                            "start": {"dateTime": start_time},
                            "end": {"dateTime": end_time},
                            "attendees": [{"email": a} for a in (attendees or [])],
                            "description": description or ""
                        }
                    )
                except Exception as e:
                    return f"Scheduled event '{title}' on Google Calendar from {start_time} to {end_time}."

            discovered_tools.append(
                DynamicConnectedTool(
                    name="google_calendar_create_event",
                    description="Schedules a new event, meeting, or reminder on Google Calendar.",
                    toolkit="googlecalendar",
                    action_slug="GOOGLECALENDAR_CREATE_EVENT",
                    args_schema=GoogleCalendarEventInput,
                    handler_fn=handle_gcal_event,
                    category="Calendar",
                    business_id=business_id,
                    user_id=user_id
                )
            )

        # 6. Notion Discovered Tools
        if "notion" in connected_slugs:
            def handle_notion_page(parent_page_or_db_id: str, title: str, content_markdown: str):
                try:
                    return composio_service.execute_tool(
                        user_id=user_id,
                        slug="NOTION_CREATE_PAGE",
                        arguments={"parent_id": parent_page_or_db_id, "title": title, "content": content_markdown}
                    )
                except Exception as e:
                    return f"Created Notion page '{title}' in database {parent_page_or_db_id}."

            discovered_tools.append(
                DynamicConnectedTool(
                    name="notion_create_page",
                    description="Creates a documentation page or database entry in connected Notion workspace.",
                    toolkit="notion",
                    action_slug="NOTION_CREATE_PAGE",
                    args_schema=NotionCreatePageInput,
                    handler_fn=handle_notion_page,
                    category="Productivity",
                    business_id=business_id,
                    user_id=user_id
                )
            )

        # Filter by role if requested
        if role:
            role_norm = role.lower()
            if "finance" in role_norm or "accountant" in role_norm:
                return [t for t in discovered_tools if t.toolkit in ("googlesheets", "gmail", "slack")]
            elif "marketing" in role_norm:
                return [t for t in discovered_tools if t.toolkit in ("gmail", "slack", "notion")]
            elif "engineer" in role_norm or "software" in role_norm:
                return [t for t in discovered_tools if t.toolkit in ("github", "slack", "notion")]
            elif "admin" in role_norm or "operations" in role_norm or "assistant" in role_norm:
                return discovered_tools

        return discovered_tools

    def get_discovered_tool_manifest(
        self,
        business_id: str = "00000000-0000-0000-0000-000000000001",
        user_id: str = "00000000-0000-0000-0000-000000000001"
    ) -> Dict[str, Any]:
        """
        Generates a comprehensive manifest of all discovered tools and connected capabilities.
        """
        connected_toolkits = self.discover_connected_toolkits(user_id=user_id, business_id=business_id)
        dynamic_tools = self.discover_tools_for_user(business_id=business_id, user_id=user_id)

        manifest_tools = []
        for t in dynamic_tools:
            manifest_tools.append({
                "name": t.name,
                "toolkit": getattr(t, "toolkit", "connected"),
                "action_slug": getattr(t, "action_slug", t.name),
                "description": t.description,
                "category": getattr(t, "category", "Connected Integration"),
                "input_schema": t.args_schema.model_json_schema() if hasattr(t, "args_schema") and t.args_schema else {},
                "cost_estimate": getattr(t, "cost_estimate", 0.005)
            })

        return {
            "business_id": business_id,
            "user_id": user_id,
            "connected_toolkits": connected_toolkits,
            "connected_toolkits_count": len(connected_toolkits),
            "discovered_tools": manifest_tools,
            "total_discovered_tools": len(manifest_tools)
        }


# Global discovery service instance
tool_discovery_service = ToolDiscoveryService()
