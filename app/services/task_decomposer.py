import re
from typing import List, Dict, Any, Optional

def generate_task_milestones(
    description: str,
    assignee_role: Optional[str] = None,
    status: str = "queued",
    result: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Deconstructs any task / mandate into a sequential roadmap of 3 to 5 concrete milestones.
    Dynamically tracks the completion status of each milestone based on execution lifecycle.
    """
    desc_lower = (description or "").lower()
    role_lower = (assignee_role or "").lower()

    # 1. Marketing / Growth / SEO Mandates
    if any(k in desc_lower or k in role_lower for k in ["market", "growth", "cac", "cpa", "ad spend", "roas", "linkedin", "google ads", "seo", "campaign", "social"]):
        templates = [
            {
                "id": "m1",
                "title": "Telemetry & Channel Ingestion",
                "description": "Extract live performance data, campaign telemetry, and spend across active ad channels.",
                "assignee_role": "Marketing Specialist"
            },
            {
                "id": "m2",
                "title": "Unit Economics & CPA Audit",
                "description": "Calculate blended CAC, channel-specific CPAs, and ROAS variance against target benchmarks.",
                "assignee_role": "Finance Specialist" if "cpa" in desc_lower or "cac" in desc_lower else "Marketing Specialist"
            },
            {
                "id": "m3",
                "title": "Budget Reallocation Model",
                "description": "Formulate optimal spend shifts to high-performing campaigns and scale winning channels.",
                "assignee_role": "Marketing Specialist"
            },
            {
                "id": "m4",
                "title": "Executive Deliverable & Charting",
                "description": "Synthesize final strategic recommendations and render visual comparison data.",
                "assignee_role": "Personal Assistant"
            }
        ]

    # 2. Finance / Ledger / Invoicing / Cash Flow Mandates
    elif any(k in desc_lower or k in role_lower for k in ["finance", "ledger", "stripe", "invoice", "burn", "runway", "p&l", "balance", "bank", "accounting", "budget", "tax"]):
        templates = [
            {
                "id": "m1",
                "title": "Ledger & Account Feeds Ingestion",
                "description": "Query Stripe API, bank accounts, and database ledgers to ingest verified transaction rows.",
                "assignee_role": "Finance Specialist"
            },
            {
                "id": "m2",
                "title": "Variance & Cash Flow Modeling",
                "description": "Compute net burn rate, runway projection models, and flag anomalous variances.",
                "assignee_role": "Finance Specialist"
            },
            {
                "id": "m3",
                "title": "Maker-Checker Governance Audit",
                "description": "Verify authority thresholds, expense allocations, and compliance against spending limits.",
                "assignee_role": "Compliance Auditor"
            },
            {
                "id": "m4",
                "title": "Financial Record & Memory Sync",
                "description": "Publish finalized financial snapshot to shared company memory and generate briefing.",
                "assignee_role": "Personal Assistant"
            }
        ]

    # 3. Engineering / Code / Architecture / Bug Fix Mandates
    elif any(k in desc_lower or k in role_lower for k in ["code", "engine", "bug", "git", "repo", "api", "endpoint", "database", "backend", "frontend", "fix", "deploy", "refactor"]):
        templates = [
            {
                "id": "m1",
                "title": "Architecture & Scope Analysis",
                "description": "Inspect repository files, identify root cause or dependencies, and scope changes.",
                "assignee_role": "Engineering Specialist"
            },
            {
                "id": "m2",
                "title": "Implementation & Tool Execution",
                "description": "Write code modifications, update configurations, and execute file operations.",
                "assignee_role": "Engineering Specialist"
            },
            {
                "id": "m3",
                "title": "Regression & Verification Sandbox",
                "description": "Execute automated test suites, verify lints, and ensure zero regression defects.",
                "assignee_role": "Engineering Specialist"
            },
            {
                "id": "m4",
                "title": "Deliverable Package & Version Control",
                "description": "Package verified changes, update documentation, and commit to source control.",
                "assignee_role": "Personal Assistant"
            }
        ]

    # 4. Research / Analysis / General Operations Mandate
    else:
        templates = [
            {
                "id": "m1",
                "title": "Mandate Ingestion & Context Scope",
                "description": "Deconstruct operational objective and load contextual facts from company shared memory.",
                "assignee_role": assignee_role or "Personal Assistant"
            },
            {
                "id": "m2",
                "title": "Tool Selection & ReAct Execution",
                "description": "Formulate execution strategy and trigger specialized MCP tools and API integrations.",
                "assignee_role": assignee_role or "Specialist Worker"
            },
            {
                "id": "m3",
                "title": "Maker-Checker Quality Reflection",
                "description": "Conduct verification checks, audit confidence score, and ensure policy alignment.",
                "assignee_role": "Quality Checker"
            },
            {
                "id": "m4",
                "title": "Executive Synthesis & Memory Record",
                "description": "Assemble finalized deliverable, record audit trail, and present briefing to founder.",
                "assignee_role": "Personal Assistant"
            }
        ]

    # Assign status to each milestone based on task lifecycle
    milestones: List[Dict[str, Any]] = []
    total = len(templates)

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
            # Check if intermediate outputs exist or assign based on stage
            if idx == 0:
                m_status = "completed"
            elif idx == 1:
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
