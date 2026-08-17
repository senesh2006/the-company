import json
import logging
import re
from typing import List, Dict, Any, Optional
from app.agents.llm_factory import get_llm

logger = logging.getLogger(__name__)

# In-memory cache for AI-generated milestone templates to avoid repeated LLM calls
_AI_MILESTONE_CACHE: Dict[str, List[Dict[str, Any]]] = {}

def decompose_task_with_ai(
    description: str,
    assignee_role: Optional[str] = None,
    use_llm: bool = True
) -> List[Dict[str, Any]]:
    """
    Invokes the AI Supervisor LLM to dynamically deconstruct any operational mandate
    into 3 to 4 tailored, non-hardcoded milestone steps.
    """
    clean_desc = (description or "").strip()
    if not clean_desc:
        clean_desc = "Autonomous Operational Task"
    
    role = assignee_role or "Specialist"
    cache_key = f"{clean_desc.lower()}___{role.lower()}"

    if cache_key in _AI_MILESTONE_CACHE:
        return _AI_MILESTONE_CACHE[cache_key]

    if not use_llm:
        # Fast non-blocking contextual generator
        return _generate_dynamic_fallback(clean_desc, role, cache_key)

    try:
        llm = get_llm(role="Supervisor", temperature=0.1)
        system_msg = (
            "You are the Lead AI Operations Architect. Deconstruct the user's operational mandate into "
            "3 to 4 sequential, highly specific operational milestone steps.\n"
            "CRITICAL: Do NOT output generic boilerplate like 'Mandate Ingestion & Context Scope' or 'Tool Selection & ReAct Execution'. "
            "Write custom, context-aware milestone titles and descriptions that explicitly mention the specific entities, tools, APIs, numbers, and goals of THIS specific mandate.\n"
            "Return ONLY a valid JSON array of 3 to 4 objects with keys:\n"
            "- title: Concise title (3-6 words, e.g., 'WhatsApp Gateway & Contact Lookup', 'Competitor Pricing Scrape', 'Ledger Reconciliation')\n"
            "- description: Specific action summary (1 sentence explaining what will be performed)\n"
            "- assignee_role: Specialist role for this step (e.g., 'Personal Assistant', 'Engineering Specialist', 'Marketing Specialist', 'Finance Specialist', 'Quality Checker')\n"
            "Return NO markdown blocks, NO explanations, ONLY the raw JSON array."
        )
        user_msg = f"Mandate: {clean_desc}\nAssigned Role: {role}\nJSON:"

        res = llm.invoke([
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg}
        ])

        raw_content = res.content if hasattr(res, "content") else str(res)
        cleaned = raw_content.replace("```json", "").replace("```", "").strip()

        # Parse JSON
        parsed = json.loads(cleaned)
        if isinstance(parsed, list) and len(parsed) >= 2:
            formatted_templates = []
            for idx, item in enumerate(parsed[:4]):
                formatted_templates.append({
                    "id": f"m{idx+1}",
                    "title": str(item.get("title") or f"Milestone {idx+1}"),
                    "description": str(item.get("description") or f"Execute step {idx+1} for {clean_desc[:40]}..."),
                    "assignee_role": str(item.get("assignee_role") or role)
                })
            _AI_MILESTONE_CACHE[cache_key] = formatted_templates
            return formatted_templates

    except Exception as e:
        logger.warning(f"AI milestone decomposition fallback for '{clean_desc[:40]}': {e}")

    return _generate_dynamic_fallback(clean_desc, role, cache_key)


def _generate_dynamic_fallback(clean_desc: str, role: str, cache_key: str) -> List[Dict[str, Any]]:
    """Generates customized contextual milestones instantly without waiting for network LLM."""
    desc_words = [w for w in re.findall(r'\b\w+\b', clean_desc) if len(w) > 3][:6]
    focus_topic = " ".join(desc_words).title() if desc_words else clean_desc[:30].title()

    fallback_templates = [
        {
            "id": "m1",
            "title": f"Scope & Parameter Analysis: {focus_topic[:24]}",
            "description": f"Analyze mandate requirements and query relevant context for '{clean_desc[:60]}...'.",
            "assignee_role": role
        },
        {
            "id": "m2",
            "title": f"Specialist Execution & Tool Dispatch",
            "description": f"Trigger dedicated MCP integrations and execute primary operational workflows.",
            "assignee_role": role
        },
        {
            "id": "m3",
            "title": f"Verification & Quality Audit",
            "description": f"Verify execution telemetry, inspect side effects, and audit output quality.",
            "assignee_role": "Quality Checker"
        },
        {
            "id": "m4",
            "title": f"Executive Synthesis & Memory Sync",
            "description": f"Compile verified deliverable and sync snapshot to shared company memory.",
            "assignee_role": "Personal Assistant"
        }
    ]
    _AI_MILESTONE_CACHE[cache_key] = fallback_templates
    return fallback_templates


def generate_task_milestones(
    description: str,
    assignee_role: Optional[str] = None,
    status: str = "queued",
    result: Optional[str] = None,
    live_thoughts: Optional[List[Dict[str, Any]]] = None,
    use_llm: bool = True
) -> List[Dict[str, Any]]:
    """
    Deconstructs any task / mandate into a sequential AI-generated roadmap of 3 to 4 concrete milestones.
    Dynamically tracks the completion status of each milestone based on real execution lifecycle and live thoughts.
    """
    templates = decompose_task_with_ai(description=description, assignee_role=assignee_role, use_llm=use_llm)

    # Assign status to each milestone based on task lifecycle & live thought progress
    milestones: List[Dict[str, Any]] = []
    total = len(templates)
    num_thoughts = len(live_thoughts or [])

    for idx, tpl in enumerate(templates):
        m_status = "pending"

        if status in ["completed", "success"]:
            m_status = "completed"
        elif status == "needs_approval":
            if idx < total - 1:
                m_status = "completed"
            else:
                m_status = "blocked"  # Awaiting Human Approval in Governance Gateway
        elif status in ["failed", "rejected"]:
            if idx == 0:
                m_status = "blocked"
            elif idx == 1:
                m_status = "blocked"
            else:
                m_status = "pending"
        elif status in ["running", "in_progress"]:
            # Dynamically map live thoughts progress to milestone stages
            if num_thoughts >= 3:
                if idx < 2:
                    m_status = "completed"
                elif idx == 2:
                    m_status = "in_progress"
                else:
                    m_status = "pending"
            elif num_thoughts in [1, 2]:
                if idx == 0:
                    m_status = "completed"
                elif idx == 1:
                    m_status = "in_progress"
                else:
                    m_status = "pending"
            else:
                if idx == 0:
                    m_status = "in_progress"
                else:
                    m_status = "pending"
        else:  # queued / pending
            m_status = "pending"

        milestones.append({
            "id": tpl["id"],
            "title": tpl["title"],
            "description": tpl["description"],
            "status": m_status,
            "assignee_role": tpl["assignee_role"],
            "step_number": idx + 1,
            "total_steps": total
        })

    return milestones

def calculate_milestone_progress(milestones: List[Dict[str, Any]]) -> int:
    """Calculates exact completion percentage from milestone map."""
    if not milestones:
        return 0
    total = len(milestones)
    completed = sum(1 for m in milestones if m.get("status") == "completed")
    in_progress = sum(1 for m in milestones if m.get("status") == "in_progress")
    
    if completed == total:
        return 100
    
    progress = round(((completed + (in_progress * 0.5)) / total) * 100)
    return max(0, min(progress, 100))
