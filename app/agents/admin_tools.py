import json
import logging
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from app.agents.tool_registry import BaseTool, registry
from app.agents.tools import ReadSharedMemoryTool, WriteSharedMemoryTool, SpawnSubtaskTool
from app.services.mcp_client import mcp_call_or_default

logger = logging.getLogger(__name__)

# --- Admin / Operations MCP Tools (PRD v6.0 §4.1) ---

def _admin_mcp_call(mcp_name: str, tool_name: str, arguments: Dict[str, Any], default_result: Any) -> Any:
    """Call a real MCP server if configured, otherwise return the default mock result."""
    return mcp_call_or_default(mcp_name, tool_name, arguments, default_result)

class InboxTriageInput(BaseModel):
    action: str = Field(description="'fetch_unread', 'draft_reply', or 'archive'")
    sender_or_subject: Optional[str] = Field(None, description="Sender email or subject query")
    reply_body: Optional[str] = Field(None, description="Drafted reply text")

class InboxTriageTool(BaseTool):
    name = "inbox_triage"
    description = "Triage incoming business emails, organize priority queues, and draft replies."
    args_schema = InboxTriageInput
    cost_estimate = 0.01

    def _run(self, action: str, sender_or_subject: Optional[str] = None, reply_body: Optional[str] = None) -> str:
        if action == "fetch_unread":
            default = json.dumps([
                {"id": "msg_01", "from": "client@partner.com", "subject": "Partnership Q3 Sync", "priority": "high"},
                {"id": "msg_02", "from": "support@vendor.io", "subject": "Invoice Updated", "priority": "normal"},
                {"id": "msg_03", "from": "user@customer.com", "subject": "Feature Inquiry", "priority": "normal"}
            ])
        elif action == "draft_reply":
            default = f"Drafted reply for {sender_or_subject}: '{reply_body or 'Acknowledged. Will review promptly.'}' (Observe/Assist tier: staged as draft)."
        else:
            return f"Inbox action '{action}' completed."

        return _admin_mcp_call(
            "email",
            action,
            {"sender_or_subject": sender_or_subject, "reply_body": reply_body},
            default,
        )

class CalendarScheduleInput(BaseModel):
    action: str = Field(description="'check_conflicts', 'propose_slot', or 'schedule_meeting'")
    attendees: List[str] = Field(default_factory=list, description="List of participant emails")
    time_slot: Optional[str] = Field(None, description="Proposed date/time e.g. '2026-08-05 14:00 UTC'")
    title: Optional[str] = Field("Strategic Check-in", description="Meeting title")

class CalendarScheduleTool(BaseTool):
    name = "calendar_schedule"
    description = "Checks founder calendar availability and schedules meetings without double-booking."
    args_schema = CalendarScheduleInput
    cost_estimate = 0.01

    def _run(self, action: str, attendees: List[str] = [], time_slot: Optional[str] = None, title: Optional[str] = None) -> str:
        if action == "check_conflicts":
            default = f"No conflicts found for {time_slot or 'upcoming week slots'}. Founder focus time is protected."
        elif action == "schedule_meeting":
            default = f"Meeting '{title}' booked for {time_slot} with {len(attendees)} attendees."
        else:
            return f"Calendar action '{action}' completed."

        return _admin_mcp_call(
            "calendar",
            action,
            {"attendees": attendees, "time_slot": time_slot, "title": title},
            default,
        )

class HelpdeskTicketInput(BaseModel):
    action: str = Field(description="'list_open', 'resolve_ticket', 'escalate_complaint', or 'request_policy_exception'")
    ticket_id: Optional[str] = Field(None, description="Ticket ID e.g. 'TCK-881'")
    resolution_notes: Optional[str] = Field(None, description="Notes or refund request justification")

class HelpdeskTicketTool(BaseTool):
    name = "helpdesk_ticket"
    description = "Manages customer support tickets. Flags complaints and refund requests for founder approval."
    args_schema = HelpdeskTicketInput
    cost_estimate = 0.02

    def _run(self, action: str, ticket_id: Optional[str] = None, resolution_notes: Optional[str] = None) -> str:
        if action == "list_open":
            default = json.dumps([
                {"ticket_id": "TCK-881", "customer": "sarah@acme.com", "issue": "Billing question", "status": "open"},
                {"ticket_id": "TCK-882", "customer": "john@retail.org", "issue": "Account setup help", "status": "in_progress"}
            ])
        elif action in ["escalate_complaint", "request_policy_exception"]:
            default = f"Action '{action}' for ticket {ticket_id} routed to Governance Gateway for Founder Approval. Reason: {resolution_notes}"
        else:
            default = f"Helpdesk ticket {ticket_id or 'all'} updated: {resolution_notes or 'Resolved'}"

        return _admin_mcp_call(
            "helpdesk",
            action,
            {"ticket_id": ticket_id, "resolution_notes": resolution_notes},
            default,
        )

def register_admin_tools(business_id: str, agent_id: str = None, task_id: str = None):
    """
    Registers allowed MCP tools for the Admin / Ops worker role.
    """
    tools = [
        InboxTriageTool(),
        CalendarScheduleTool(),
        HelpdeskTicketTool(),
        ReadSharedMemoryTool(business_id=business_id),
        WriteSharedMemoryTool(business_id=business_id),
        SpawnSubtaskTool(business_id=business_id, main_task_id=task_id)
    ]
    for tool in tools:
        tool.business_id = business_id
        tool.agent_id = agent_id
        tool.task_id = task_id
        
    registry.register_tools("Admin/Ops", tools)
    registry.register_tools("Operations Manager", tools)
    return tools
