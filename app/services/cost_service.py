import logging
from typing import Any, Optional, List, Dict
from datetime import datetime
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

# Global in-memory fallback caches for cost records and agent totals
_IN_MEMORY_COST_RECORDS: List[Dict[str, Any]] = []
_IN_MEMORY_AGENT_COSTS: Dict[str, float] = {}

# Standard token pricing per 1 Million tokens (USD)
MODEL_PRICING_PER_1M: Dict[str, Dict[str, float]] = {
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "llama-3.3-70b": {"input": 0.59, "output": 0.79},
    "llama-3.3-70b-versatile": {"input": 0.59, "output": 0.79},
    "meta/llama-3.3-70b-instruct": {"input": 0.59, "output": 0.79},
    "kimi-k3": {"input": 0.59, "output": 0.79},
    "deepseek-r1": {"input": 0.59, "output": 0.79},
    "deepseek-r1-distill-llama-70b": {"input": 0.59, "output": 0.79},
    "qwen2.5-72b": {"input": 0.59, "output": 0.79},
    "qwen/qwen2.5-72b-instruct": {"input": 0.59, "output": 0.79},
    "qwen-qwq-32b": {"input": 0.59, "output": 0.79},
    "llama-3.1-8b": {"input": 0.05, "output": 0.08},
    "llama-3.1-8b-instant": {"input": 0.05, "output": 0.08},
    "meta/llama-3.1-8b-instruct": {"input": 0.05, "output": 0.08},
    "llama-v3-8b": {"input": 0.05, "output": 0.08},
    "mistral-small-24b": {"input": 0.05, "output": 0.08},
    "mixtral-8x7b-32768": {"input": 0.05, "output": 0.08},
    "gemini-2.0-flash": {"input": 0.10, "output": 0.40},
    "default": {"input": 0.50, "output": 1.50},
}

def calculate_llm_cost(
    model_name: Optional[str] = None,
    input_tokens: int = 0,
    output_tokens: int = 0,
    tool_calls_count: int = 0
) -> float:
    """
    Computes exact or estimated USD cost for an AI worker interaction based on token consumption and tool invocations.
    """
    model_key = (model_name or "default").lower().strip()
    pricing = MODEL_PRICING_PER_1M.get(model_key)
    if not pricing:
        for k, v in MODEL_PRICING_PER_1M.items():
            if k in model_key:
                pricing = v
                break
    if not pricing:
        pricing = MODEL_PRICING_PER_1M["default"]

    token_cost = (input_tokens * pricing["input"] / 1_000_000.0) + (output_tokens * pricing["output"] / 1_000_000.0)
    tool_cost = tool_calls_count * 0.0005  # $0.0005 per internal tool execution
    total = round(token_cost + tool_cost, 6)
    
    if total <= 0 and (input_tokens > 0 or output_tokens > 0 or tool_calls_count > 0):
        total = 0.0001
    return total


class CostService:
    def __init__(self, supabase_client: Optional[Client] = None):
        self._client = supabase_client

    @property
    def client(self) -> Optional[Client]:
        if self._client:
            return self._client
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            return None
        try:
            self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            return self._client
        except Exception:
            return None

    def log_cost(self, business_id: str, amount: float, record_type: str, 
                 agent_id: Optional[str] = None, task_id: Optional[str] = None, 
                 description: Optional[str] = None, input_tokens: int = 0, output_tokens: int = 0) -> dict[str, Any]:
        """Logs a cost record to the database and in-memory accumulator."""
        amount = round(float(amount), 6)
        data = {
            "business_id": business_id,
            "amount": amount,
            "record_type": record_type,
            "agent_id": str(agent_id) if agent_id else None,
            "task_id": str(task_id) if task_id else None,
            "description": description,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "created_at": datetime.utcnow().isoformat()
        }

        # Track in-memory
        _IN_MEMORY_COST_RECORDS.append(data)
        if agent_id:
            aid = str(agent_id)
            _IN_MEMORY_AGENT_COSTS[aid] = round(_IN_MEMORY_AGENT_COSTS.get(aid, 0.0) + amount, 6)

        # Attempt Supabase write
        if self.client:
            try:
                response = self.client.table("cost_records").insert(data).execute()
                return response.data[0] if response.data else data
            except Exception as e:
                logger.warning(f"Cost record logged in-memory (DB fallback): {e}")

        return data

    def get_agent_cost_today(self, agent_id: str) -> float:
        """Returns accumulated cost for an agent today."""
        aid = str(agent_id)
        if aid in _IN_MEMORY_AGENT_COSTS:
            return _IN_MEMORY_AGENT_COSTS[aid]

        if self.client:
            try:
                response = self.client.table("cost_records")\
                    .select("amount")\
                    .eq("agent_id", aid)\
                    .execute()
                if response.data:
                    total = sum(float(r.get("amount", 0)) for r in response.data)
                    _IN_MEMORY_AGENT_COSTS[aid] = round(total, 6)
                    return total
            except Exception:
                pass
        return 0.0

    def get_cost_summary_by_agent(self, business_id: str) -> List[dict[str, Any]]:
        """Gets total cost grouped by agent_id for a business."""
        summary = {}
        # From in-memory
        for r in _IN_MEMORY_COST_RECORDS:
            if r.get("business_id") == business_id:
                aid = r.get("agent_id") or "unassigned"
                summary[aid] = summary.get(aid, 0.0) + float(r.get("amount", 0))

        if self.client:
            try:
                response = self.client.table("cost_records")\
                    .select("agent_id, amount")\
                    .eq("business_id", business_id)\
                    .execute()
                if response.data:
                    for row in response.data:
                        aid = row.get("agent_id") or "unassigned"
                        summary[aid] = summary.get(aid, 0.0) + float(row.get("amount", 0))
            except Exception as e:
                logger.warning(f"Failed to fetch costs by agent from DB: {e}")
            
        return [{"agent_id": k, "total_cost": round(v, 4)} for k, v in summary.items()]

    def get_cost_summary_by_task(self, business_id: str) -> List[dict[str, Any]]:
        """Gets total cost grouped by task_id for a business."""
        summary = {}
        for r in _IN_MEMORY_COST_RECORDS:
            if r.get("business_id") == business_id:
                tid = r.get("task_id") or "unassigned"
                summary[tid] = summary.get(tid, 0.0) + float(r.get("amount", 0))

        if self.client:
            try:
                response = self.client.table("cost_records")\
                    .select("task_id, amount")\
                    .eq("business_id", business_id)\
                    .execute()
                if response.data:
                    for row in response.data:
                        tid = row.get("task_id") or "unassigned"
                        summary[tid] = summary.get(tid, 0.0) + float(row.get("amount", 0))
            except Exception as e:
                logger.warning(f"Failed to fetch costs by task from DB: {e}")
            
        return [{"task_id": k, "total_cost": round(v, 4)} for k, v in summary.items()]

    def get_total_cost(self, business_id: str) -> float:
        """Calculates the total aggregate cost for a business."""
        total = sum(float(r.get("amount", 0)) for r in _IN_MEMORY_COST_RECORDS if r.get("business_id") == business_id)
        if self.client:
            try:
                response = self.client.table("cost_records")\
                    .select("amount")\
                    .eq("business_id", business_id)\
                    .execute()
                if response.data:
                    total = max(total, sum(float(r.get("amount", 0)) for r in response.data))
            except Exception:
                pass
        return round(total, 4)

    def get_cost_per_successful_outcome(self, business_id: str) -> float:
        """Calculates the average cost of completed tasks."""
        try:
            if self.client:
                tasks_response = self.client.table("tasks")\
                    .select("id")\
                    .eq("business_id", business_id)\
                    .eq("status", "completed")\
                    .execute()
                
                completed_task_ids = [t["id"] for t in tasks_response.data] if tasks_response.data else []
                if completed_task_ids:
                    costs_response = self.client.table("cost_records")\
                        .select("amount")\
                        .in_("task_id", completed_task_ids)\
                        .execute()
                    if costs_response.data:
                        total_cost = sum([float(r["amount"]) for r in costs_response.data])
                        return round(total_cost / len(completed_task_ids), 4)

            # In-memory fallback
            from app.services.task_service import _IN_MEMORY_TASKS
            completed_in_mem = [t["id"] for t in _IN_MEMORY_TASKS.values() if t.get("business_id") == business_id and t.get("status") == "completed"]
            if completed_in_mem:
                matching_costs = [float(r.get("amount", 0)) for r in _IN_MEMORY_COST_RECORDS if r.get("task_id") in completed_in_mem]
                if matching_costs:
                    return round(sum(matching_costs) / len(completed_in_mem), 4)
            return 0.0
        except Exception as e:
            logger.error(f"Error calculating cost per successful outcome: {e}")
            return 0.0
