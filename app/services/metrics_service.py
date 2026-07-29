import logging
from typing import Any, List, Dict
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

class MetricsService:
    def __init__(self, supabase_client: Optional[Client] = None):
        if supabase_client:
            self.client = supabase_client
        else:
            if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set to use MetricsService")
            self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    def get_agent_success_rates(self, business_id: str) -> List[Dict[str, Any]]:
        """Calculates success and error rates for each agent based on terminal task statuses."""
        try:
            response = self.client.table("tasks")\
                .select("agent_id, status")\
                .eq("business_id", business_id)\
                .execute()
                
            agent_stats = {}
            for task in response.data:
                agent_id = task.get("agent_id")
                if not agent_id:
                    continue
                    
                status = task.get("status")
                if status not in ["completed", "failed"]:
                    continue # Ignore non-terminal statuses
                    
                if agent_id not in agent_stats:
                    agent_stats[agent_id] = {"completed": 0, "failed": 0, "total": 0}
                    
                agent_stats[agent_id][status] += 1
                agent_stats[agent_id]["total"] += 1
                
            results = []
            for agent_id, stats in agent_stats.items():
                total = stats["total"]
                success_rate = (stats["completed"] / total * 100) if total > 0 else 0.0
                error_rate = (stats["failed"] / total * 100) if total > 0 else 0.0
                results.append({
                    "agent_id": agent_id,
                    "success_rate_percent": round(success_rate, 2),
                    "error_rate_percent": round(error_rate, 2),
                    "total_terminal_tasks": total
                })
            return results
        except Exception as e:
            logger.error(f"Error getting agent success rates: {e}")
            raise e

    def get_timeframe_metrics(self, business_id: str) -> Dict[str, int]:
        """Counts how many tasks were completed in the last 24h and 7d."""
        try:
            response = self.client.table("tasks")\
                .select("updated_at")\
                .eq("business_id", business_id)\
                .eq("status", "completed")\
                .execute()
                
            now = datetime.now(timezone.utc)
            last_24h = now - timedelta(hours=24)
            last_7d = now - timedelta(days=7)
            
            count_24h = 0
            count_7d = 0
            
            for task in response.data:
                # Supabase returns ISO format strings like '2026-07-29T07:27:10+00:00'
                updated_str = task.get("updated_at")
                if not updated_str:
                    continue
                    
                try:
                    updated_at = datetime.fromisoformat(updated_str.replace("Z", "+00:00"))
                except ValueError:
                    continue
                    
                if updated_at >= last_24h:
                    count_24h += 1
                if updated_at >= last_7d:
                    count_7d += 1
                    
            return {
                "completed_last_24h": count_24h,
                "completed_last_7d": count_7d
            }
        except Exception as e:
            logger.error(f"Error getting timeframe metrics: {e}")
            raise e

    def get_agent_status_snapshot(self, business_id: str) -> Dict[str, List[str]]:
        """Identifies agents currently running a task or assigned to a failed task."""
        try:
            response = self.client.table("tasks")\
                .select("agent_id, status")\
                .eq("business_id", business_id)\
                .in_("status", ["running", "failed"])\
                .execute()
                
            running_agents = set()
            failed_agents = set()
            
            for task in response.data:
                agent_id = task.get("agent_id")
                if not agent_id:
                    continue
                    
                if task["status"] == "running":
                    running_agents.add(agent_id)
                elif task["status"] == "failed":
                    failed_agents.add(agent_id)
                    
            return {
                "running_agents": list(running_agents),
                "failed_agents": list(failed_agents)
            }
        except Exception as e:
            logger.error(f"Error getting agent status snapshot: {e}")
            raise e
