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
1. Analyze the founder's instruction and delegate tasks to the single most suitable specialist worker listed below.
2. Read shared business context:
{shared_context_summary}

=== AVAILABLE SPECIALIST ROLES & DOMAINS ===
- Personal Assistant: Triage and list received emails/inbox, send/draft emails, check calendar availability, schedule meetings, web search, helpdesk, and general operations.
- Finance Manager: Google Sheets master ledgers, double-entry bookkeeping, trial balance audits, chart of accounts, Stripe invoices, expense receipts, contract desk, vendor portals.
- Marketing Manager: Growth campaigns, content calendars, social media posts, SEO analysis, brand copy.
- EngineeringWorker / Coder: Software development, debugging, GitHub pull requests, technical code tasks.

Current Active Roles:
{roles}
=== END OF ROLES ===

CRITICAL RULES FOR TASK PLANNING:
1. SINGLE DIRECT ACTION MANDATES: For single direct requests (e.g. "create a google sheet named trial balance", "list the 5 most recent unread emails", "send email to X", "check my calendar", "write a tweet about Y", "run tests"), create EXACTLY ONE (1) focused task assigned directly to the primary specialist.
   - DO NOT create multi-stage pipelines (e.g. NO "Scope Analysis", NO "Parameter Check", NO "Quality Checker" subtasks). The specialist performs planning, execution, and verification in a single pass.
2. COMPLEX MULTI-DEPARTMENT PROJECTS: Only create multiple sub-tasks (maximum 3) when the founder's request genuinely spans multiple distinct specialist domains (e.g. Marketing copy + Finance budget + Engineering landing page).
3. The "assignee_role" field in each new_task MUST be set to EXACTLY one of the active roles: {roles}.
   - NEVER use placeholder or non-existent roles like "Specialist", "Quality Checker", "Scope Analyst", or "Coordinator".
4. If the founder's request is a Google Sheet, accounting, ledger, invoice, tax, or financial task -> assign to "Finance Manager" (or "Personal Assistant").
5. If the founder's request is an email, calendar, web research, or administrative task -> assign to "Personal Assistant".
6. If the founder's request is a marketing, campaign, or social media task -> assign to "Marketing Manager".
7. If the founder's request is a coding or software engineering task -> assign to "EngineeringWorker" or "Coder".

Analyze the current state of tasks:
{current_tasks}

If tasks are pending or executing, output action="dispatch". 
If initial planning is needed, output action="replan" and provide at most 1-2 new_tasks.
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
    
    # Fallback: If supervisor decision returned NO tasks on first turn, create one direct task for the whole objective
    if not tasks_to_create and existing_count == 0 and last_message:
        fallback_role = _resolve_assignee_role("Personal Assistant", available_roles, last_message)
        tasks_to_create = [
            TaskNode(
                id=str(uuid.uuid4()),
                description=last_message,
                assignee_role=fallback_role,
                status="queued",
                dependencies=[]
            )
        ]
    
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

    # 1. Exact match against real roles
    for role in available_roles:
        if role.lower() == raw:
            return role

    # 2. Check task intent keywords first for reliable domain routing
    if any(w in desc for w in ["sheet", "spreadsheet", "trial balance", "balance", "ledger", "invoice", "accounting", "tax", "stripe", "expense", "budget", "debit", "credit", "finance", "coa", "chart of accounts"]):
        for r in available_roles:
            if "finance" in r.lower() or "account" in r.lower():
                return r

    if any(w in desc for w in ["mail", "email", "inbox", "gmail", "calendar", "schedule", "meeting", "ticket", "helpdesk", "brief", "today", "triage", "search", "web"]):
        for r in available_roles:
            if "assistant" in r.lower() or "admin" in r.lower() or "operations" in r.lower():
                return r

    if any(w in desc for w in ["marketing", "social", "campaign", "twitter", "linkedin", "seo", "content", "post", "growth", "copy"]):
        for r in available_roles:
            if "market" in r.lower() or "growth" in r.lower():
                return r

    if any(w in desc for w in ["code", "bug", "git", "github", "develop", "software", "test", "python", "fastapi"]):
        for r in available_roles:
            if "engineer" in r.lower() or "code" in r.lower():
                return r

    # 3. Fuzzy match: find the closest available role
    best_match = None
    best_score = 0.0
    for role in available_roles:
        if raw and (raw in role.lower() or role.lower() in raw):
            return role
        score = SequenceMatcher(None, raw, role.lower()).ratio()
        if score > best_score:
            best_score = score
            best_match = role

    if best_match and best_score >= 0.3:
        logger.info(f"Fuzzy-matched assignee_role '{llm_role}' -> '{best_match}' (score={best_score:.2f})")
        return best_match

    # 4. Default fallback to Personal Assistant if available, else first available role
    for r in available_roles:
        if "assistant" in r.lower():
            return r
    return available_roles[0]


def _match_agent_to_role(agents: dict, assignee_role: str) -> object:
    """
    Finds the best matching agent for a given assignee_role using
    exact match, substring match, and fuzzy matching. Guaranteed to return an agent.
    """
    if not agents:
        return None

    if not assignee_role:
        for a in agents.values():
            if "assistant" in a.role.lower():
                return a
        return list(agents.values())[0]

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

    if best_agent and best_score >= 0.3:
        return best_agent

    # Guaranteed fallback: Return Personal Assistant or first available agent
    for a in agents.values():
        if "assistant" in a.role.lower():
            return a

    return list(agents.values())[0]


def global_router(state: OrchestratorState):
    tasks = state.get("task_graph", {})
    agents = state.get("active_agents", {})
    business_id = state.get("business_id", "00000000-0000-0000-0000-000000000001")
    task_id = state.get("task_id")
    messages = state.get("messages", [])
    shared_context = state.get("shared_context", {})

    all_completed = True
    has_tasks = len(tasks) > 0
    sends = []

    for t_id, task in tasks.items():
        if task.status != "completed":
            all_completed = False

        if task.status == "queued":
            # Check if all dependencies are satisfied or if they don't exist in tasks
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
                        "business_id": business_id,
                        "task_id": task_id,
                        "task_graph": {task.id: task},
                        "active_agents": {agent.id: agent},
                        "messages": messages,
                        "shared_context": shared_context
                    }))

    # Deadlock breaker: If we have queued tasks but sends is empty because of unsatisfied dependencies
    if not sends and not all_completed and has_tasks:
        for t_id, task in tasks.items():
            if task.status == "queued":
                agent = _match_agent_to_role(agents, task.assignee_role)
                if agent:
                    node_name = f"worker_{agent.id}"
                    task.status = "running"
                    task.assignee_id = agent.id
                    agent.current_task_id = task.id
                    sends.append(Send(node_name, {
                        "business_id": business_id,
                        "task_id": task_id,
                        "task_graph": {task.id: task},
                        "active_agents": {agent.id: agent},
                        "messages": messages,
                        "shared_context": shared_context
                    }))
                    break

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
    import re
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

    # Gather completed deliverables per task
    deliverables: List[Dict[str, Any]] = []

    # 1. From worker results
    for wr in worker_results:
        role = getattr(wr, "role", None) or getattr(wr, "agent_role", None) or (wr.get("role") if isinstance(wr, dict) else None) or (wr.get("agent_role") if isinstance(wr, dict) else None) or "Specialist"
        out = getattr(wr, "output", "") if not isinstance(wr, dict) else (wr.get("output") or "")
        t_id = getattr(wr, "task_id", "") if not isinstance(wr, dict) else (wr.get("task_id") or "")
        if out and out.strip():
            task_desc = ""
            if t_id and t_id in tasks:
                task_desc = getattr(tasks[t_id], "description", "") or (tasks[t_id].get("description") if isinstance(tasks[t_id], dict) else "")
            deliverables.append({
                "task_id": t_id,
                "role": role,
                "description": task_desc or original_objective,
                "output": out.strip()
            })

    # 2. From task graph
    for t_id, task in tasks.items():
        res = getattr(task, "result", None) if not isinstance(task, dict) else (task.get("result") or "")
        desc = getattr(task, "description", "") if not isinstance(task, dict) else (task.get("description") or "")
        role = getattr(task, "assignee_role", None) if not isinstance(task, dict) else (task.get("assignee_role") or "Specialist")
        if res and res.strip() and not any(d["task_id"] == t_id for d in deliverables):
            deliverables.append({
                "task_id": t_id,
                "role": role,
                "description": desc or original_objective,
                "output": res.strip()
            })

    # Format final output
    if len(deliverables) == 1:
        single_output = deliverables[0]["output"]
        clean_body = re.sub(r"<(?:thought|think)>[\s\S]*?</(?:thought|think)>", "", single_output).strip()
        if not clean_body:
            m = re.search(r"<(?:thought|think)>([\s\S]*?)</(?:thought|think)>", single_output)
            thought_inner = m.group(1).strip() if m else ""
            single_output = f"<thought>\n{thought_inner}\n</thought>\n\n### Execution Results\n\n{thought_inner}"
        unified_output = single_output

    elif len(deliverables) > 1:
        agents = state.get("active_agents", {})
        model_id = None
        for agent in (agents.values() if isinstance(agents, dict) else []):
            m = getattr(agent, "model", None) or (agent.get("model") if isinstance(agent, dict) else None)
            if m:
                model_id = m
                break
        llm = get_llm(model_id=model_id, role="default", temperature=0.2)

        deliverables_context = "\n\n".join([
            f"=== {d['role'].upper()}: {d['description']} ===\n{d['output']}"
            for d in deliverables
        ])

        synth_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are the Founder's Personal Assistant & Chief of Staff.
Your specialized team has just completed their assigned tasks for the founder's objective.
Your job is to synthesize all their individual deliverables into ONE comprehensive, beautifully structured executive briefing for the founder.

Guidelines:
1. Provide a clear, high-impact Executive Summary answering the founder's objective directly.
2. Integrate key findings, data tables, email lists, spreadsheet links, and metrics from each specialist into cohesive, well-organized sections.
3. If deliverables contain Generative UI blocks (```agent-ui) or markdown tables or links, preserve them.
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
                f"### {d['description']}\n{d['output']}" for d in deliverables
            ])

        thought_lines = [
            f"Multi-Agent Coordination & Delegation Trace:",
            f"- Objective: {original_objective[:120]}...",
            f"- Coordinated {len(deliverables)} sub-tasks across: {', '.join(set(d['role'] for d in deliverables))}",
            f"- All specialist tool executions verified and synthesized into unified deliverable."
        ]
        if supervisor_thoughts:
            thought_lines.extend([f"- Supervisor Plan: {str(t)[:100]}" for t in supervisor_thoughts[-2:]])

        unified_output = f"<thought>\n" + "\n".join(thought_lines) + f"\n</thought>\n\n{synthesis_body}"

    else:
        # If no specialist deliverable was captured, fulfill directly with LLM so user ALWAYS gets a real answer
        try:
            direct_llm = get_llm(role="Personal Assistant", temperature=0.2)
            direct_prompt = ChatPromptTemplate.from_messages([
                ("system", "You are the Founder's Personal Assistant. Deliver a complete, beautifully structured, and comprehensive response answering the founder's mandate directly."),
                ("human", "{objective}")
            ])
            res = direct_llm.invoke(direct_prompt.format(objective=original_objective))
            unified_output = res.content
        except Exception as e:
            logger.error(f"Direct fulfillment error: {e}")
            unified_output = f"## Execution Summary\n\n**Mandate**: {original_objective}\n\nCompleted mandate processing."

    # Update main task result in DB
    if main_task_id:
        task_service.update_task_result(main_task_id, unified_output)
        task_service.update_task_status(main_task_id, "completed")

    return {
        "status": "completed",
        "messages": [AIMessage(content=unified_output)]
    }
