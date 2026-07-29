from fastapi import APIRouter, HTTPException
from typing import Any, Dict

from app.services.metrics_service import MetricsService
from app.services.cost_service import CostService

router = APIRouter()
metrics_service = MetricsService()
cost_service = CostService()

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
