"""
AI Agent Tools for Autonomous Department Operational Decisions.
Enables AI Agents to create live alerts, flag attention items, log execution streams,
and update department configuration checklists.
"""

from typing import Dict, Any, Optional
from langchain_core.tools import tool
from app.services.department_service import DepartmentService

dept_service = DepartmentService()

@tool
def create_department_alert(dept_id: str, alert_type: str, title: str, description: str, business_id: str = "default-business-id") -> str:
    """
    AI Agent tool to trigger an operational alert (e.g. policy compliance, API status, budget warning) for a department.
    Args:
        dept_id: Department ID ('finance', 'marketing', 'engineering', 'operations')
        alert_type: Severity level ('ok', 'info', 'warning', 'critical')
        title: Short headline of the operational alert
        description: Detailed explanation of the system condition or alert
    """
    try:
        dept_service.create_department_alert(
            business_id=business_id,
            dept_id=dept_id,
            alert_type=alert_type,
            title=title,
            desc=description
        )
        return f"Operational alert created for department '{dept_id}': [{alert_type.upper()}] {title}"
    except Exception as e:
        return f"Failed to create alert: {str(e)}"

@tool
def flag_department_attention_required(dept_id: str, title: str, recommended_action: str, priority: str = "normal", business_id: str = "default-business-id") -> str:
    """
    AI Agent tool to flag an item requiring founder or executive decision/review in a department.
    Args:
        dept_id: Department ID ('finance', 'marketing', 'engineering', 'operations')
        title: Description of the decision or item requiring attention
        recommended_action: Suggested action button text for the founder/manager
        priority: Priority level ('high', 'normal')
    """
    try:
        dept_service.push_attention_item(
            business_id=business_id,
            dept_id=dept_id,
            title=title,
            action=recommended_action,
            priority=priority
        )
        return f"Flagged attention item for department '{dept_id}': {title} (Action: {recommended_action})"
    except Exception as e:
        return f"Failed to flag attention item: {str(e)}"

@tool
def log_department_activity(dept_id: str, activity_text: str, status_badge: str = "EXEC", business_id: str = "default-business-id") -> str:
    """
    AI Agent tool to log an execution event or decision to the department activity stream.
    Args:
        dept_id: Department ID ('finance', 'marketing', 'engineering', 'operations')
        activity_text: Description of what the agent executed or verified
        status_badge: Short status badge label (e.g. 'BALANCED', 'VERIFIED', 'DEPLOYED', 'APPROVED')
    """
    try:
        dept_service.log_department_activity(
            business_id=business_id,
            dept_id=dept_id,
            text=activity_text,
            badge=status_badge
        )
        return f"Logged activity for department '{dept_id}': {activity_text}"
    except Exception as e:
        return f"Failed to log activity: {str(e)}"

@tool
def update_department_checklist(dept_id: str, task_id: int, is_completed: bool, business_id: str = "default-business-id") -> str:
    """
    AI Agent tool to mark department setup guide checklist tasks as completed or pending as directives are accomplished.
    Args:
        dept_id: Department ID ('finance', 'marketing', 'engineering', 'operations')
        task_id: The integer ID of the setup guide task (1-6)
        is_completed: True to mark task completed, False otherwise
    """
    try:
        dept_service.toggle_checklist_task(
            business_id=business_id,
            dept_id=dept_id,
            task_id=task_id,
            completed=is_completed
        )
        status_str = "completed" if is_completed else "pending"
        return f"Updated setup task #{task_id} for department '{dept_id}' to {status_str}."
    except Exception as e:
        return f"Failed to update checklist task: {str(e)}"
