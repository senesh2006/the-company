import logging
import uuid
from datetime import datetime
from typing import Any, Optional, List, Dict

try:
    from supabase._sync.client import create_client, Client
except ImportError:
    try:
        from supabase import create_client, Client
    except Exception:
        create_client = None
        Client = Any

from app.core.config import settings
from app.services.governance_service import GovernanceService

logger = logging.getLogger(__name__)

def is_valid_uuid(val: Any) -> bool:
    if not val:
        return False
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError, TypeError):
        return False

# In-memory storage fallback for audit feed and agent metadata
_IN_MEMORY_AUDIT_LOG: List[Dict[str, Any]] = []
_IN_MEMORY_AGENT_EXTRA: Dict[str, Dict[str, Any]] = {}
_IN_MEMORY_AGENTS: Dict[str, Dict[str, Any]] = {}

class TaskService:
    def __init__(self, supabase_client: Optional[Client] = None):
        self._client = supabase_client

    @property
    def client(self) -> Client:
        if self._client:
            return self._client
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables to use TaskService.")
        self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return self._client
            
    def list_agents(self, business_id: str) -> List[dict[str, Any]]:
        """List all available agents for a business, merged with PRD metadata."""
        agents: List[Dict[str, Any]] = []
        try:
            if settings.SUPABASE_URL and settings.SUPABASE_KEY:
                query = self.client.table("agents").select("*")
                if is_valid_uuid(business_id):
                    query = query.eq("business_id", str(business_id))
                response = query.execute()
                if response.data and isinstance(response.data, list) and all(isinstance(a, dict) for a in response.data):
                    agents = [dict(a) for a in response.data]
        except Exception as e:
            logger.warning(f"Supabase agents list fallback: {e}")

        # Merge local in-memory agents
        local_agents = [v for k, v in _IN_MEMORY_AGENTS.items() if v.get("business_id") == business_id or business_id == "default-business-id" or not is_valid_uuid(business_id)]
        seen_ids = {str(a.get("id")) for a in agents if isinstance(a, dict)}
        for la in local_agents:
            if str(la.get("id")) not in seen_ids:
                agents.append(dict(la))

        if not agents:
            # Seed 5 default specialists according to PRD v6.0
            default_specialists = [
                {"id": "agent-lead", "business_id": business_id, "name": "Atlas (Lead Orchestrator)", "role": "Lead Orchestrator", "status": "Idle", "trust_tier": "assist", "authority_limit_usd": 500.0, "clean_cycles_count": 12},
                {"id": "agent-eng", "business_id": business_id, "name": "Cipher (Software Engineer)", "role": "Software Engineer", "status": "Idle", "trust_tier": "operate", "authority_limit_usd": 1000.0, "clean_cycles_count": 25},
                {"id": "agent-fin", "business_id": business_id, "name": "Ledger (Finance Specialist)", "role": "Finance Specialist", "status": "Idle", "trust_tier": "observe", "authority_limit_usd": 0.0, "clean_cycles_count": 8},
                {"id": "agent-mkt", "business_id": business_id, "name": "Echo (Growth Specialist)", "role": "Marketing Specialist", "status": "Idle", "trust_tier": "assist", "authority_limit_usd": 150.0, "clean_cycles_count": 14},
                {"id": "agent-ops", "business_id": business_id, "name": "Nexus (Research Specialist)", "role": "Research Specialist", "status": "Idle", "trust_tier": "assist", "authority_limit_usd": 100.0, "clean_cycles_count": 10}
            ]
            for da in default_specialists:
                _IN_MEMORY_AGENTS[da["id"]] = da
            agents = [dict(a) for a in _IN_MEMORY_AGENTS.values()]

        # Merge in-memory extra fields (trust_tier, clean_cycles, etc.)
        for a in agents:
            if not isinstance(a, dict):
                continue
            extra = _IN_MEMORY_AGENT_EXTRA.get(str(a.get("id")), {})
            for k, v in extra.items():
                if k not in a or a[k] is None:
                    a[k] = v
            if "trust_tier" not in a:
                a["trust_tier"] = "observe"
            if "clean_cycles_count" not in a:
                a["clean_cycles_count"] = 0
            if "authority_limit_usd" not in a:
                a["authority_limit_usd"] = 0.0 if a["trust_tier"] == "observe" else (100.0 if a["trust_tier"] == "assist" else 1000.0)
        return agents

    def create_agent(
        self,
        business_id: str,
        name: str,
        role: str,
        status: str = "Idle",
        trust_tier: str = "observe",
        specialization_id: Optional[str] = None,
        hiring_model: str = "salaried",
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        capabilities: Optional[List[str]] = None
    ) -> dict[str, Any]:
        """Creates a new agent seeded at Observe tier as specified in PRD v6.0 §5.3."""
        try:
            target_biz_id = business_id
            if not is_valid_uuid(target_biz_id):
                try:
                    biz_resp = self.client.table("businesses").select("id").limit(1).execute()
                    if biz_resp.data:
                        target_biz_id = biz_resp.data[0]["id"]
                    else:
                        new_b = self.client.table("businesses").insert({"name": "Main Business"}).execute()
                        target_biz_id = new_b.data[0]["id"] if new_b.data else None
                except Exception:
                    target_biz_id = None

            if target_biz_id and is_valid_uuid(target_biz_id):
                data = {
                    "business_id": str(target_biz_id),
                    "name": name,
                    "role": role,
                    "status": status
                }
                response = self.client.table("agents").insert(data).execute()
                agent = response.data[0] if response.data else {}
            else:
                agent = {
                    "id": f"agent-{uuid.uuid4().hex[:8]}",
                    "business_id": business_id,
                    "name": name,
                    "role": role,
                    "status": status
                }
                _IN_MEMORY_AGENTS[agent["id"]] = agent
            
            agent_id = str(agent.get("id", uuid.uuid4()))
            agent["id"] = agent_id
            
            # Store PRD v6.0 metadata
            extra_meta = {
                "trust_tier": trust_tier,
                "specialization_id": specialization_id or f"{role.lower()}-standard-v1",
                "hiring_model": hiring_model,
                "clean_cycles_count": 0,
                "authority_limit_usd": 0.0 if trust_tier == "observe" else (100.0 if trust_tier == "assist" else 1000.0),
                "system_prompt": system_prompt,
                "model": model or "kimi-k3",
                "capabilities": capabilities or []
            }
            _IN_MEMORY_AGENT_EXTRA[agent_id] = extra_meta
            agent.update(extra_meta)
            
            # Log audit event for worker hire
            self.log_audit_event(
                business_id=business_id,
                agent_id=agent_id,
                agent_name=name,
                role=role,
                trust_tier=trust_tier,
                action=f"Recruited AI Worker ({hiring_model.capitalize()}) - Specialization: {specialization_id or 'Standard'}",
                details={"hiring_model": hiring_model, "tier": trust_tier}
            )
            return agent
        except Exception as e:
            if "status" in str(e) and "PGRST204" in str(e):
                logger.warning("agents table missing 'status' column — inserting basic.")
                data = {"business_id": business_id, "name": name, "role": role}
                response = self.client.table("agents").insert(data).execute()
                agent = response.data[0] if response.data else {}
                agent_id = str(agent.get("id", uuid.uuid4()))
                agent["id"] = agent_id
                extra_meta = {
                    "trust_tier": trust_tier,
                    "specialization_id": specialization_id or f"{role.lower()}-standard-v1",
                    "hiring_model": hiring_model,
                    "clean_cycles_count": 0,
                    "authority_limit_usd": 0.0 if trust_tier == "observe" else 100.0,
                    "system_prompt": system_prompt,
                    "model": model or "kimi-k3",
                    "capabilities": capabilities or []
                }
                _IN_MEMORY_AGENT_EXTRA[agent_id] = extra_meta
                agent.update(extra_meta)
                return agent
            logger.error(f"Error creating agent for business {business_id}: {e}")
            raise e

    def update_agent_status(self, agent_id: str, status: str) -> dict[str, Any]:
        """Updates the status of an agent."""
        try:
            response = self.client.table("agents")\
                .update({"status": status})\
                .eq("id", agent_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            if "PGRST204" in str(e):
                return {}
            logger.error(f"Error updating agent {agent_id} status to {status}: {e}")
            return {}

    def promote_agent(self, business_id: str, agent_id: str, target_tier: Optional[str] = None, reason: str = "Founder authorization") -> dict[str, Any]:
        """Promotes an agent's trust tier (PRD v6.0 §6.1)."""
        extra = _IN_MEMORY_AGENT_EXTRA.get(agent_id, {"trust_tier": "observe", "clean_cycles_count": 0})
        current_tier = extra.get("trust_tier", "observe")
        
        if not target_tier:
            target_tier = "assist" if current_tier == "observe" else "operate"
            
        extra["trust_tier"] = target_tier
        if target_tier == "assist":
            extra["authority_limit_usd"] = 100.0
        elif target_tier == "operate":
            extra["authority_limit_usd"] = 1000.0
            
        _IN_MEMORY_AGENT_EXTRA[agent_id] = extra
        
        # Log to feed
        self.log_audit_event(
            business_id=business_id,
            agent_id=agent_id,
            trust_tier=target_tier,
            action=f"Promoted to {target_tier.capitalize()} Tier",
            details={"reason": reason, "previous_tier": current_tier, "new_tier": target_tier}
        )
        return {"status": "success", "agent_id": agent_id, "new_tier": target_tier, "reason": reason}

    def demote_agent(self, business_id: str, agent_id: str, reason: str = "Flagged error or rejection") -> dict[str, Any]:
        """Demotes an agent immediately upon error/rejection (PRD v6.0 §6.1)."""
        extra = _IN_MEMORY_AGENT_EXTRA.get(agent_id, {"trust_tier": "observe", "clean_cycles_count": 0})
        new_tier, msg = GovernanceService.evaluate_demotion(extra, reason)
        
        extra["trust_tier"] = new_tier
        extra["clean_cycles_count"] = 0 # Reset clean streak
        if new_tier == "observe":
            extra["authority_limit_usd"] = 0.0
        elif new_tier == "assist":
            extra["authority_limit_usd"] = 100.0
            
        _IN_MEMORY_AGENT_EXTRA[agent_id] = extra
        
        self.log_audit_event(
            business_id=business_id,
            agent_id=agent_id,
            trust_tier=new_tier,
            action=f"Demoted to {new_tier.capitalize()} Tier",
            details={"reason": reason, "new_tier": new_tier}
        )
        return {"status": "demoted", "agent_id": agent_id, "new_tier": new_tier, "reason": reason}

    def record_task_verdict(self, business_id: str, agent_id: str, is_clean: bool, reason: str = "") -> dict[str, Any]:
        """Records task success or failure and automatically adjusts trust tier if qualified."""
        extra = _IN_MEMORY_AGENT_EXTRA.get(agent_id, {"trust_tier": "observe", "clean_cycles_count": 0})
        if is_clean:
            extra["clean_cycles_count"] = extra.get("clean_cycles_count", 0) + 1
            _IN_MEMORY_AGENT_EXTRA[agent_id] = extra
            
            # Check for auto-promotion from Observe -> Assist
            new_tier, promo_reason = GovernanceService.evaluate_promotion(extra)
            if new_tier:
                return self.promote_agent(business_id, agent_id, target_tier=new_tier, reason=promo_reason)
            return {"status": "clean_recorded", "clean_cycles": extra["clean_cycles_count"]}
        else:
            return self.demote_agent(business_id, agent_id, reason=reason or "Execution flaw encountered")

    def create_task(
        self,
        business_id: str,
        description: str,
        status: str = "pending",
        parent_id: Optional[str] = None,
        dependencies: List[str] = [],
        assignee_role: Optional[str] = None,
        id: Optional[str] = None,
        mandate: Optional[str] = None,
        cadence: str = "once",
        priority: str = "normal",
        authority_limit: Optional[Dict[str, Any]] = None,
        trust_tier: str = "observe",
        specialization_id: Optional[str] = None,
        shared_memory_refs: Optional[List[str]] = None,
        expected_output: Optional[Dict[str, Any]] = None
    ) -> dict[str, Any]:
        """Creates a new Task / Mandate contract."""
        try:
            data = {
                "business_id": business_id,
                "description": description,
                "status": status,
                "parent_id": parent_id,
                "dependencies": dependencies,
                "assignee_role": assignee_role
            }
            if id:
                data["id"] = id
                
            response = self.client.table("tasks").insert(data).execute()
            task = response.data[0] if response.data else {}
            
            # Attach PRD mandate metadata
            task_id = task.get("id", id or str(uuid.uuid4()))
            task["mandate"] = mandate or description
            task["cadence"] = cadence
            task["priority"] = priority
            task["authority_limit"] = authority_limit or {"requires_approval_above_usd": 0.0}
            task["trust_tier"] = trust_tier
            task["specialization_id"] = specialization_id
            task["shared_memory_refs"] = shared_memory_refs or []
            task["expected_output"] = expected_output
            
            self.log_audit_event(
                business_id=business_id,
                role=assignee_role,
                trust_tier=trust_tier,
                action=f"Mandate Dispatched: {mandate or description[:60]}",
                details={"cadence": cadence, "priority": priority, "task_id": str(task_id)},
                shared_memory_refs=shared_memory_refs
            )
            return task
        except Exception as e:
            logger.error(f"Error creating task for business {business_id}: {e}")
            raise e

    def list_tasks(self, business_id: str, status: Optional[str] = None) -> List[dict[str, Any]]:
        """List tasks for a business."""
        try:
            query = self.client.table("tasks").select("*").eq("business_id", business_id)
            if status:
                query = query.eq("status", status)
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error listing tasks for business {business_id}: {e}")
            raise e

    def assign_task(self, task_id: str, agent_id: str) -> dict[str, Any]:
        """Assigns an agent to a task."""
        try:
            response = self.client.table("tasks")\
                .update({"agent_id": agent_id, "status": "assigned"})\
                .eq("id", task_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error assigning task {task_id} to agent {agent_id}: {e}")
            raise e

    def get_active_task_for_agent(self, agent_id: str) -> Optional[dict[str, Any]]:
        """Finds the currently running task for a given agent_id."""
        try:
            response = self.client.table("tasks")\
                .select("*")\
                .eq("agent_id", agent_id)\
                .eq("status", "running")\
                .execute()
            
            if not response.data:
                response = self.client.table("tasks")\
                    .select("*")\
                    .eq("agent_id", agent_id)\
                    .eq("status", "assigned")\
                    .execute()
                    
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error fetching active task for agent {agent_id}: {e}")
            raise e

    def get_active_task_for_business(self, business_id: str) -> Optional[dict[str, Any]]:
        """Finds the currently running team task for a given business."""
        try:
            response = self.client.table("tasks")\
                .select("*")\
                .eq("business_id", business_id)\
                .eq("status", "running")\
                .execute()
                
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error fetching active task for business {business_id}: {e}")
            raise e

    def update_task_status(self, task_id: str, status: str) -> dict[str, Any]:
        """Updates the status of a task."""
        try:
            response = self.client.table("tasks")\
                .update({"status": status})\
                .eq("id", task_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error updating task {task_id} status to {status}: {e}")
            raise e

    def update_task_result(self, task_id: str, result: str) -> dict[str, Any]:
        """Updates the result of a task."""
        try:
            response = self.client.table("tasks")\
                .update({"result": result, "status": "completed"})\
                .eq("id", task_id)\
                .execute()
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error updating task {task_id} result: {e}")
            raise e

    # --- Company Feed / Audit Trail (PRD v6.0 §4.2, §10.1) ---

    def log_audit_event(
        self,
        business_id: str,
        action: str,
        agent_id: Optional[str] = None,
        agent_name: Optional[str] = None,
        role: Optional[str] = None,
        mandate: Optional[str] = None,
        trust_tier: str = "observe",
        details: Optional[Dict[str, Any]] = None,
        review_status: Optional[str] = None,
        shared_memory_refs: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Logs an event into the structured Company Feed."""
        entry = {
            "id": str(uuid.uuid4()),
            "business_id": str(business_id),
            "agent_id": str(agent_id) if agent_id else None,
            "agent_name": agent_name,
            "role": role,
            "mandate": mandate,
            "trust_tier": trust_tier,
            "action": action,
            "details": details or {},
            "review_status": review_status or "unattended",
            "shared_memory_refs": shared_memory_refs or [],
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        _IN_MEMORY_AUDIT_LOG.insert(0, entry)
        # Cap log length to 500 entries
        if len(_IN_MEMORY_AUDIT_LOG) > 500:
            _IN_MEMORY_AUDIT_LOG.pop()
        return entry

    def list_audit_feed(self, business_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves the chronological audit log for the Company Feed."""
        filtered = [e for e in _IN_MEMORY_AUDIT_LOG if e.get("business_id") == str(business_id) or business_id == "default-business-id"]
        return filtered[:limit]
