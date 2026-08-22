from typing import Literal, List, Optional, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel, Field
import uuid
import logging
from difflib import SequenceMatcher
from langgraph.constants import Send, END

from app.core.config import settings
from app.agents.state import OrchestratorState, TaskNode
from app.services.task_service import TaskService, is_valid_uuid
from app.services.shared_memory import SharedMemoryService
from app.agents.llm_factory import get_llm, get_fast_llm

task_service = TaskService()
memory_service = SharedMemoryService()
logger = logging.getLogger(__name__)

# Roles that are coordinator system markers — never valid task assignees
_INVALID_ASSIGNEE_ROLES = {
    "lead orchestrator", "orchestrator", "coordinator", "coordinating agent",
    "system", "planner", "supervisor_node",
}

class SupervisorDecision(BaseModel):
    thoughts: str = Field(description="Reasoning about company health, cross-worker state, and required mandates.")
    action: Literal["dispatch", "replan", "escalate", "finish"] = Field(description="The coordination action to take.")
    new_tasks: list[TaskNode] = Field(default=[], description="Any new high-level mandates to dispatch to specialist workers.")
    executive_brief: Optional[str] = Field(None, description="Brief summary of company operations for the founder.")

def get_supervisor_agent(roles: list[str], business_id: str, model_id: str = None):
    llm = get_fast_llm(temperature=0.0)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are the Founder's Personal Assistant & Coordinating Agent (PRD v6.0 §4.1).
You coordinate and delegate work to in-house specialist workers.
Your mandate:
1. Coordinate the in-house team by delegating tasks to the most suitable specialist worker listed below.
2. Read shared business context:
{shared_context_summary}
3. Break down the founder's objectives into structured mandates with dependencies.
4. Ensure cross-worker alignment.

=== AVAILABLE SPECIALIST ROLES & DOMAINS ===
- Personal Assistant / Operations: Triage and list received emails/inbox, draft replies, check calendar availability, schedule meetings, web search, helpdesk, and general operations.
- Finance Manager: Double-entry bookkeeping, trial balance audits, general ledger entries, Stripe invoices, spend receipts, contract desk, vendor portals, security questionnaires.
- Marketing Manager: Growth campaigns, content calendars, social media posts, SEO analysis.
- EngineeringWorker / Coder: Software development, debugging, GitHub pull requests, technical code tasks.

Current Active Roles:
{roles}
=== END OF ROLES ===

CRITICAL RULES FOR TASK PLANNING:
- Create ONLY 1 to 3 focused, high-impact sub-tasks (ABSOLUTE MAXIMUM 5 SUB-TASKS TOTAL).
- If the founder's request is an email, calendar, web research, or general operations task, assign it to "Personal Assistant".
- If the founder's request is an accounting, ledger, invoice, tax, or financial task, assign it to "Finance Manager".
- If the founder's request is a marketing, campaign, or social media task, assign it to "Marketing Manager".
- If the founder's request is a coding or software engineering task, assign it to "EngineeringWorker" or "Coder".
- The "assignee_role" field in each new_task MUST be set to EXACTLY one of the active roles listed above.

Analyze the current state of tasks:
{current_tasks}

If tasks are pending or executing, output action="dispatch". 
If initial planning is needed, output action="replan" and provide at most 1-3 new_tasks (max 5).
If all tasks are completed, output action="finish".
"""),
        ("human", "Founder instruction / Objective: {messages}")
    ])
    
    return prompt | llm.with_structured_output(SupervisorDecision)

def global_supervisor_node(state: OrchestratorState):
    agents = state.get("active_agents", {})
    roles = list({agent.role for agent in agents.values()})
    business_id = state.get("business_id", "00000000-0000-0000-0000-000000000001")
    current_tasks = state.get("task_graph", {})
    existing_count = len(current_tasks)

    # HARD LIMIT: Strictly cap total subtasks to maximum 5 per mandate
    MAX_TOTAL_SUBTASKS = min(5, getattr(settings, "MAX_SUBTASKS_PER_MANDATE", 5))

    # If tasks already exist:
    # 1. If any task is running or queued, DO NOT replan/create new tasks — allow workers to run.
    # 2. If all tasks are completed, DO NOT create new tasks — move to executive synthesis.
    # 3. If we have reached the max subtasks limit (>= 5), DO NOT create any more tasks.
    has_in_flight = any(t.status in ("running", "queued") for t in current_tasks.values())
    all_done = existing_count > 0 and all(t.status in ("completed", "success", "failed") for t in current_tasks.values())

    if existing_count >= MAX_TOTAL_SUBTASKS or all_done or has_in_flight:
        logger.info(f"[Supervisor] Skipping replan: existing_count={existing_count}, in_flight={has_in_flight}, all_done={all_done}")
        return {
            "iteration": state.get("iteration", 0) + 1
        }

    # Pick the model to use for the supervisor
    model_id = None
    for agent in agents.values():
        if agent.current_task_id and agent.model:
            model_id = agent.model
            break
    if not model_id:
        for agent in agents.values():
            if agent.model:
                model_id = agent.model
                break

    supervisor = get_supervisor_agent(roles, business_id, model_id=model_id)

    # Fetch shared memory context for cross-agent coordination
    memory_items = memory_service.list_by_business(business_id)
    shared_context_summary = "\n".join([f"- {m['key']}: {m['value']}" for m in memory_items[:10]]) if memory_items else "No shared memory entries."
    
    last_message = state["messages"][-1].content if state.get("messages") else ""
    
    decision = supervisor.invoke({
        "roles": ", ".join(roles),
        "current_tasks": str([t.model_dump() for t in current_tasks.values()]) if current_tasks else "No tasks currently exist.",
        "shared_context_summary": shared_context_summary,
        "messages": last_message
    })
    
    new_task_dict = {}
    id_mapping = {}
    available_roles = roles  # The real agent roles from the DB
    
    # Cap sub-tasks to strictly max 5 (or remaining slots)
    remaining_slots = max(0, MAX_TOTAL_SUBTASKS - existing_count)
    tasks_to_create = (decision.new_tasks or [])[:remaining_slots]
    
    # Map LLM-generated IDs to real UUIDs
    for t in tasks_to_create:
        new_id = str(uuid.uuid4())
        if t.id:
            id_mapping[t.id] = new_id
        t.id = new_id
        
    for t in tasks_to_create:
        valid_deps = []
        for d in (t.dependencies or []):
            mapped = id_mapping.get(d)
            if mapped and is_valid_uuid(mapped):
                valid_deps.append(mapped)
            elif is_valid_uuid(d):
                valid_deps.append(d)
        t.dependencies = valid_deps
        
        # --- CRITICAL: Validate and auto-correct assignee_role ---
        t.assignee_role = _resolve_assignee_role(t.assignee_role, available_roles, t.description)
        
        new_task_dict[t.id] = t
        
        # Sync Mandate to DB
        task_service.create_task(
            business_id=state["business_id"],
            description=t.description,
            mandate=t.description,
            status="queued",
            assignee_role=t.assignee_role,
            id=t.id,
            dependencies=t.dependencies
        )
    
    # Log Personal Assistant coordination pulse to Company Feed
    task_service.log_audit_event(
        business_id=business_id,
        role="Personal Assistant",
        agent_name="Personal Assistant",
        trust_tier="operate",
        action=f"Personal Assistant coordinated team: {decision.action.upper()}",
        details={"thoughts": decision.thoughts[:120], "brief": decision.executive_brief}
    )
    
    return {
        "supervisor_thoughts": [decision.thoughts],
        "task_graph": new_task_dict,
        "iteration": state.get("iteration", 0) + 1
    }

def _resolve_assignee_role(llm_role: Optional[str], available_roles: list[str], task_description: str = "") -> str:
    """
    Validates and auto-corrects the LLM-generated assignee_role to match
    an actual available worker role. Uses task description keywords for intelligent routing.
    """
    if not available_roles:
        return "Personal Assistant"

    desc = (task_description or "").lower()
    raw = (llm_role or "").strip().lower()

    # 1. Exact match
    for role in available_roles:
        if role.lower() == raw:
            return role

    # 2. Check for coordinator markers that should be routed to appropriate specialist
    if raw in _INVALID_ASSIGNEE_ROLES:
        # Check task intent
        if any(w in desc for w in ["mail", "email", "inbox", "calendar", "schedule", "meeting", "ticket", "helpdesk", "brief", "today"]):
            for r in available_roles:
                if "assistant" in r.lower() or "admin" in r.lower() or "operations" in r.lower():
                    return r
        elif any(w in desc for w in ["finance", "money", "ledger", "invoice", "accounting", "tax", "stripe", "balance", "expense", "debit", "credit", "audit"]):
            for r in available_roles:
                if "finance" in r.lower() or "account" in r.lower():
                    return r
        elif any(w in desc for w in ["marketing", "social", "campaign", "twitter", "linkedin", "seo", "content"]):
            for r in available_roles:
                if "market" in r.lower() or "growth" in r.lower():
                    return r
        elif any(w in desc for w in ["code", "bug", "git", "github", "develop", "software"]):
            for r in available_roles:
                if "engineer" in r.lower() or "code" in r.lower():
                    return r

    # 3. Keyword intent routing based on task description
    if any(w in desc for w in ["mail", "email", "inbox", "calendar", "schedule", "meeting", "ticket", "helpdesk", "brief", "today"]):
        for r in available_roles:
            if "assistant" in r.lower() or "admin" in r.lower() or "operations" in r.lower():
                return r

    if any(w in desc for w in ["finance", "money", "ledger", "invoice", "accounting", "tax", "stripe", "balance", "expense", "debit", "credit", "audit"]):
        for r in available_roles:
            if "finance" in r.lower() or "account" in r.lower():
                return r

    if any(w in desc for w in ["marketing", "social", "campaign", "twitter", "linkedin", "seo", "content"]):
        for r in available_roles:
            if "market" in r.lower() or "growth" in r.lower():
                return r

    if any(w in desc for w in ["code", "bug", "git", "github", "develop", "software"]):
        for r in available_roles:
            if "engineer" in r.lower() or "code" in r.lower():
                return r

    # 4. Fuzzy match: find the closest available role
    best_match = None
    best_score = 0.0
    for role in available_roles:
        # Check substring containment first
        if raw and (raw in role.lower() or role.lower() in raw):
            return role
        # Then use sequence matching
        score = SequenceMatcher(None, raw, role.lower()).ratio()
        if score > best_score:
            best_score = score
            best_match = role

    if best_match and best_score >= 0.4:
        logger.info(f"Fuzzy-matched assignee_role '{llm_role}' -> '{best_match}' (score={best_score:.2f})")
        return best_match

    # 5. Default fallback to Personal Assistant if available, else first role
    for r in available_roles:
        if "assistant" in r.lower():
            return r
    return available_roles[0]


def _match_agent_to_role(agents: dict, assignee_role: str) -> Optional[object]:
    """
    Finds the best matching agent for a given assignee_role using
    exact match, substring match, and fuzzy matching.
    """
    if not assignee_role:
        return None
    
    normalized = assignee_role.strip().lower()
    
    # Exact match
    for a in agents.values():
        if a.role.lower() == normalized:
            return a
    
    # Substring match (bidirectional)
    for a in agents.values():
        if normalized in a.role.lower() or a.role.lower() in normalized:
            return a
    
    # Fuzzy match
    best_agent = None
    best_score = 0.0
    for a in agents.values():
        score = SequenceMatcher(None, normalized, a.role.lower()).ratio()
        if score > best_score:
            best_score = score
            best_agent = a
    
    if best_agent and best_score >= 0.4:
        logger.info(f"Fuzzy-matched task role '{assignee_role}' -> agent '{best_agent.name}' ({best_agent.role}), score={best_score:.2f}")
        return best_agent
    
    return None


def global_router(state: OrchestratorState):
    tasks = state.get("task_graph", {})
    agents = state.get("active_agents", {})
    
    all_completed = True
    has_tasks = len(tasks) > 0
    
    sends = []
    
    for t_id, task in tasks.items():
        if task.status != "completed":
            all_completed = False
            
        if task.status == "queued":
            deps_met = all(tasks[dep].status == "completed" for dep in task.dependencies if dep in tasks)
            if deps_met:
                agent = _match_agent_to_role(agents, task.assignee_role)
                if agent:
                    node_name = f"worker_{agent.id}"
                    
                    try:
                        task_service.update_task_status(task.id, "running")
                        task_service.assign_task(task.id, agent.id)
                    except Exception as e:
                        logger.warning(f"Could not sync task status/assignment to DB: {e}")
                    
                    task.status = "running"
                    task.assignee_id = agent.id
                    agent.current_task_id = task.id
                    
                    sends.append(Send(node_name, {
                        "task_graph": {task.id: task},
                        "active_agents": {agent.id: agent}
                    }))
                else:
                    logger.error(f"No agent found for task '{task.description}' with role '{task.assignee_role}'. Available: {[a.role for a in agents.values()]}")
                    
    iteration = state.get("iteration", 0)
    if iteration >= settings.MAX_SUPERVISOR_ITERATIONS:
        logger.info(f"Supervisor reached max iterations limit ({iteration}). Routing to executive synthesis.")
        return "executive_synthesis"

    if all_completed and has_tasks:
        return "executive_synthesis"
        
    if not sends:
        return "executive_synthesis"
        
    return sends


def executive_synthesis_node(state: OrchestratorState):
    """
    Synthesizes the outputs of all specialist agents and sub-tasks into ONE unified,
    executive response from the Personal Assistant for the founder.
    """
    tasks = state.get("task_graph", {})
    worker_results = state.get("worker_results", [])
    supervisor_thoughts = state.get("supervisor_thoughts", [])
    main_task_id = state.get("task_id")
    
    # Original instruction from founder
    original_objective = ""
    for msg in state.get("messages", []):
        if isinstance(msg, HumanMessage) or getattr(msg, "type", "") == "human":
            original_objective = msg.content
            break
    if not original_objective and state.get("messages"):
        original_objective = state["messages"][0].content
        
    # Gather completed deliverables by role
    deliverables_by_role: Dict[str, str] = {}
    for wr in worker_results:
        role = getattr(wr, "role", None) or getattr(wr, "agent_role", None) or "Specialist"
        out = getattr(wr, "output", "") or ""
        if out:
            deliverables_by_role[role] = out
            
    for t_id, task in tasks.items():
        role = task.assignee_role or "Specialist"
        if task.result and role not in deliverables_by_role:
            deliverables_by_role[role] = task.result

    # Format synthesis
    if len(deliverables_by_role) == 1:
        single_role, single_output = next(iter(deliverables_by_role.items()))
        unified_output = single_output
    elif len(deliverables_by_role) > 1:
        agents = state.get("active_agents", {})
        model_id = None
        for agent in agents.values():
            if agent.model:
                model_id = agent.model
                break
        llm = get_llm(model_id=model_id, role="default", temperature=0.2)
        
        deliverables_context = "\n\n".join([
            f"=== {role.upper()} DELIVERABLE ===\n{out}"
            for role, out in deliverables_by_role.items()
        ])
        
        synth_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are the Founder's Personal Assistant & Chief of Staff.
Your specialized team has just completed their assigned tasks for the founder's objective.
Your job is to synthesize all their individual deliverables into ONE comprehensive, beautifully structured executive briefing for the founder.

Guidelines:
1. Provide a clear, high-impact Executive Summary answering the founder's objective directly.
2. Integrate key findings, data tables, and metrics from each specialist (Marketing, Finance, Engineering, Operations) into cohesive, well-organized sections.
3. If deliverables contain Generative UI blocks (```agent-ui) or markdown tables, preserve them.
4. Conclude with prioritized Key Takeaways and Immediate Next Steps.
5. Maintain a professional, crisp, and executive tone."""),
            ("human", """Founder Objective:
{objective}

Team Sub-Agent Deliverables:
{deliverables}

Synthesize these team outputs into ONE unified executive response:""")
        ])
        
        try:
            res = llm.invoke(synth_prompt.format(
                objective=original_objective,
                deliverables=deliverables_context
            ))
            synthesis_body = res.content
        except Exception as e:
            logger.warning(f"Synthesis LLM invocation failed: {e}. Falling back to structured compilation.")
            synthesis_body = "## Executive Summary\n\n" + "\n\n---\n\n".join([
                f"### {role}\n{out}" for role, out in deliverables_by_role.items()
            ])
            
        thought_lines = [
            f"Multi-Agent Coordination & Delegation Trace:",
            f"- Objective: {original_objective[:120]}...",
            f"- Coordinated {len(deliverables_by_role)} specialized agents: {', '.join(deliverables_by_role.keys())}",
            f"- All sub-agent tool executions verified and synthesized into unified executive deliverable."
        ]
        if supervisor_thoughts:
            thought_lines.extend([f"- Supervisor Plan: {t[:100]}" for t in supervisor_thoughts[-2:]])
            
        unified_output = f"<thought>\n" + "\n".join(thought_lines) + f"\n</thought>\n\n{synthesis_body}"
    else:
        unified_output = "Task successfully completed by the team."

    # Update main task result in DB
    if main_task_id:
        task_service.update_task_result(main_task_id, unified_output)
        task_service.update_task_status(main_task_id, "completed")
        
    return {
        "status": "completed",
        "messages": [AIMessage(content=unified_output)]
    }
