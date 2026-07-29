import logging
from typing import Any, Optional, List
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

class CostService:
    def __init__(self, supabase_client: Optional[Client] = None):
        if supabase_client:
            self.client = supabase_client
        else:
            if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set to use CostService")
            self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    def log_cost(self, business_id: str, amount: float, record_type: str, 
                 agent_id: Optional[str] = None, task_id: Optional[str] = None, 
                 description: Optional[str] = None, input_tokens: int = 0, output_tokens: int = 0) -> dict[str, Any]:
        """Logs a cost record to the database."""
        try:
            data = {
                "business_id": business_id,
                "amount": amount,
                "record_type": record_type,
                "agent_id": agent_id,
                "task_id": task_id,
                "description": description,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens
            }
            response = self.client.table("cost_records").insert(data).execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error logging cost for business {business_id}: {e}")
            # Don't strictly raise here, cost logging shouldn't crash the agent loop entirely if it fails
            return {}

    def get_cost_summary_by_agent(self, business_id: str) -> List[dict[str, Any]]:
        """Gets total cost grouped by agent_id for a business."""
        try:
            response = self.client.table("cost_records")\
                .select("agent_id, amount")\
                .eq("business_id", business_id)\
                .execute()
            
            summary = {}
            for row in response.data:
                aid = row.get("agent_id") or "unassigned"
                summary[aid] = summary.get(aid, 0.0) + float(row.get("amount", 0))
                
            return [{"agent_id": k, "total_cost": v} for k, v in summary.items()]
        except Exception as e:
            logger.error(f"Error getting cost summary by agent: {e}")
            raise e

    def get_cost_summary_by_task(self, business_id: str) -> List[dict[str, Any]]:
        """Gets total cost grouped by task_id for a business."""
        try:
            response = self.client.table("cost_records")\
                .select("task_id, amount")\
                .eq("business_id", business_id)\
                .execute()
            
            summary = {}
            for row in response.data:
                tid = row.get("task_id") or "unassigned"
                summary[tid] = summary.get(tid, 0.0) + float(row.get("amount", 0))
                
            return [{"task_id": k, "total_cost": v} for k, v in summary.items()]
        except Exception as e:
            logger.error(f"Error getting cost summary by task: {e}")
            raise e

    def get_cost_per_successful_outcome(self, business_id: str) -> float:
        """Calculates the average cost of completed tasks."""
        try:
            # Get all completed tasks
            tasks_response = self.client.table("tasks")\
                .select("id")\
                .eq("business_id", business_id)\
                .eq("status", "completed")\
                .execute()
            
            completed_task_ids = [t["id"] for t in tasks_response.data]
            if not completed_task_ids:
                return 0.0
                
            # Sum costs for these tasks
            # Supabase Python client doesn't directly support `in_` well for large lists sometimes, 
            # but we can filter the total cost manually or use `.in_("task_id", completed_task_ids)`
            costs_response = self.client.table("cost_records")\
                .select("amount")\
                .in_("task_id", completed_task_ids)\
                .execute()
                
            total_cost = sum([float(r["amount"]) for r in costs_response.data])
            return total_cost / len(completed_task_ids)
            
        except Exception as e:
            logger.error(f"Error calculating cost per successful outcome: {e}")
            raise e
