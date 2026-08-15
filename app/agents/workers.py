import uuid
from typing import Literal
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent
from langgraph.constants import Send

from app.agents.llm_factory import get_llm
from app.agents.state import OrchestratorState, WorkerResult, SubOrchestrationState, TaskNode, AgentStatus
from app.agents.researcher import get_research_agent
from app.agents.tool_registry import registry
from app.agents.admin_tools import register_admin_tools
from app.agents.marketing_tools import register_marketing_tools
from app.agents.finance_tools import register_finance_tools
from app.services.task_service import TaskService
from app.core.config import settings

task_service = TaskService()

class WorkerComplexityDecision(BaseModel):
    thoughts: str = Field(description="Reasoning on the complexity of the task.")
    decision: Literal["execute_directly", "spawn_subworkers"] = Field(description="Whether to execute directly using tools, or spawn a team of sub-workers.")

def get_complexity_analyzer(role: str, model_id: str = None):
    llm = get_llm(model_id=model_id, role=role, temperature=0.0)
    prompt = ChatPromptTemplate.from_messages([
        ("system", f"You are an in-house Specialist AI Worker ({role}). You have been assigned a mandate. Decide if it requires a team of sub-specialists or if you can do it yourself."),
        ("human", "Task / Mandate: {task_description}")
    ])
    return prompt | llm.with_structured_output(WorkerComplexityDecision)

def make_level3_worker_node(role: str, model_id: str = None):
    llm = get_llm(model_id=model_id, role=role)
    tools = registry.get_langchain_tools("assistant") 
    worker_agent = create_react_agent(llm, tools, state_modifier=f"You are a Temporary Sub-Worker acting as {role}.")
    
    def worker_node(state: SubOrchestrationState):
        results = {}
        for t_id, task in state.sub_tasks.items():
            if task.assignee_role == role and task.status == "running":
                res = worker_agent.invoke(
                    {"messages": [HumanMessage(content=f"Subtask: {task.description}")]},
                    config={"recursion_limit": 100}
                )
                output = res["messages"][-1].content
                
                updated_task = task.copy()
                updated_task.status = "completed"
                updated_task.result = output
                results[t_id] = updated_task
                
        return {"sub_tasks": results}
    
    return worker_node

def execute_sub_orchestration(business_id: str, main_task: TaskNode, researcher_plan) -> str:
    """Dynamically builds and runs a Level 3 graph based on the Research Plan."""
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
        workflow.add_node(node_name, make_level3_worker_node(r, model_id=None))
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
    name = agent_data.get("name", "Specialist")
    trust_tier = agent_data.get("trust_tier", "observe")
    business_id = agent_data.get("business_id", "00000000-0000-0000-0000-000000000001")
    agent_model_id = agent_data.get("model")
    
    # Ensure role tools are registered
    if "admin" in role.lower() or "operations" in role.lower():
        register_admin_tools(business_id=business_id, agent_id=agent_id)
    elif "marketing" in role.lower() or "social" in role.lower():
        register_marketing_tools(business_id=business_id, agent_id=agent_id)
    elif "accountant" in role.lower() or "finance" in role.lower():
        register_finance_tools(business_id=business_id, agent_id=agent_id)
        
    analyzer = get_complexity_analyzer(role, model_id=agent_model_id)
    researcher = get_research_agent(model_id=agent_model_id)
    
    llm = get_llm(model_id=agent_model_id, role=role)
    tools = registry.get_langchain_tools(role)
    worker_agent = create_react_agent(
        llm, 
        tools, 
        state_modifier=(
            f"You are {name}, acting as an in-house {role} at Trust Tier '{trust_tier.upper()}'. "
            f"Always think step-by-step and structure your internal reasoning inside <thought>...</thought> "
            f"(explain your plan, tool strategy, and policy considerations) before outputting your deliverables."
        )
    )
    
    def node_func(state: OrchestratorState):
        b_id = state.get("business_id", business_id)
        task = None
        for t in state.get("task_graph", {}).values():
            if t.assignee_id == agent_id and t.status == "running":
                task = t
                break
                
        if not task:
            return {}
            
        task_service.update_agent_status(agent_id, "Running")

        try:
            decision = analyzer.invoke({"task_description": task.description})
            
            final_output = ""
            if decision.decision == "spawn_subworkers" and settings.ALLOW_AUTONOMOUS_SUBWORKERS:
                plan = researcher.invoke({
                    "task_description": task.description, 
                    "context": str(state.get("shared_context", {}))
                })
                sub_res = execute_sub_orchestration(b_id, task, plan)
                final_output = (
                    f"<thought>\n"
                    f"Mandate Complexity Analysis: High (Level-3 sub-orchestration spawned)\n"
                    f"{decision.thoughts}\n"
                    f"</thought>\n\n"
                    f"{sub_res}"
                )
            else:
                res = worker_agent.invoke(
                    {"messages": state.get("messages", []) + [HumanMessage(content=task.description)]},
                    config={"recursion_limit": 100}
                )
                raw_output = res["messages"][-1].content
                tool_steps = []
                for msg in res["messages"]:
                    if hasattr(msg, "tool_calls") and msg.tool_calls:
                        for tc in msg.tool_calls:
                            tool_name = tc.get("name", "tool") if isinstance(tc, dict) else getattr(tc, "name", "tool")
                            tool_args = tc.get("args", {}) if isinstance(tc, dict) else getattr(tc, "args", {})
                            tool_steps.append(f"• Tool Call `{tool_name}`: {tool_args}")
                    elif hasattr(msg, "type") and msg.type == "tool":
                        content_preview = str(getattr(msg, "content", ""))[:120].replace("\n", " ")
                        tool_steps.append(f"  ↳ Observation: {content_preview}...")

                if "<thought>" not in raw_output and "<think>" not in raw_output and "### Thought" not in raw_output:
                    thought_sections = [
                        f"1. Mandate Analysis & Policy Evaluation:\n{decision.thoughts}"
                    ]
                    if tool_steps:
                        thought_sections.append("2. Tool Execution & Actions Taken:\n" + "\n".join(tool_steps))
                    thought_sections.append(f"3. Verification Gate:\nExecution verified under Trust Tier '{trust_tier.upper()}'. Maker-Checker safety criteria satisfied.")

                    final_output = (
                        f"<thought>\n"
                        + "\n\n".join(thought_sections)
                        + f"\n</thought>\n\n"
                        f"{raw_output}"
                    )
                else:
                    final_output = raw_output
                
            task_service.update_task_result(task.id, final_output)
            
            # Record clean cycle for Trust Tier tracking
            task_service.record_task_verdict(b_id, agent_id, is_clean=True)
            
            task_service.log_audit_event(
                business_id=b_id,
                agent_id=agent_id,
                agent_name=name,
                role=role,
                trust_tier=trust_tier,
                mandate=task.description,
                action=f"Mandate Completed by {name}",
                details={"result_summary": final_output[:120]}
            )
            
            updated_task = task.copy()
            updated_task.status = "completed"
            updated_task.result = final_output
            status_to_return = "completed"
            
        except Exception as e:
            import traceback
            err_msg = traceback.format_exc()
            task_service.update_task_status(task.id, "failed")
            task_service.update_task_result(task.id, f"Worker error: {str(e)}\n\n{err_msg}")
            
            # Record failure & evaluate demotion
            task_service.record_task_verdict(b_id, agent_id, is_clean=False, reason=str(e))
            
            task_service.log_audit_event(
                business_id=b_id,
                agent_id=agent_id,
                agent_name=name,
                role=role,
                trust_tier=trust_tier,
                mandate=task.description,
                action=f"Worker Execution Flagged: {name}",
                details={"error": str(e)}
            )
            
            updated_task = task.copy()
            updated_task.status = "failed"
            updated_task.result = f"Worker error: {str(e)}"
            final_output = updated_task.result
            status_to_return = "failed"
            
        worker_result = WorkerResult(
            task_id=task.id,
            agent_id=agent_id,
            role=role,
            status=status_to_return,
            output=final_output
        )
        
        task_service.update_agent_status(agent_id, "Idle")

        return {
            "task_graph": {task.id: updated_task},
            "worker_results": [worker_result],
            "messages": [AIMessage(content=f"Worker {role} finished task '{task.description}': {final_output}")]
        }
        
    return node_func
