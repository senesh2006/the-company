from typing import Literal, List, Optional
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
import uuid
import logging
from difflib import SequenceMatcher
from langgraph.constants import Send, END

from app.core.config import settings
from app.agents.state import OrchestratorState, TaskNode
from app.services.task_service import TaskService
from app.services.shared_memory import SharedMemoryService
from app.agents.llm_factory import get_llm

task_service = TaskService()
memory_service = SharedMemoryService()
logger = logging.getLogger(__name__)

# Roles that are coordination/system roles — never valid task assignees
_INVALID_ASSIGNEE_ROLES = {
    "lead orchestrator", "orchestrator", "coordinator", "coordinating agent",
    "personal assistant", "robin", "supervisor", "system", "planner", "manager",
}

class SupervisorDecision(BaseModel):
    thoughts: str = Field(description="Reasoning about company health, cross-worker state, and required mandates.")
    action: Literal["dispatch", "replan", "escalate", "finish"] = Field(description="The coordination action to take.")
    new_tasks: list[TaskNode] = Field(default=[], description="Any new high-level mandates to dispatch to specialist workers.")
    executive_brief: Optional[str] = Field(None, description="Brief summary of company operations for the founder.")

def get_supervisor_agent(roles: list[str], business_id: str, model_id: str = None):
    llm = get_llm(model_id=model_id, role="default", temperature=0.0)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are the Founder's Personal Assistant & Coordinating Agent (PRD v6.0 §4.1).
You are an internal-only coordinator who reads every in-house worker's state and shared memory.
You never touch customer-facing or money-facing tools directly.
Your mandate:
1. Coordinate the in-house team by delegating tasks to the specialist workers listed below.
2. Read shared business context:
{shared_context_summary}
3. Break down the founder's objectives into structured mandates with dependencies.
4. Ensure cross-worker alignment (e.g., if cash flow is flagged as tight in memory, ensure marketing plans do not spend budget on paid promotion).
5. Surface items requiring founder decisions to the Governance Gateway.

=== AVAILABLE SPECIALIST ROLES (you MUST assign tasks to one of these) ===
{roles}
=== END OF ROLES ===

CRITICAL RULES FOR TASK ASSIGNMENT:
- The "assignee_role" field in each new_task MUST be set to EXACTLY one of the roles listed above.
- You are a COORDINATOR. You MUST NOT assign tasks to yourself. Never use "Lead Orchestrator", "Personal Assistant", "Orchestrator", "Coordinator", "Robin", or "Supervisor" as an assignee_role.
- For financial/accounting tasks: assign to the Accountant or Finance Manager role.
- For marketing/social media tasks: assign to the Marketing Manager or Social Media role.
- For admin/operations tasks: assign to the Admin/Ops role.
- For research tasks: assign to the Researcher role.
- If unsure which role to pick, choose the CLOSEST match from the available roles list.

Analyze the current state of tasks:
{current_tasks}

If tasks are pending, output action="dispatch". 
If you need to break down objectives into structured mandates, output action="replan" and provide new_tasks.
If all tasks are completed, output action="finish".
"""),
        ("human", "Founder instruction / Objective: {messages}")
    ])
    
    return prompt | llm.with_structured_output(SupervisorDecision)

def global_supervisor_node(state: OrchestratorState):
    agents = state.get("active_agents", {})
    roles = list({agent.role for agent in agents.values()})
    business_id = state.get("business_id", "default-business-id")

    # Pick the model to use for the supervisor: prefer the model of the running agent,
    # then any agent that has a model configured, otherwise let get_supervisor_agent fall back.
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
    
    current_tasks = state.get("task_graph", {})
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
    
    # Map LLM-generated IDs to real UUIDs
    for t in decision.new_tasks:
        new_id = str(uuid.uuid4())
        if t.id:
            id_mapping[t.id] = new_id
        t.id = new_id
        
    for t in decision.new_tasks:
        t.dependencies = [id_mapping.get(d, d) for d in t.dependencies]
        
        # --- CRITICAL: Validate and auto-correct assignee_role ---
        t.assignee_role = _resolve_assignee_role(t.assignee_role, available_roles)
        
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

def _resolve_assignee_role(llm_role: Optional[str], available_roles: list[str]) -> str:
    """
    Validates and auto-corrects the LLM-generated assignee_role to match
    an actual available worker role. Prevents the supervisor from assigning
    tasks to itself (e.g. "Lead Orchestrator").
    """
    if not llm_role or not available_roles:
        # Fallback: assign to the first available role
        fallback = available_roles[0] if available_roles else "Accountant"
        logger.warning(f"Empty assignee_role, falling back to '{fallback}'")
        return fallback
    
    normalized = llm_role.strip().lower()
    
    # Block self-assignment to coordinator roles
    if normalized in _INVALID_ASSIGNEE_ROLES:
        # Infer the best role from available roles based on common keywords
        fallback = available_roles[0] if available_roles else "Accountant"
        logger.warning(f"Blocked self-assignment to '{llm_role}', reassigning to '{fallback}'")
        return fallback
    
    # Exact match
    for role in available_roles:
        if role.lower() == normalized:
            return role
    
    # Fuzzy match: find the closest available role
    best_match = None
    best_score = 0.0
    for role in available_roles:
        # Check substring containment first
        if normalized in role.lower() or role.lower() in normalized:
            return role
        # Then use sequence matching
        score = SequenceMatcher(None, normalized, role.lower()).ratio()
        if score > best_score:
            best_score = score
            best_match = role
    
    if best_match and best_score >= 0.4:
        logger.info(f"Fuzzy-matched assignee_role '{llm_role}' -> '{best_match}' (score={best_score:.2f})")
        return best_match
    
    # Ultimate fallback
    fallback = available_roles[0]
    logger.warning(f"Could not match assignee_role '{llm_role}' to any known role, falling back to '{fallback}'")
    return fallback


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
                    
                    task_service.update_task_status(task.id, "running")
                    task_service.assign_task(task.id, agent.id)
                    
                    task.status = "running"
                    task.assignee_id = agent.id
                    agent.current_task_id = task.id
                    
                    sends.append(Send(node_name, {
                        "task_graph": {task.id: task},
                        "active_agents": {agent.id: agent}
                    }))
                else:
                    logger.error(f"No agent found for task '{task.description}' with role '{task.assignee_role}'. Available: {[a.role for a in agents.values()]}")
                    
    if all_completed and has_tasks:
        return END
        
    if not sends:
        return END
        
    return sends
