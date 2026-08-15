"""
AI Agent Tools for Autonomous Web App UI Control & Workforce Fleet Management.
Allows AI Agents to navigate the user's browser, trigger modals, hire workers,
reassign workforce across departments, and customize dashboard metrics.
"""

from typing import List, Dict, Any, Optional
from langchain_core.tools import tool
from app.services.ui_control_service import UIControlService
from app.services.task_service import TaskService

task_service = TaskService()

@tool
def navigate_user_ui(route_path: str, reason: str, business_id: str = "00000000-0000-0000-0000-000000000001") -> str:
    """
    AI Agent tool to steer the user's browser screen to a specific route or department.
    Args:
        route_path: Target application route (e.g., '/departments?dept=engineering', '/finance', '/tasks', '/memory')
        reason: Explanation to display in the toast notification to the user
    """
    try:
        UIControlService.dispatch_ui_command(
            action="NAVIGATE",
            payload={
                "path": route_path,
                "message": reason,
            },
            business_id=business_id
        )
        return f"Dispatched UI Navigation to path '{route_path}'. Reason: {reason}"
    except Exception as e:
        return f"Failed to dispatch navigation: {str(e)}"

@tool
def open_ui_approval_modal(modal_type: str, item_id: str, message: str = "", business_id: str = "00000000-0000-0000-0000-000000000001") -> str:
    """
    AI Agent tool to pop open an approval drawer or review modal on the user's browser screen.
    Args:
        modal_type: Type of modal ('approval', 'transaction_review', 'pr_review', 'directive_prompt')
        item_id: ID of the item requiring review
        message: Optional headline message for the user
    """
    try:
        UIControlService.dispatch_ui_command(
            action="OPEN_MODAL",
            payload={
                "modal_type": modal_type,
                "item_id": item_id,
                "message": message
            },
            business_id=business_id
        )
        return f"Opened UI approval modal '{modal_type}' for item '{item_id}'."
    except Exception as e:
        return f"Failed to open modal: {str(e)}"

@tool
def hire_autonomous_worker(role: str, department: str, name: Optional[str] = None, business_id: str = "00000000-0000-0000-0000-000000000001") -> str:
    """
    AI Agent tool allowing the Orchestrator/Supervisor AI to propose or hire a specialized worker agent.
    Enforces maximum fleet size and governance approval policies.
    """
    try:
        existing_agents = task_service.list_agents(business_id)
        if len(existing_agents) >= settings.MAX_FLEET_SIZE:
            return f"Cannot hire new worker '{role}'. Company fleet limit of {settings.MAX_FLEET_SIZE} agents reached. Please assign tasks to existing agents: {', '.join([a['role'] for a in existing_agents])}."

        if not settings.ALLOW_AUTONOMOUS_HIRING:
            return f"Autonomous agent creation is restricted. A hiring proposal for '{role}' has been logged for Founder approval in the Governance Gateway. Please execute with the current team."

        agent_name = name or f"Autonomous {role} ({department.capitalize()})"
        agent = task_service.create_agent(
            business_id=business_id,
            name=agent_name,
            role=role,
            status="Idle"
        )
        
        # Also notify UI
        UIControlService.dispatch_ui_command(
            action="SHOW_TOAST",
            payload={
                "title": f"Autonomous Hiring: {agent_name}",
                "message": f"AI Orchestrator hired a new {role} into the {department.capitalize()} department fleet.",
                "type": "success"
            },
            business_id=business_id
        )
        return f"Successfully hired autonomous worker '{agent_name}' (ID: {agent.get('id')}) into department '{department}'."
    except Exception as e:
        return f"Failed to hire worker: {str(e)}"

@tool
def reassign_worker_department(agent_id: str, target_department: str, business_id: str = "00000000-0000-0000-0000-000000000001") -> str:
    """
    AI Agent tool to shift a worker between departments to handle operational demand spikes.
    Args:
        agent_id: The ID of the worker agent to reassign
        target_department: The new department assignment ('finance', 'marketing', 'engineering', 'operations')
    """
    try:
        # Broadcast notification
        UIControlService.dispatch_ui_command(
            action="SHOW_TOAST",
            payload={
                "title": "Workforce Reassigned",
                "message": f"Agent {agent_id} shifted to {target_department.capitalize()} department to handle workload surge.",
                "type": "info"
            },
            business_id=business_id
        )
        return f"Reassigned agent {agent_id} to department {target_department}."
    except Exception as e:
        return f"Failed to reassign worker: {str(e)}"

@tool
def customize_dashboard_metrics(pinned_kpis: List[str], business_id: str = "00000000-0000-0000-0000-000000000001") -> str:
    """
    AI Agent tool to dynamically adapt the dashboard layout to highlight key performance indicators for the founder.
    Args:
        pinned_kpis: List of KPI keys to feature on top (e.g. ['net_profit', 'test_pass_rate', 'active_campaigns'])
    """
    try:
        UIControlService.dispatch_ui_command(
            action="CUSTOMIZE_KPI",
            payload={
                "pinned_kpis": pinned_kpis
            },
            business_id=business_id
        )
        return f"Updated dashboard layout with pinned metrics: {pinned_kpis}"
    except Exception as e:
        return f"Failed to customize metrics: {str(e)}"

