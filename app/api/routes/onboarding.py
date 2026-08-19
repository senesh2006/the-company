import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.services.shared_memory import SharedMemoryService
from app.services.task_service import TaskService

logger = logging.getLogger(__name__)

router = APIRouter()
memory_service = SharedMemoryService()
task_service = TaskService()

DEFAULT_BUSINESS_ID = "00000000-0000-0000-0000-000000000001"

class AgentSpec(BaseModel):
    name: str
    role: str
    department: Optional[str] = "Operations"
    trust_tier: Optional[str] = "assist"
    model: Optional[str] = "kimi-k3"
    description: Optional[str] = None

class OnboardingSurveyPayload(BaseModel):
    company_name: str = Field(..., description="Legal or operating business name")
    website_url: Optional[str] = Field(None, description="Primary domain or website URL")
    industry: str = Field(default="Technology & Software", description="Primary vertical or market segment")
    stage: str = Field(default="Growth", description="Company maturity stage")
    target_audience: Optional[str] = Field(default="B2B Enterprise", description="Ideal Customer Profile / audience")
    
    primary_goals: List[str] = Field(default_factory=list, description="Primary business milestones for next 90 days")
    top_bottlenecks: List[str] = Field(default_factory=list, description="Top operational friction points")
    
    brand_voice: Optional[str] = Field(default="Professional, modern, and data-driven", description="Tone and brand style guidelines")
    refund_policy_terms: Optional[str] = Field(default="30-day money back guarantee on all subscription plans.", description="Specific refund terms and criteria")
    sla_guarantees: Optional[str] = Field(default="99.9% uptime SLA with 1-hour priority support response.", description="Uptime and SLA commitments")
    data_retention_policy: Optional[str] = Field(default="Customer data is encrypted and retained for 90 days post-cancellation.", description="Data storage and privacy rules")
    
    knowledge_snippets: Optional[List[str]] = Field(default_factory=list, description="Additional FAQ or context text blocks")
    starter_agents: Optional[List[AgentSpec]] = Field(default_factory=list, description="Selected AI worker fleet to deploy")
    
    monthly_budget_usd: Optional[float] = Field(default=2500.0, description="Autonomous operational budget limit")
    approval_threshold_usd: Optional[float] = Field(default=500.0, description="Transactions above this amount require human approval")


@router.get("/status")
def get_onboarding_status(user = Depends(get_current_user)):
    """Checks if the authenticated business has completed initial onboarding."""
    try:
        biz_id = str(user.business_id or DEFAULT_BUSINESS_ID)
        profile = memory_service.get(biz_id, "company_profile")
        agents = task_service.list_agents(biz_id)
        
        is_completed = bool(profile and len(agents) > 0)
        return {
            "completed": is_completed,
            "business_id": biz_id,
            "company_name": profile.get("company_name") if isinstance(profile, dict) else None,
            "agent_count": len(agents)
        }
    except Exception as e:
        logger.error(f"Error checking onboarding status: {e}")
        return {"completed": False, "business_id": DEFAULT_BUSINESS_ID, "agent_count": 0}


@router.post("/complete")
def complete_onboarding(payload: OnboardingSurveyPayload, user = Depends(get_current_user)):
    """
    Ingests all survey answers, writes foundational policies to Shared Memory,
    provisions the tailored AI agent fleet, and triggers the initial executive briefing.
    """
    try:
        biz_id = str(user.business_id or DEFAULT_BUSINESS_ID)
        author = getattr(user, "name", "Founder") or "Founder"
        created_memory_keys = []

        # 1. Store Company Profile
        profile_data = {
            "company_name": payload.company_name,
            "website_url": payload.website_url,
            "industry": payload.industry,
            "stage": payload.stage,
            "target_audience": payload.target_audience,
            "monthly_budget_usd": payload.monthly_budget_usd,
            "approval_threshold_usd": payload.approval_threshold_usd
        }
        memory_service.set(biz_id, "company_profile", profile_data, tags=["profile", "core", "onboarding"], updated_by=author)
        created_memory_keys.append("company_profile")

        # 2. Store Strategic Goals & Bottlenecks
        goals_data = {
            "primary_goals": payload.primary_goals,
            "top_bottlenecks": payload.top_bottlenecks
        }
        memory_service.set(biz_id, "strategic_goals", goals_data, tags=["goals", "roadmap", "strategy"], updated_by=author)
        created_memory_keys.append("strategic_goals")

        # 3. Store Brand & Voice Guidelines
        if payload.brand_voice:
            memory_service.set(biz_id, "brand_guidelines", {"voice": payload.brand_voice}, tags=["brand", "marketing", "style"], updated_by=author)
            created_memory_keys.append("brand_guidelines")

        # 4. Store Core Operational Policies (Refunds, SLA, Data Retention)
        if payload.refund_policy_terms:
            memory_service.set(biz_id, "refund_policy", {
                "terms": payload.refund_policy_terms,
                "summary": f"Refund terms for {payload.company_name}"
            }, tags=["policy", "finance", "legal"], updated_by=author)
            created_memory_keys.append("refund_policy")

        if payload.sla_guarantees:
            memory_service.set(biz_id, "sla_guarantees", {
                "sla": payload.sla_guarantees,
                "summary": f"Service Level Agreement for {payload.company_name}"
            }, tags=["policy", "engineering", "support"], updated_by=author)
            created_memory_keys.append("sla_guarantees")

        if payload.data_retention_policy:
            memory_service.set(biz_id, "data_retention_policy", {
                "policy": payload.data_retention_policy,
                "summary": f"Data retention guidelines for {payload.company_name}"
            }, tags=["policy", "compliance", "security"], updated_by=author)
            created_memory_keys.append("data_retention_policy")

        # 5. Store Knowledge Snippets
        if payload.knowledge_snippets:
            for idx, snippet in enumerate(payload.knowledge_snippets):
                key_name = f"knowledge_snippet_{idx + 1}"
                memory_service.set(biz_id, key_name, {"content": snippet}, tags=["faq", "knowledge", "context"], updated_by=author)
                created_memory_keys.append(key_name)

        # 6. Deploy Starter Agents
        deployed_agents = []
        default_agents_to_hire = payload.starter_agents or [
            AgentSpec(name="Growth & Marketing Lead", role="Marketing Manager", department="Marketing", trust_tier="assist"),
            AgentSpec(name="Financial Controller & Auditor", role="Finance Manager", department="Finance", trust_tier="observe"),
            AgentSpec(name="Principal Coder", role="Coder", department="Engineering", trust_tier="assist"),
            AgentSpec(name="Operations & Market Researcher", role="Researcher", department="Operations", trust_tier="operate"),
        ]

        existing_agents = task_service.list_agents(biz_id)
        existing_roles = {a.get("role", "").lower() for a in existing_agents if isinstance(a, dict)}

        for spec in default_agents_to_hire:
            if spec.role.lower() not in existing_roles:
                try:
                    new_agent = task_service.create_agent(
                        business_id=biz_id,
                        name=spec.name,
                        role=spec.role,
                        trust_tier=spec.trust_tier or "observe",
                        model=spec.model or "kimi-k3"
                    )
                    deployed_agents.append(new_agent)
                except Exception as agent_err:
                    logger.warning(f"Could not deploy agent {spec.name}: {agent_err}")
            else:
                deployed_agents.append({"role": spec.role, "name": spec.name, "status": "existing"})

        # 7. Log Onboarding Audit Event
        task_service.log_audit_event(
            business_id=biz_id,
            role="Personal Assistant",
            agent_name="Personal Assistant",
            trust_tier="operate",
            action="Company Onboarding Survey Completed",
            details={
                "company_name": payload.company_name,
                "industry": payload.industry,
                "goals_count": len(payload.primary_goals),
                "memory_keys": created_memory_keys
            }
        )

        return {
            "status": "success",
            "business_id": biz_id,
            "company_name": payload.company_name,
            "memory_keys_created": created_memory_keys,
            "agents_deployed": deployed_agents,
            "message": "Company OS onboarding survey successfully processed and initialized."
        }
    except Exception as e:
        logger.error(f"Error completing onboarding: {e}")
        raise HTTPException(status_code=500, detail=str(e))
