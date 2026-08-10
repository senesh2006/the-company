import logging
from fastapi import APIRouter, HTTPException, Depends
from typing import Any, Dict

from app.api.deps import get_current_user
from app.services.metrics_service import MetricsService
from app.services.cost_service import CostService

logger = logging.getLogger(__name__)

router = APIRouter()
metrics_service = MetricsService()
cost_service = CostService()

@router.get("")
@router.get("/")
def get_global_metrics(user = Depends(get_current_user)):
    """Returns aggregated metrics for the authenticated user's business dashboard."""
    try:
        biz_id = user.business_id or "00000000-0000-0000-0000-000000000001"
        agents = []
        try:
            response = metrics_service.client.table("agents").select("status").eq("business_id", biz_id).execute()
            if response.data and isinstance(response.data, list) and all(isinstance(a, dict) for a in response.data):
                agents = response.data
        except Exception:
            pass

        if not agents:
            from app.services.task_service import _IN_MEMORY_AGENTS
            agents = [a for a in _IN_MEMORY_AGENTS.values() if a.get("business_id") == biz_id]

        total_agents = len(agents)
        active_agents = len([a for a in agents if isinstance(a, dict) and a.get("status") == "Running"])

        tasks = []
        try:
            task_response = metrics_service.client.table("tasks").select("status").eq("business_id", biz_id).execute()
            if task_response.data and isinstance(task_response.data, list) and all(isinstance(t, dict) for t in task_response.data):
                tasks = task_response.data
        except Exception:
            pass

        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if isinstance(t, dict) and t.get("status") == "completed"])

        return {
            "totalAgents": total_agents,
            "activeAgents": active_agents,
            "totalTasks": total_tasks,
            "completedTasks": completed_tasks,
            "totalCost": 0.0,
            "riskLevel": "low"
        }
    except Exception as e:
        logger.error(f"Failed to fetch metrics: {e}")
        return {
            "totalAgents": 0,
            "activeAgents": 0,
            "totalTasks": 0,
            "completedTasks": 0,
            "totalCost": 0.0,
            "riskLevel": "low"
        }

@router.get("/{business_id}/agents/rates")
def get_agent_rates(business_id: str):
    """Returns success and error rates per agent based on terminal tasks."""
    try:
        rates = metrics_service.get_agent_success_rates(business_id)
        return {"status": "success", "data": rates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{business_id}/tasks/timeframe")
def get_task_timeframes(business_id: str):
    """Returns counts of completed tasks for the last 24h and 7d."""
    try:
        metrics = metrics_service.get_timeframe_metrics(business_id)
        return {"status": "success", "data": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{business_id}/agents/snapshot")
def get_agent_snapshot(business_id: str):
    """Returns lists of agents currently running or assigned to a failed task."""
    try:
        snapshot = metrics_service.get_agent_status_snapshot(business_id)
        return {"status": "success", "data": snapshot}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{business_id}/costs/success")
def get_success_cost(business_id: str):
    """Returns the average cost per successful (completed) task."""
    try:
        avg_cost = cost_service.get_cost_per_successful_outcome(business_id)
        return {"status": "success", "average_cost_per_success": avg_cost}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
