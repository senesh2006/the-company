import json
import logging
from app.core.config import settings
from app.agents.finance_tools import (
    SupabaseLedgerTool,
    StripeFinanceTool,
    GoogleWorkspaceTool,
    NotionTool,
    PlaywrightTool,
    BraveSearchTool,
    FetchTool,
    CommTool
)
from app.agents.marketing_tools import (
    SEOTrackerTool,
    PaidMediaTool,
    EventScreenerTool,
    SocialMonitorTool,
    MerchFulfillmentTool,
    BraveSearchTool as M_Brave,
    PlaywrightTool as M_Playwright,
    NotionTool as M_Notion,
    GoogleWorkspaceTool as M_Google,
    Context7Tool,
    FetchTool as M_Fetch,
    CommTool as M_Comm,
    ReadGoogleSheetTool
)
from app.agents.admin_tools import (
    InboxTriageTool,
    CalendarScheduleTool,
    HelpdeskTicketTool
)
from app.agents.tools import (
    SearchWebTool,
    SendEmailTool,
    CreateCalendarEventTool,
    RequestCollaborationTool,
    ReadSharedMemoryTool,
    WriteSharedMemoryTool
)
from app.agents.tool_registry import registry
from app.services.mcp_client import get_mcp_client

logging.basicConfig(level=logging.INFO)

def run_mcp_audit():
    print("=" * 60)
    print("            COMPANY OS MCP ARCHITECTURE AUDIT              ")
    print("=" * 60)
    
    print("\n1. CONFIGURATION & TRANSPORT MODE:")
    print(f"   • MCP Fallback Mode : {'ENABLED (Smart resilient default data)' if settings.MCP_FALLBACK_MODE else 'DISABLED (Strict Live Endpoints)'}")
    
    mcp_services = [
        ("Stripe", "STRIPE_MCP_URL", "STRIPE_MCP_API_KEY"),
        ("Notion", "NOTION_MCP_URL", "NOTION_MCP_TOKEN"),
        ("Slack", "SLACK_MCP_URL", "SLACK_MCP_BOT_TOKEN"),
        ("Brave Search", "BRAVE_MCP_URL", "BRAVE_MCP_API_KEY"),
        ("Google Workspace", "GOOGLE_MCP_URL", "GOOGLE_MCP_CREDENTIALS"),
        ("Supabase", "SUPABASE_MCP_URL", "SUPABASE_MCP_KEY"),
        ("Browser / Playwright", "BROWSER_MCP_URL", "BROWSER_MCP_API_KEY"),
        ("Email Service", "EMAIL_MCP_URL", "EMAIL_MCP_API_KEY"),
        ("Calendar Service", "CALENDAR_MCP_URL", "CALENDAR_MCP_API_KEY"),
        ("Context7 Knowledge", "CONTEXT7_MCP_URL", "CONTEXT7_MCP_API_KEY"),
        ("Collaboration", "COLLABORATION_MCP_URL", "COLLABORATION_MCP_API_KEY"),
    ]
    
    for label, url_key, auth_key in mcp_services:
        url = getattr(settings, url_key, None)
        auth = bool(getattr(settings, auth_key, None))
        status_str = f"Live Endpoint -> {url}" if url else "Local Resilient Bridge / Fallback"
        auth_str = "Auth Configured" if auth else "No Auth Key"
        print(f"   • {label:<22} : {status_str} ({auth_str})")

    print("\n2. EXECUTING LIVE MCP TOOL SUITE:")
    tools_to_test = [
        # Finance Hub
        ("Finance: Supabase Transactions", SupabaseLedgerTool(), {"action": "read_transactions"}),
        ("Finance: Chart of Accounts", SupabaseLedgerTool(), {"action": "get_chart_of_accounts"}),
        ("Finance: Stripe Charges", StripeFinanceTool(), {"action": "read_charges"}),
        ("Finance: Google Sheets Budget", GoogleWorkspaceTool(), {"app": "sheets", "action": "read", "target": "Budget"}),
        ("Finance: Notion Policy Doc", NotionTool(), {"action": "read_policy"}),
        ("Finance: Playwright Statement", PlaywrightTool(), {"action": "download_statement"}),
        ("Finance: Web Search Rates", BraveSearchTool(), {"query": "US corporate tax rate 2026"}),
        ("Finance: FX Fetch API", FetchTool(), {"url": "https://api.example.com/fx"}),
        ("Finance: Slack Notification", CommTool(), {"platform": "slack", "channel_or_user": "#finance", "message": "Audit verified."}),
        
        # Marketing Hub
        ("Marketing: SEO / AEO Tracker", SEOTrackerTool(), {"action": "audit_keywords", "target_url": "https://companyos.ai"}),
        ("Marketing: Paid Media Metrics", PaidMediaTool(), {"action": "pull_metrics"}),
        ("Marketing: Social Feeds Scan", SocialMonitorTool(), {"platform": "linkedin", "target_profiles": ["https://linkedin.com/in/ceo"]}),
        ("Marketing: Event Screener", EventScreenerTool(), {"event_id": "evt_summit_2026"}),
        ("Marketing: Merch Orders", MerchFulfillmentTool(), {"action": "pull_requests"}),
        ("Marketing: Context7 Semantics", Context7Tool(), {"query": "brand guidelines"}),
        
        # Admin / Ops Hub
        ("Admin: Inbox Triage", InboxTriageTool(), {"action": "fetch_unread"}),
        ("Admin: Calendar Schedule", CalendarScheduleTool(), {"action": "schedule_meeting", "title": "Quarterly Review", "time_slot": "2026-08-20 14:00 UTC", "attendees": ["founder@companyos.ai"]}),
        ("Admin: Helpdesk Tickets", HelpdeskTicketTool(), {"action": "list_open"}),
        
        # Cross-Hub Shared Core
        ("Core: Web Search", SearchWebTool(), {"query": "Autonomous Agent Platforms"}),
        ("Core: Email Dispatcher", SendEmailTool(), {"to_email": "ops@companyos.ai", "subject": "Audit Complete", "body": "All tools operational."}),
        ("Core: Calendar Scheduler", CreateCalendarEventTool(), {"title": "Company OS Sync", "start_time": "2026-08-20T10:00", "end_time": "2026-08-20T11:00", "attendees": ["team@companyos.ai"]}),
        ("Core: Shared Memory Read", ReadSharedMemoryTool(business_id="00000000-0000-0000-0000-000000000001"), {"key": "company_profile"}),
    ]

    passed = 0
    failed = 0

    for name, tool, kwargs in tools_to_test:
        try:
            if hasattr(tool, "business_id") and not getattr(tool, "business_id", None):
                tool.business_id = "00000000-0000-0000-0000-000000000001"
            res = tool.run(**kwargs)
            preview = str(res).strip().replace("\n", " ")
            if len(preview) > 70:
                preview = preview[:67] + "..."
            print(f"   + [PASS] {name:<35} -> {preview}")
            passed += 1
        except Exception as e:
            print(f"   ! [FAIL] {name:<35} -> ERROR: {e}")
            failed += 1

    print("\n" + "=" * 60)
    print(f"AUDIT SUMMARY: {passed}/{len(tools_to_test)} MCP Tools PASSED ({failed} failed)")
    print("=" * 60)

if __name__ == "__main__":
    run_mcp_audit()
