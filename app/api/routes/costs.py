from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from app.services.cost_service import CostService

router = APIRouter()
cost_service = CostService()

@router.get("/{business_id}/agent")
def get_costs_by_agent(business_id: str):
    """Returns total costs grouped by agent_id."""
    try:
        summary = cost_service.get_cost_summary_by_agent(business_id)
        return {"status": "success", "data": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{business_id}/task")
def get_costs_by_task(business_id: str):
    """Returns total costs grouped by task_id."""
    try:
        summary = cost_service.get_cost_summary_by_task(business_id)
        return {"status": "success", "data": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{business_id}/outcome")
def get_cost_per_successful_outcome(business_id: str):
    """Returns the average cost of fully completed tasks."""
    try:
        average_cost = cost_service.get_cost_per_successful_outcome(business_id)
        return {"status": "success", "average_cost_per_success": average_cost}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
