from typing import Literal, List, Optional
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
import uuid
from langgraph.constants import Send, END

from app.core.config import settings
from app.agents.state import OrchestratorState, TaskNode
from app.services.task_service import TaskService
from app.services.shared_memory import SharedMemoryService
from app.agents.llm_factory import get_llm

task_service = TaskService()
memory_service = SharedMemoryService()

class SupervisorDecision(BaseModel):
    thoughts: str = Field(description="Reasoning about company health, cross-worker state, and required mandates.")
    action: Literal["dispatch", "replan", "escalate", "finish"] = Field(description="The coordination action to take.")
    new_tasks: list[TaskNode] = Field(default=[], description="Any new high-level mandates to dispatch to specialist workers.")
    executive_brief: Optional[str] = Field(None, description="Brief summary of company operations for the founder.")

def get_supervisor_agent(roles: list[str], business_id: str, model_id: str = None):
    llm = get_llm(model_id=model_id, role="default", temperature=0.0)

    # Fetch shared memory context for cross-agent coordination
    memory_items = memory_service.list_by_business(business_id)
    shared_context_summary = "\n".join([f"- {m['key']}: {m['value']}" for m in memory_items[:10]]) if memory_items else "No shared memory entries."

    prompt = ChatPromptTemplate.from_messages([
        ("system", f"""You are Robin, the Coordinating Agent (PRD v6.0 §4.1).
You are an internal-only coordinator who reads every in-house worker's state and shared memory.
You never touch customer-facing or money-facing tools directly.
Your mandate:
1. Coordinate the in-house team: Accountant, Social Media Manager, Admin/Ops, Researcher.
2. Read shared business context:
{shared_context_summary}
3. Break down the founder's objectives into structured mandates with dependencies.
4. Ensure cross-worker alignment (e.g., if cash flow is flagged as tight in memory, ensure marketing plans do not spend budget on paid promotion).
5. Surface items requiring founder decisions to the Governance Gateway.

Available specialist roles on staff: {{roles}}

Analyze the current state of tasks:
{{current_tasks}}

If tasks are pending, output action="dispatch". 
If you need to break down objectives into specialist mandates, output action="replan" and provide new_tasks.
If all tasks are completed, output action="finish".
"""),
        ("human", "Founder instruction / Objective: {messages}")
    ])
    
    return prompt | llm.with_structured_output(SupervisorDecision)

def global_supervisor_node(state: OrchestratorState):
    roles = list({agent.role for agent in state.get("active_agents", {}).values()})
    business_id = state.get("business_id", "default-business-id")
    supervisor = get_supervisor_agent(roles, business_id)
    
    current_tasks = state.get("task_graph", {})
    last_message = state["messages"][-1].content if state.get("messages") else ""
    
    decision = supervisor.invoke({
        "roles": ", ".join(roles),
        "current_tasks": str([t.model_dump() for t in current_tasks.values()]) if current_tasks else "No tasks currently exist.",
        "messages": last_message
    })
    
    new_task_dict = {}
    id_mapping = {}
    
    # Map LLM-generated IDs to real UUIDs
    for t in decision.new_tasks:
        new_id = str(uuid.uuid4())
        if t.id:
            id_mapping[t.id] = new_id
        t.id = new_id
        
    for t in decision.new_tasks:
        t.dependencies = [id_mapping.get(d, d) for d in t.dependencies]
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
    
    # Log Robin's coordination pulse to Company Feed
    task_service.log_audit_event(
        business_id=business_id,
        role="Coordinating Agent",
        agent_name="Robin",
        trust_tier="operate",
        action=f"Robin coordinated team: {decision.action.upper()}",
        details={"thoughts": decision.thoughts[:120], "brief": decision.executive_brief}
    )
    
    return {
        "supervisor_thoughts": [decision.thoughts],
        "task_graph": new_task_dict,
        "iteration": state.get("iteration", 0) + 1
    }

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
                candidate_agents = [a for a in agents.values() if a.role == task.assignee_role or (task.assignee_role and a.role.lower() in task.assignee_role.lower())]
                if candidate_agents:
                    agent = candidate_agents[0]
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
                    
    if all_completed and has_tasks:
        return END
        
    if not sends:
        return END
        
    return sends
