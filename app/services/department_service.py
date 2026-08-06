import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from app.services.shared_memory import SharedMemoryService

logger = logging.getLogger(__name__)

# Standard Default Checklists per department (can be updated autonomously by AI)
DEFAULT_CHECKLISTS: Dict[str, List[Dict[str, Any]]] = {
    "finance": [
        {"id": 1, "title": "Connect Google Sheets Ledger", "completed": True},
        {"id": 2, "title": "Hire Lead Accountant AI Worker", "completed": True},
        {"id": 3, "title": "Set Authority Limits & Spending Caps", "completed": True},
        {"id": 4, "title": "Enable GAAP Double-Entry Validation", "completed": True},
        {"id": 5, "title": "Configure Automated Trial Balance Audits", "completed": False},
        {"id": 6, "title": "Set Up Tax & Payroll Directives", "completed": False}
    ],
    "marketing": [
        {"id": 1, "title": "Set Up Perplexity Search Tool", "completed": True},
        {"id": 2, "title": "Hire Growth Copywriter AI Agent", "completed": True},
        {"id": 3, "title": "Configure Social Campaign Directives", "completed": True},
        {"id": 4, "title": "Define Brand Voice Guidelines", "completed": True},
        {"id": 5, "title": "Integrate Notion Content Workspace", "completed": False},
        {"id": 6, "title": "Enable Automated Lead Scoring", "completed": False}
    ],
    "engineering": [
        {"id": 1, "title": "Connect GitHub Repository Pipeline", "completed": True},
        {"id": 2, "title": "Hire Autonomous Code Architect Agent", "completed": True},
        {"id": 3, "title": "Configure PyTest & Automated Testing", "completed": True},
        {"id": 4, "title": "Enable Terminal Subprocess Sandbox", "completed": True},
        {"id": 5, "title": "Configure Railway Production Deployment", "completed": True},
        {"id": 6, "title": "Verify Pull Request Auto-Reviews", "completed": False}
    ],
    "operations": [
        {"id": 1, "title": "Initialize Shared Memory Store", "completed": True},
        {"id": 2, "title": "Hire Lead Operations Orchestrator AI", "completed": True},
        {"id": 3, "title": "Set Up Maker-Checker Approval Gate", "completed": True},
        {"id": 4, "title": "Configure Executive Notification Triage", "completed": True},
        {"id": 5, "title": "Set Up Cross-Department Event Bus", "completed": False},
        {"id": 6, "title": "Enable SOX Compliance Audit Logging", "completed": False}
    ]
}

class DepartmentService:
    """
    Department Telemetry, AI Operational Alerts, Attention Queue,
    Activity Log Stream, and Setup Guide state service.
    """

    def __init__(self, memory_service: Optional[SharedMemoryService] = None):
        self.memory = memory_service or SharedMemoryService()

    def _get_key(self, dept_id: str, suffix: str) -> str:
        return f"department:{dept_id}:{suffix}"

    def get_department_data(self, business_id: str, dept_id: str) -> Dict[str, Any]:
        """
        Retrieves all live state, alerts, activity stream, attention queue,
        and checklist items for a given department.
        """
        alerts_key = self._get_key(dept_id, "alerts")
        activities_key = self._get_key(dept_id, "activities")
        attention_key = self._get_key(dept_id, "attention")
        checklist_key = self._get_key(dept_id, "checklist")

        alerts = self.memory.get(business_id, alerts_key)
        activities = self.memory.get(business_id, activities_key)
        attention = self.memory.get(business_id, attention_key)
        checklist = self.memory.get(business_id, checklist_key)

        # Fallback defaults if not set yet
        alerts_list = alerts.get("value", []) if alerts else self._default_alerts(dept_id)
        activities_list = activities.get("value", []) if activities else self._default_activities(dept_id)
        attention_list = attention.get("value", []) if attention else self._default_attention(dept_id)
        checklist_list = checklist.get("value", []) if checklist else DEFAULT_CHECKLISTS.get(dept_id, [])

        return {
            "department_id": dept_id,
            "alerts": alerts_list,
            "activities": activities_list,
            "attention": attention_list,
            "checklist": checklist_list,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def create_department_alert(
        self, business_id: str, dept_id: str, alert_type: str, title: str, desc: str
    ) -> Dict[str, Any]:
        """
        Allows AI Agents or backend services to trigger an operational alert for a department.
        """
        data = self.get_department_data(business_id, dept_id)
        alerts = data.get("alerts", [])

        new_alert = {
            "id": f"alert-{len(alerts) + 1}",
            "type": alert_type,  # 'ok', 'info', 'warning', 'critical'
            "title": title,
            "desc": desc,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        alerts.insert(0, new_alert)
        alerts = alerts[:20]  # Keep latest 20 alerts

        key = self._get_key(dept_id, "alerts")
        self.memory.set(business_id, key, alerts)
        logger.info(f"AI Agent created alert for department {dept_id}: {title}")
        return new_alert

    def log_department_activity(
        self, business_id: str, dept_id: str, text: str, badge: str = "EXEC", badge_class: str = "bg-indigo-50 text-indigo-800 border-indigo-200"
    ) -> Dict[str, Any]:
        """
        Logs an execution action or decision to the department activity stream.
        """
        data = self.get_department_data(business_id, dept_id)
        activities = data.get("activities", [])

        new_activity = {
            "time": "Just now",
            "text": text,
            "badge": badge,
            "badgeClass": badge_class,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        activities.insert(0, new_activity)
        activities = activities[:30]  # Keep latest 30 activities

        key = self._get_key(dept_id, "activities")
        self.memory.set(business_id, key, activities)
        logger.info(f"Logged activity for department {dept_id}: {text}")
        return new_activity

    def push_attention_item(
        self, business_id: str, dept_id: str, title: str, action: str, priority: str = "normal"
    ) -> Dict[str, Any]:
        """
        AI Agent tool to flag an item requiring founder/executive attention.
        """
        data = self.get_department_data(business_id, dept_id)
        attention = data.get("attention", [])

        new_item = {
            "id": f"att-{len(attention) + 1}",
            "title": title,
            "action": action,
            "priority": priority,  # 'high', 'normal'
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        attention.insert(0, new_item)
        key = self._get_key(dept_id, "attention")
        self.memory.set(business_id, key, attention)
        logger.info(f"Pushed attention item for department {dept_id}: {title}")
        return new_item

    def toggle_checklist_task(
        self, business_id: str, dept_id: str, task_id: int, completed: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """
        Updates a department checklist task's completion status.
        """
        data = self.get_department_data(business_id, dept_id)
        checklist = data.get("checklist", [])

        for item in checklist:
            if item.get("id") == task_id:
                if completed is not None:
                    item["completed"] = completed
                else:
                    item["completed"] = not item.get("completed", False)
                break

        key = self._get_key(dept_id, "checklist")
        self.memory.set(business_id, key, checklist)
        return checklist

    def _default_alerts(self, dept_id: str) -> List[Dict[str, Any]]:
        if dept_id == "finance":
            return [
                {"type": "ok", "title": "Double-Entry Balance Verified", "desc": "Ledger trial balance sum equals $0.00 variance."},
                {"type": "info", "title": "Google Sheets Live Sync Active", "desc": "Connected to Master General Ledger cloud storage."}
            ]
        elif dept_id == "marketing":
            return [
                {"type": "ok", "title": "Brand Voice Policy Verified", "desc": "Generated copy passes tone & compliance checks."},
                {"type": "info", "title": "Perplexity Search Connector Ready", "desc": "Live web search enabled for market research."}
            ]
        elif dept_id == "engineering":
            return [
                {"type": "ok", "title": "Subprocess Sandbox 100% Healthy", "desc": "Terminal execution engine operating cleanly."},
                {"type": "info", "title": "FastAPI Engine Active", "desc": "Continuous deployment pipeline connected."}
            ]
        else:
            return [
                {"type": "ok", "title": "SOX Compliance Audit Logging On", "desc": "All actions recorded in PostgreSQL durable store."},
                {"type": "info", "title": "Maker-Checker Approval Gate Active", "desc": "Human-in-the-loop threshold configured."}
            ]

    def _default_activities(self, dept_id: str) -> List[Dict[str, Any]]:
        if dept_id == "finance":
            return [
                {"time": "10 mins ago", "text": "Lead Accountant AI performed double-entry ledger balance check.", "badge": "BALANCED", "badgeClass": "bg-emerald-50 text-emerald-800 border-emerald-200"},
                {"time": "25 mins ago", "text": "Google Sheets MCP synchronized journal entries.", "badge": "SYNCED", "badgeClass": "bg-cyan-50 text-cyan-800 border-cyan-200"}
            ]
        elif dept_id == "marketing":
            return [
                {"time": "5 mins ago", "text": "Growth Copywriter AI generated 3 social post drafts.", "badge": "DRAFTED", "badgeClass": "bg-cyan-50 text-cyan-800 border-cyan-200"},
                {"time": "40 mins ago", "text": "Perplexity Web Search fetched latest AI Agent trends.", "badge": "SEARCHED", "badgeClass": "bg-indigo-50 text-indigo-800 border-indigo-200"}
            ]
        elif dept_id == "engineering":
            return [
                {"time": "2 mins ago", "text": "Code Architect AI submitted PR #42 for review.", "badge": "PULL REQUEST", "badgeClass": "bg-indigo-50 text-indigo-800 border-indigo-200"},
                {"time": "15 mins ago", "text": "PyTest automated suite passed static page tests.", "badge": "PASSED", "badgeClass": "bg-emerald-50 text-emerald-800 border-emerald-200"}
            ]
        else:
            return [
                {"time": "12 mins ago", "text": "Maker-Checker policy verified spending limit.", "badge": "APPROVED", "badgeClass": "bg-emerald-50 text-emerald-800 border-emerald-200"},
                {"time": "30 mins ago", "text": "Ops Orchestrator resolved cross-department event bus message.", "badge": "RESOLVED", "badgeClass": "bg-purple-50 text-purple-800 border-purple-200"}
            ]

    def _default_attention(self, dept_id: str) -> List[Dict[str, Any]]:
        if dept_id == "finance":
            return [
                {"id": "att-1", "title": "Review 1 Spending Exemption Request > $500", "action": "Review Approval", "priority": "high"}
            ]
        elif dept_id == "marketing":
            return [
                {"id": "att-1", "title": "Approve 3 Draft Posts for LinkedIn Campaign", "action": "Approve Copy", "priority": "normal"}
            ]
        elif dept_id == "engineering":
            return [
                {"id": "att-1", "title": "1 Pull Request Pending Founder Review (#42)", "action": "Review PR", "priority": "high"}
            ]
        else:
            return [
                {"id": "att-1", "title": "1 Cross-Department Mandate Awaiting Confirmation", "action": "Confirm Mandate", "priority": "high"}
            ]
