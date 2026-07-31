import uuid
from typing import Literal
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent
from langgraph.constants import Send

from app.core.config import settings
from app.agents.state import OrchestratorState, WorkerResult, SubOrchestrationState, TaskNode, AgentStatus
from app.agents.researcher import get_research_agent
from app.agents.tool_registry import registry
from app.services.task_service import TaskService

task_service = TaskService()

class WorkerComplexityDecision(BaseModel):
    thoughts: str = Field(description="Reasoning on the complexity of the task.")
    decision: Literal["execute_directly", "spawn_subworkers"] = Field(description="Whether to execute directly using tools, or spawn a team of sub-workers.")

def get_complexity_analyzer(role: str):
    llm = ChatOpenAI(
        model="accounts/fireworks/models/kimi-k3" if settings.FIREWORKS_API_KEY else "gpt-4o",
        api_key=settings.FIREWORKS_API_KEY or settings.OPENAI_API_KEY,
        base_url="https://api.fireworks.ai/inference/v1" if settings.FIREWORKS_API_KEY else None,
        temperature=0.0
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", f"You are a Level 2 Specialist ({role}). You have been assigned a task. Decide if it requires a team of sub-specialists or if you can do it yourself."),
        ("human", "Task: {task_description}")
    ])
    return prompt | llm.with_structured_output(WorkerComplexityDecision)

def make_level3_worker_node(role: str):
    llm = ChatOpenAI(
        model="accounts/fireworks/models/kimi-k3" if settings.FIREWORKS_API_KEY else "gpt-4o",
        api_key=settings.FIREWORKS_API_KEY or settings.OPENAI_API_KEY,
        base_url="https://api.fireworks.ai/inference/v1" if settings.FIREWORKS_API_KEY else None
    )
    # Subworkers get default assistant tools
    tools = registry.get_langchain_tools("assistant") 
    worker_agent = create_react_agent(llm, tools, state_modifier=f"You are a Level 3 Temporary Sub-Worker acting as {role}.")
    
    def worker_node(state: SubOrchestrationState):
        results = {}
        for t_id, task in state.sub_tasks.items():
            if task.assignee_role == role and task.status == "running":
                res = worker_agent.invoke({"messages": [HumanMessage(content=f"Subtask: {task.description}")]})
                output = res["messages"][-1].content
                
                # Copy task to modify
                updated_task = task.copy()
                updated_task.status = "completed"
                updated_task.result = output
                results[t_id] = updated_task
                
        return {"sub_tasks": results}
    
    return worker_node

def execute_sub_orchestration(business_id: str, main_task: TaskNode, researcher_plan) -> str:
    """Dynamically builds and runs a Level 3 graph based on the Research Plan."""
    
    # Provide defaults to tasks
    processed_tasks = {}
    for t in researcher_plan.recommended_subtasks:
        if not t.id:
            t.id = str(uuid.uuid4())
        t.status = "queued"
        processed_tasks[t.id] = t
        
    sub_state = SubOrchestrationState(
        supervisor_id="temp_super",
        original_task_id=main_task.id,
        sub_tasks=processed_tasks,
        status="executing"
    )
    
    workflow = StateGraph(SubOrchestrationState)
    
    def sub_router(state: SubOrchestrationState):
        all_done = True
        sends = []
        
        # We need a deep copy dict to return state updates safely
        updated_tasks = {}
        
        for t_id, task in state.sub_tasks.items():
            if task.status != "completed":
                all_done = False
                
            if task.status == "queued":
                deps_met = all(state.sub_tasks[dep].status == "completed" for dep in task.dependencies if dep in state.sub_tasks)
                if deps_met:
                    updated_task = task.copy()
                    updated_task.status = "running"
                    updated_tasks[t_id] = updated_task
                    
                    sends.append(Send(f"subworker_{task.assignee_role}", {"sub_tasks": {t_id: updated_task}}))
                    
        # Apply local updates before sending
        if updated_tasks:
            # We can't mutate state directly and return sends in one go easily without yielding, 
            # so we'll pass the updated_task in the Send payload so the worker sees it as "running".
            pass
                    
        if all_done or not sends:
            return END
            
        return sends
        
    workflow.add_node("sub_router", sub_router)
    workflow.add_edge(START, "sub_router")
    
    needed_roles = list({t.assignee_role for t in processed_tasks.values() if t.assignee_role})
    if not needed_roles:
        return "Research agent failed to recommend roles."
        
    for r in needed_roles:
        node_name = f"subworker_{r}"
        workflow.add_node(node_name, make_level3_worker_node(r))
        workflow.add_edge(node_name, "sub_router")
        
    workflow.add_conditional_edges("sub_router", sub_router, [f"subworker_{r}" for r in needed_roles] + [END])
    
    app = workflow.compile()
    
    try:
        final_state = app.invoke(sub_state)
        synthesis = "Sub-worker results:\n"
        for t in final_state["sub_tasks"].values():
            synthesis += f"- [{t.assignee_role}]: {t.result}\n"
        return synthesis
    except Exception as e:
        return f"Sub-orchestration failed: {str(e)}"

def make_specialist_worker_node(agent_data: dict):
    role = agent_data["role"]
    agent_id = agent_data["id"]
    
    analyzer = get_complexity_analyzer(role)
    researcher = get_research_agent()
    
    llm = ChatOpenAI(
        model="accounts/fireworks/models/kimi-k3" if settings.FIREWORKS_API_KEY else "gpt-4o",
        api_key=settings.FIREWORKS_API_KEY or settings.OPENAI_API_KEY,
        base_url="https://api.fireworks.ai/inference/v1" if settings.FIREWORKS_API_KEY else None
    )
    tools = registry.get_langchain_tools(role)
    worker_agent = create_react_agent(llm, tools, state_modifier=f"You are {agent_data['name']}, acting as a {role}. Execute the task directly.")
    
    def node_func(state: OrchestratorState):
        task = None
        for t in state.get("task_graph", {}).values():
            if t.assignee_id == agent_id and t.status == "running":
                task = t
                break
                
        if not task:
            return {}
            
        try:
            decision = analyzer.invoke({"task_description": task.description})
            
            final_output = ""
            if decision.decision == "spawn_subworkers":
                plan = researcher.invoke({
                    "task_description": task.description, 
                    "context": str(state.get("shared_context", {}))
                })
                final_output = execute_sub_orchestration(state.get("business_id", "unknown"), task, plan)
            else:
                res = worker_agent.invoke({"messages": state.get("messages", []) + [HumanMessage(content=task.description)]})
                final_output = res["messages"][-1].content
                
            task_service.update_task_result(task.id, final_output)
            
            updated_task = task.copy()
            updated_task.status = "completed"
            updated_task.result = final_output
            status_to_return = "completed"
            
        except Exception as e:
            import traceback
            err_msg = traceback.format_exc()
            task_service.update_task_status(task.id, "failed")
            task_service.update_task_result(task.id, f"Worker crashed: {str(e)}\n\n{err_msg}")
            
            updated_task = task.copy()
            updated_task.status = "failed"
            updated_task.result = f"Worker crashed: {str(e)}"
            final_output = updated_task.result
            status_to_return = "failed"
            
        worker_result = WorkerResult(
            task_id=task.id,
            agent_id=agent_id,
            role=role,
            status=status_to_return,
            output=final_output
        )
        
        return {
            "task_graph": {task.id: updated_task},
            "worker_results": [worker_result],
            "messages": [AIMessage(content=f"Worker {role} finished task '{task.description}': {final_output}")]
        }
        
    return node_func
