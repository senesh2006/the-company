from typing import Literal
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
import uuid
from langgraph.constants import Send, END

from app.core.config import settings
from app.agents.state import OrchestratorState, TaskNode
from app.services.task_service import TaskService

task_service = TaskService()

class SupervisorDecision(BaseModel):
    thoughts: str = Field(description="Reasoning about the current state of tasks and what to do next.")
    action: Literal["dispatch", "replan", "escalate", "finish"] = Field(description="The action to take.")
    new_tasks: list[TaskNode] = Field(default=[], description="Any new high-level tasks to add if replanning.")

def get_supervisor_agent(roles: list[str]):
    llm = ChatOpenAI(
        model="accounts/fireworks/models/kimi-k3" if settings.FIREWORKS_API_KEY else "gpt-4o",
        api_key=settings.FIREWORKS_API_KEY or settings.OPENAI_API_KEY,
        base_url="https://api.fireworks.ai/inference/v1" if settings.FIREWORKS_API_KEY else None
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are the Global Supervisor (Level 1).
You manage the master task graph for a multi-agent system.
Available Level 2 Specialist roles: {roles}

Analyze the current state of tasks:
{current_tasks}

If tasks are pending, output action="dispatch". 
If you need to break down the user's objective into high-level tasks, output action="replan" and provide new_tasks.
If all tasks are completed, output action="finish".
"""),
        ("human", "User message: {messages}")
    ])
    
    return prompt | llm.with_structured_output(SupervisorDecision)

def global_supervisor_node(state: OrchestratorState):
    roles = list({agent.role for agent in state.get("active_agents", {}).values()})
    supervisor = get_supervisor_agent(roles)
    
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
        
        # Sync to DB
        task_service.create_task(
            business_id=state["business_id"],
            description=t.description,
            status="queued",
            assignee_role=t.assignee_role,
            id=t.id,
            dependencies=t.dependencies
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
            # Check dependencies
            deps_met = all(tasks[dep].status == "completed" for dep in task.dependencies if dep in tasks)
            if deps_met:
                # Find candidate agent
                candidate_agents = [a for a in agents.values() if a.role == task.assignee_role]
                if candidate_agents:
                    agent = candidate_agents[0]
                    node_name = f"worker_{agent.id}"
                    
                    task_service.update_task_status(task.id, "running")
                    task_service.assign_task(task.id, agent.id)
                    
                    # Update state and route to worker
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
        # If no sends and not completed, we might be deadlocked or just waiting for workers to finish
        # For simplicity, if nothing to send, return END (or loop back if we had a sleep mechanism)
        return END
        
    return sends
