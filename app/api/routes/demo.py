import os
import time
import logging
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
import jwt

from app.core.config import settings
from app.api.deps import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter()

DEMO_SUGGESTED_PROMPTS: List[Dict[str, Any]] = [
    {
        "id": "prompt-mktg-01",
        "label": "Draft Q4 Growth Campaign",
        "role": "Marketing Manager",
        "worker_name": "Sarah Chen",
        "category": "Growth & Outbound",
        "badge_color": "bg-emerald-50 text-emerald-700 border-emerald-200",
        "description": "Generate a multi-channel outbound launch strategy targeting enterprise RevOps directors.",
        "prompt_text": "Audit our ICP guidelines in shared memory and draft a 3-step outbound campaign strategy for enterprise RevOps buyers at $10M+ ARR SaaS companies, focusing on month-end financial close automation."
    },
    {
        "id": "prompt-fin-01",
        "label": "Audit P&L & Cash Runway",
        "role": "Finance Manager",
        "worker_name": "Frank Wright",
        "category": "Finance & Accounting",
        "badge_color": "bg-blue-50 text-blue-700 border-blue-200",
        "description": "Perform a GAAP variance check on Q2 expenses and calculate monthly runway.",
        "prompt_text": "Fetch our latest trial balance and general journal entries from the Google Sheets ledger service. Verify total debits equal credits, calculate net burn over the last 6 months, and report current cash runway."
    },
    {
        "id": "prompt-eng-01",
        "label": "Review Q4 Technical Roadmap",
        "role": "Coder",
        "worker_name": "Elena Rostova",
        "category": "Engineering & Architecture",
        "badge_color": "bg-cyan-50 text-cyan-700 border-cyan-200",
        "description": "Review product roadmap and outline technical architecture for WhatsApp webhooks.",
        "prompt_text": "Inspect product_roadmap.md in our knowledge base and create a technical architecture proposal for integrating real-time WhatsApp operational alerts for financial variance thresholds."
    },
    {
        "id": "prompt-intel-01",
        "label": "Competitor Intelligence Matrix",
        "role": "Researcher",
        "worker_name": "Marcus Vance",
        "category": "Market Intelligence",
        "badge_color": "bg-amber-50 text-amber-700 border-amber-200",
        "description": "Compare Aperture Analytics against Mosaic.tech and Cube Software.",
        "prompt_text": "Retrieve competitor_analysis.md and sales_call_notes.txt from our documents library. Summarize top enterprise objections regarding SOC2 compliance and outline 3 key win strategies against Mosaic.tech."
    },
    {
        "id": "prompt-pa-01",
        "label": "Daily Executive Briefing",
        "role": "Personal Assistant",
        "worker_name": "Executive Assistant",
        "category": "Executive Coordination",
        "badge_color": "bg-purple-50 text-purple-700 border-purple-200",
        "description": "Synthesize active worker status, top priorities, and pending approvals.",
        "prompt_text": "Synthesize today's executive briefing by pulling top priorities for Q3 2026, checking active worker statuses across departments, and highlighting any high-priority task approvals."
    },
    {
        "id": "prompt-fin-02",
        "label": "Reconcile SaaS Subscriptions",
        "role": "Finance Manager",
        "worker_name": "Frank Wright",
        "category": "Cost Optimization",
        "badge_color": "bg-blue-50 text-blue-700 border-blue-200",
        "description": "Analyze SaaS tool spend across team seats and flag potential savings.",
        "prompt_text": "Scan our general ledger software subscription expenses (`6000 - Software Subscriptions & SaaS Tools`) and compare against hr_policies.md to flag any recurring software tools exceeding $500/mo."
    },
    {
        "id": "prompt-mktg-02",
        "label": "Competitor Battlecard Copy",
        "role": "Marketing Manager",
        "worker_name": "Sarah Chen",
        "category": "Sales Enablement",
        "badge_color": "bg-emerald-50 text-emerald-700 border-emerald-200",
        "description": "Draft competitive objection handling copy for sales calls.",
        "prompt_text": "Review customer_persona.md and competitor_analysis.md. Write a 1-page sales battlecard highlighting Aperture's 1-click Google Sheets sync and autonomous AI worker fleet for our growth team."
    },
    {
        "id": "prompt-intel-02",
        "label": "SOC2 Compliance Checklist",
        "role": "Researcher",
        "worker_name": "Marcus Vance",
        "category": "Security & Governance",
        "badge_color": "bg-amber-50 text-amber-700 border-amber-200",
        "description": "Extract security requirements from sales notes and map against data retention rules.",
        "prompt_text": "Read sales_call_notes.txt and business profile data. Create a SOC2 compliance audit readiness checklist covering data encryption at rest, RBAC, and telemetry retention policies."
    }
]


@router.post("/login")
@router.get("/login")
def demo_login() -> Dict[str, Any]:
    """
    Public endpoint for 1-click Demo / Judge access.
    Returns a verified JWT session token scoped to the pre-seeded demo business_id
    without requiring any user credentials or signup forms.
    """
    try:
        demo_biz_id = settings.DEMO_BUSINESS_ID or os.getenv("DEMO_BUSINESS_ID") or "00000000-0000-0000-0000-000000000001"
        demo_email = settings.DEMO_EMAIL or os.getenv("DEMO_EMAIL") or "demo@thecompany.ai"
        
        jwt_secret = (
            settings.SUPABASE_JWT_SECRET or 
            settings.SECRET_KEY or 
            os.getenv("SUPABASE_JWT_SECRET") or 
            os.getenv("SECRET_KEY") or 
            "your-super-secret-key-change-in-production"
        )

        now = int(time.time())
        expires_at = now + (7 * 86400)  # 7 days session

        payload = {
            "sub": demo_biz_id,
            "id": demo_biz_id,
            "email": demo_email,
            "role": "authenticated",
            "business_id": demo_biz_id,
            "user_metadata": {
                "full_name": "Demo Evaluator / Judge",
                "is_demo": True,
                "role": "founder"
            },
            "app_metadata": {
                "provider": "demo_1click_access",
                "role": "authenticated"
            },
            "iat": now,
            "exp": expires_at
        }

        token = jwt.encode(payload, jwt_secret, algorithm="HS256")

        # Ensure demo business row exists in Supabase if connected
        try:
            client = get_supabase_client()
            if client:
                try:
                    client.table("businesses").upsert({
                        "id": demo_biz_id,
                        "name": "Aperture Analytics",
                        "owner_id": demo_biz_id
                    }).execute()
                except Exception:
                    pass
        except Exception as e:
            logger.debug(f"Demo business Supabase check skipped: {e}")

        logger.info(f"Generated 1-click demo access token for business_id: {demo_biz_id}")

        return {
            "status": "success",
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 7 * 86400,
            "business_id": demo_biz_id,
            "user": {
                "id": demo_biz_id,
                "email": demo_email,
                "role": "founder",
                "business_id": demo_biz_id,
                "user_metadata": {
                    "full_name": "Demo Evaluator / Judge",
                    "is_demo": True
                }
            },
            "message": "Demo session initialized. Welcome to Company OS!"
        }
    except Exception as e:
        logger.error(f"Failed to generate demo session token: {e}")
        raise HTTPException(status_code=500, detail=f"Could not initialize demo session: {str(e)}")


@router.get("/prompts")
def get_demo_prompts() -> Dict[str, Any]:
    """
    Returns curated 1-click scenario prompts for demo evaluators.
    """
    return {
        "status": "success",
        "prompts": DEMO_SUGGESTED_PROMPTS,
        "total_count": len(DEMO_SUGGESTED_PROMPTS)
    }


@router.post("/reset")
def reset_demo_account() -> Dict[str, Any]:
    """
    1-Click reset endpoint restoring the demo account to its pristine baseline state.
    Purges temporary tasks, logs, and thoughts while re-seeding the 6-month ledger & documents.
    """
    try:
        demo_biz_id = settings.DEMO_BUSINESS_ID or os.getenv("DEMO_BUSINESS_ID") or "00000000-0000-0000-0000-000000000001"
        from scripts.reset_demo_account import reset_demo_state
        reset_demo_state(business_id=demo_biz_id)
        logger.info(f"Demo account state successfully reset for business_id: {demo_biz_id}")
        return {
            "status": "success",
            "message": "Demo account successfully restored to pristine baseline state."
        }
    except Exception as e:
        logger.error(f"Failed to reset demo state: {e}")
        raise HTTPException(status_code=500, detail=f"Could not reset demo account: {str(e)}")
