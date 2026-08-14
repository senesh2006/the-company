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
    action: str = Field(description="'read_calendar', 'update_calendar', or 'draft_nurture'")
    doc_id: Optional[str] = Field(None, description="ID of the Notion document")
    content: Optional[str] = Field(None, description="Content to write or draft")

class NotionTool(BaseTool):
    name = "notion_workspace"
    description = "Interacts with Notion to manage the content calendar, documents, and draft nurture sequences for Community Operations."
    args_schema = NotionInput
    cost_estimate = 0.01

    def _run(self, action: str, doc_id: str = None, content: str = None) -> str:
        from app.services.shared_memory import SharedMemoryService
        mem = SharedMemoryService()
        biz_id = getattr(self, "business_id", "00000000-0000-0000-0000-000000000001")
        if action == "read_calendar":
            calendar_data = mem.get(biz_id, "content_calendar")
            if calendar_data:
                default = json.dumps(calendar_data.get("value"))
            else:
                default = "Content Calendar: No scheduled posts currently in workspace."
        elif action == "update_calendar" and content:
            mem.set(biz_id, "content_calendar", content, tags=["calendar", "notion"])
            default = f"Content Calendar updated successfully in Notion workspace ({doc_id or 'main'})."
        elif action == "draft_nurture" and content:
            mem.set(biz_id, f"nurture_draft_{doc_id or 'latest'}", content, tags=["nurture", "community", "draft"])
            default = f"Nurture sequence drafted successfully in Notion for review."
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
    platform: str = Field(description="'slack'")
    channel_or_user: str = Field(description="Target channel or user")
    message: str = Field(description="Message content")

class CommTool(BaseTool):
    name = "internal_communication"
    description = "Sends messages via Slack for internal communication."
    args_schema = CommInput
    cost_estimate = 0.01

    def _run(self, platform: str, channel_or_user: str, message: str) -> str:
        default = f"Communication sent on {platform} to {channel_or_user}: '{message}'"
        mcp_name = "slack"
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
        biz_id = getattr(self, "business_id", "00000000-0000-0000-0000-000000000001")
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

class ReadGoogleSheetInput(BaseModel):
    sheet_name: str = Field(description="Name of the Google Sheet tab (e.g. 'Ambassador Applications')")
    range: str = Field(description="The cell range to read, e.g. 'A1:E50'")

class ReadGoogleSheetTool(BaseTool):
    name = "read_google_sheet"
    description = "Reads data from a Google Sheet. Useful for checking ambassador application forms."
    args_schema = ReadGoogleSheetInput
    cost_estimate = 0.01

    def _run(self, sheet_name: str, range: str) -> str:
        biz_id = getattr(self, "business_id", "00000000-0000-0000-0000-000000000001")
        try:
            from app.services.google_sheets_service import GoogleSheetsService
            service = GoogleSheetsService(business_id=biz_id)
            rows = service.read_sheet_range(sheet_name, range)
            return json.dumps({"sheet": sheet_name, "range": range, "data": rows}, indent=2)
        except Exception as e:
            logger.error(f"Error reading Google Sheet {sheet_name}: {e}")
            return f"Failed to read Google Sheet '{sheet_name}': {str(e)}"

class SocialMonitorInput(BaseModel):
    platform: str = Field(description="The platform to monitor, e.g., 'linkedin' or 'twitter'")
    target_profiles: List[str] = Field(description="List of profile URLs or handles to scan")

class SocialMonitorTool(BaseTool):
    name = "social_monitor"
    description = "Scans leadership social media feeds (LinkedIn, Twitter) for compelling events like awards, product launches, or hiring signals."
    args_schema = SocialMonitorInput
    cost_estimate = 0.02

    def _run(self, platform: str, target_profiles: List[str]) -> str:
        # We use a mock default if MCP isn't hooked up yet
        default_res = json.dumps({
            "platform": platform,
            "profiles_scanned": target_profiles,
            "events_detected": [
                {
                    "profile": target_profiles[0] if target_profiles else "unknown",
                    "type": "award",
                    "content": "Thrilled to announce that our company just won the Best Innovator Award 2026! Big thanks to the team.",
                    "engagement_opportunity": "High - Congratulate them on the award and mention our shared value of innovation."
                },
                {
                    "profile": target_profiles[-1] if target_profiles else "unknown",
                    "type": "hiring",
                    "content": "We are expanding our engineering team. Looking for senior devs who love solving hard problems.",
                    "engagement_opportunity": "Medium - Quote repost and tag relevant engineers in our network."
                }
            ]
        }, indent=2)

        return _marketing_mcp_call(
            "social_monitor",
            "scan_feeds",
            {"platform": platform, "profiles": target_profiles},
            default_res
        )

class SEOTrackerInput(BaseModel):
    action: str = Field(default="audit_keywords", description="'audit_keywords' or 'technical_audit'")
    target_url: Optional[str] = Field(None, description="The domain or path to audit")

class SEOTrackerTool(BaseTool):
    name = "seo_tracker"
    description = "Tracks keyword rankings, technical SEO issues, and AI-prompt visibility."
    args_schema = SEOTrackerInput
    cost_estimate = 0.02

    def _run(self, action: str = "audit_keywords", target_url: str = None) -> str:
        act_clean = (action or "audit_keywords").lower().strip().replace("-", "_")
        if "tech" in act_clean:
            act_clean = "technical_audit"
        elif "keyword" in act_clean or "audit" in act_clean:
            act_clean = "audit_keywords"

        default_res = json.dumps({
            "action": act_clean,
            "target": target_url or "https://www.example.com",
            "keyword_movement": {"top_3": "+5 positions", "top_10": "-2 positions", "new_ranked_keywords": 18},
            "ai_prompt_visibility": "Medium-High - 48% share of voice in LLM answer engines (Perplexity, ChatGPT Search)",
            "technical_issues": ["Missing H1 on /about", "Slow LCP on /pricing (3.4s)", "Unoptimized meta description on /features"],
            "growth_trend_analysis": "Organic search visibility up +14% MoM driven by bottom-of-funnel comparative queries.",
            "strategic_recommendations": [
                "Optimize Core Web Vitals on /pricing to reduce bounce rate",
                "Expand AEO (Answer Engine Optimization) content for high-intent prompt queries",
                "Update H1 and structured schema on /about and /features"
            ]
        }, indent=2)
        return _marketing_mcp_call("seo", act_clean, {"target": target_url}, default_res)

class PaidMediaInput(BaseModel):
    action: str = Field(description="'pull_metrics' or 'reallocate_budget'")
    campaign_id: Optional[str] = Field(None, description="Target campaign")

class PaidMediaTool(BaseTool):
    name = "paid_media"
    description = "Pulls live channel data for LinkedIn/Google Ads and suggests reallocation."
    args_schema = PaidMediaInput
    cost_estimate = 0.03

    def _run(self, action: str, campaign_id: str = None) -> str:
        default_res = json.dumps({
            "action": action,
            "metrics": {"LinkedIn_CPA": "$45", "Google_CPA": "$12", "ROAS": "2.4x"},
            "creative_winners": ["Video_Testimonial_v2"],
            "recommendation": "Shift 20% budget from LinkedIn to Google Ads where CPA is highly efficient. Double down on Video_Testimonial_v2."
        }, indent=2)
        return _marketing_mcp_call("paid_media", action, {"campaign": campaign_id}, default_res)

class EventScreenerInput(BaseModel):
    event_id: str = Field(description="ID of the event to screen")

class EventScreenerTool(BaseTool):
    name = "event_screener"
    description = "Scores event applicants against ICP and batch-approves strong fits."
    args_schema = EventScreenerInput
    cost_estimate = 0.015

    def _run(self, event_id: str) -> str:
        default_res = json.dumps({
            "event_id": event_id,
            "applicants_screened": 42,
            "strong_fits": 12,
            "action_taken": "Batch approved 12 strong fits in the invite tool."
        }, indent=2)
        return _marketing_mcp_call("events", "screen_applicants", {"event": event_id}, default_res)

class MerchFulfillmentInput(BaseModel):
    action: str = Field(description="'check_redemptions' or 'send_vendor_order'")

class MerchFulfillmentTool(BaseTool):
    name = "merch_fulfillment"
    description = "Checks merch redemption forms and compiles orders for the swag vendor."
    args_schema = MerchFulfillmentInput
    cost_estimate = 0.01

    def _run(self, action: str) -> str:
        default_res = json.dumps({
            "action": action,
            "new_redemptions": 5,
            "status": "Pending Human Approval via WhatsApp before dispatching to vendor."
        }, indent=2)
class RenderUIInput(BaseModel):
    component: str = Field(description="Component name: 'StatCard', 'LineChart', 'BarChart', 'Table', 'FunnelChart', or 'PieChart'")
    title: str = Field(description="Descriptive title headline for the interactive visual card")
    props: Dict[str, Any] = Field(description="Component props matching the component's specification (e.g. { label, value, delta } for StatCard)")
    narration: str = Field(description="Concise 1-2 sentence analytical insight or takeaway displayed beneath the component")

class RenderUITool(BaseTool):
    name = "render_ui"
    description = (
        "Renders an interactive live UI component for the user on the dashboard. "
        "Use 'StatCard' for single metrics/KPIs, 'LineChart' for continuous time-series trends, "
        "'BarChart' for categorical comparisons, 'Table' for ranked lists or tabular data, "
        "'FunnelChart' for multi-stage conversion funnels, and 'PieChart' for distribution breakdown."
    )
    args_schema = RenderUIInput
    cost_estimate = 0.001

    def _run(self, component: str, title: str, props: Dict[str, Any], narration: str) -> str:
        payload = {
            "component": component,
            "title": title,
            "props": props,
            "narration": narration
        }
        return f"```agent-ui\n{json.dumps(payload, indent=2)}\n```"

def register_marketing_tools(business_id: str, agent_id: str = None, task_id: str = None):
    """
    Registers the specific allowed MCP tools for the Marketing Manager role.
    """
    from app.agents.whatsapp_tool import WhatsAppSendMessageTool, TextUserWhatsAppTool, WhatsAppCheckStatusTool, WhatsAppReadDMsTool
    
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
        AskUserForInputTool(business_id=business_id),
        WhatsAppSendMessageTool(),
        TextUserWhatsAppTool(),
        WhatsAppCheckStatusTool(),
        WhatsAppReadDMsTool(),
        ReadGoogleSheetTool(),
        SocialMonitorTool(),
        SEOTrackerTool(),
        PaidMediaTool(),
        EventScreenerTool(),
        MerchFulfillmentTool(),
        RenderUITool()
    ]
    
    # Inject metadata for cost tracking
    for tool in tools:
        tool.business_id = business_id
        tool.agent_id = agent_id
        tool.task_id = task_id
        
    registry.register_tools("Marketing Manager", tools)
    return tools
