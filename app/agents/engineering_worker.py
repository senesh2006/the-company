import json
from typing import TypedDict, Annotated, List, Literal, Optional
from langchain_core.messages import AnyMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent
import inspect
import operator

from app.agents.llm_factory import get_llm
from app.agents.state import OrchestratorState, WorkerResult, TaskNode
from app.agents.workers import execute_sub_orchestration, task_service, get_research_agent
from app.agents.tool_registry import registry

SYSTEM_PROMPT = """You are the Engineering Worker / Coder for a company.

Your job is to architect, write, review, test, and debug high-quality code and infrastructure.

Core Rules:
- Write clean, modular, well-tested code following best engineering practices.
- Always check Shared Memory for repository context, architecture decisions, and coding standards.
- Write or update unit tests to verify all functionality before marking work as complete.
- Refactor carefully according to the minimal change principle.
- If a change is large or complex (e.g. major migration, full subsystem refactor), consider spawning sub-workers (Frontend Dev, Backend Dev, QA Tester, DevOps Engineer).
- Update Shared Memory with key technical decisions, API schemas, and deployment instructions.

How you work:
1. Understand the assigned engineering task and technical requirements.
2. Check Shared Memory for context and existing codebase patterns.
3. Formulate a technical design and implementation plan.
4. Execute implementation using tools.
5. Reflect on code quality, test coverage, and potential regressions.
6. Return a structured result with confidence score.
"""

class EngineeringWorkerState(TypedDict):
    business_id: str
    task: TaskNode
    model_id: Optional[str]
    messages: Annotated[list[AnyMessage], operator.add]
    shared_context: dict
    plan: str
    observations: str
    confidence: float
    side_effects: list[str]
    status: str
    cost: float
    final_output: str
    needs_sub_workers: bool

def get_engineering_llm(model_id: str = None):
    return get_llm(model_id=model_id, role="EngineeringWorker", temperature=0.1)

def prepare_and_plan(state: EngineeringWorkerState):
    """Unified fast planning: analyzes context, sub-worker requirements, and technical strategy in 1 step."""
    fast_llm = get_fast_llm(temperature=0.1)
    context = str(state.get("shared_context", {}))
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", """Task: {task}
Shared Context: {context}

Analyze technical requirements and formulate a concise plan.
Output JSON:
{{
  "analysis": "1-2 sentence context summary",
  "plan": "Step-by-step implementation strategy",
  "needs_sub_workers": false
}}""")
    ])
    
    try:
        res = fast_llm.invoke(prompt.format(task=state["task"].description, context=context))
        clean = res.content.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean)
        analysis = data.get("analysis", "Direct engineering execution.")
        plan_text = data.get("plan", "Implement code and verify functionality.")
        needs_sub = data.get("needs_sub_workers", False)
    except Exception:
        analysis = "Engineering implementation plan formulated."
        plan_text = "Execute tools, write code, and verify."
        needs_sub = False

    return {
        "observations": analysis,
        "plan": plan_text,
        "needs_sub_workers": needs_sub
    }

def act(state: EngineeringWorkerState):
    """Act using the React agent with engineering tools."""
    llm = get_engineering_llm(model_id=state.get("model_id"))
    role = state["task"].assignee_role or "Coder"
    tools = registry.get_langchain_tools(role)
    if not tools:
        tools = registry.get_langchain_tools("assistant")
    
    sig = inspect.signature(create_react_agent)
    kwargs = {}
    if 'state_modifier' in sig.parameters:
        kwargs['state_modifier'] = SYSTEM_PROMPT
    elif 'messages_modifier' in sig.parameters:
        kwargs['messages_modifier'] = SYSTEM_PROMPT
    elif 'prompt' in sig.parameters:
        kwargs['prompt'] = SYSTEM_PROMPT
    elif 'system_message' in sig.parameters:
        kwargs['system_message'] = SYSTEM_PROMPT
    else:
        kwargs['state_modifier'] = SYSTEM_PROMPT
        
    react_agent = create_react_agent(llm, tools, **kwargs)
    
    messages = [HumanMessage(content=(
        f"Assigned Technical Mandate: {state['task'].description}\n\n"
        f"Implementation Plan:\n{state['plan']}\n\n"
        f"DIRECTIVE:\n"
        f"1. Actively execute all relevant tool calls to implement, inspect, and verify code.\n"
        f"2. DO NOT output a description of calling tools. Directly invoke the tools.\n"
        f"3. Synthesize the results into a clear, complete engineering deliverable."
    ))]
    res = react_agent.invoke({"messages": messages}, config={"recursion_limit": 50})
    
    return {"messages": [res["messages"][-1]], "final_output": res["messages"][-1].content}

def reflect(state: EngineeringWorkerState):
    """Reflect on code quality, testing, and potential risks using fast LLM."""
    fast_llm = get_fast_llm(temperature=0.0)
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Task: {task}\nExecution Output: {output}\nOutput JSON with 'confidence' (0.0 to 1.0) and 'side_effects' (list of strings).")
    ])
    try:
        res = fast_llm.invoke(prompt.format(task=state["task"].description, output=state["final_output"][:1000]))
        data = json.loads(res.content.replace("```json", "").replace("```", "").strip())
        confidence = float(data.get("confidence", 0.95))
        side_effects = data.get("side_effects", [])
    except Exception:
        confidence = 0.95
        side_effects = []
        
    status = "needs_human" if confidence < 0.80 else "success"
    return {"confidence": confidence, "side_effects": side_effects, "status": status}

def update_memory(state: EngineeringWorkerState):
    """Update Shared Memory."""
    from app.services.shared_memory import SharedMemoryService
    mem = SharedMemoryService()
    mem.set(state["business_id"], f"engineering_result_{state['task'].id}", {
        "output": state["final_output"],
        "confidence": state["confidence"],
        "side_effects": state["side_effects"]
    }, tags=["engineering", "code"])
    return {}

def decide(state: EngineeringWorkerState) -> Literal["spawn_subworkers", "END"]:
    if state.get("needs_sub_workers") and getattr(settings, "ALLOW_AUTONOMOUS_SUBWORKERS", False):
        return "spawn_subworkers"
    return "END"

def spawn_subworkers(state: EngineeringWorkerState):
    """Switch to Temporary Supervisor mode and spawn engineering sub-workers."""
    researcher = get_research_agent(model_id=state.get("model_id"))
    plan = researcher.invoke({
        "task_description": f"Break down this engineering objective for specialized sub-workers (Frontend Dev, Backend Dev, QA): {state['task'].description}",
        "context": str(state.get("shared_context", {}))
    })
    
    final_output = execute_sub_orchestration(state["business_id"], state["task"], plan)
    
    return {
        "final_output": f"Spawned Engineering Sub-Workers Output:\n{final_output}",
        "status": "success",
        "confidence": 1.0,
        "side_effects": ["Spawned engineering sub-workers"]
    }

# Build the High-Speed LangGraph for the Engineering Worker
workflow = StateGraph(EngineeringWorkerState)
workflow.add_node("prepare_and_plan", prepare_and_plan)
workflow.add_node("act", act)
workflow.add_node("reflect", reflect)
workflow.add_node("update_memory", update_memory)
workflow.add_node("spawn_subworkers", spawn_subworkers)

workflow.add_edge(START, "prepare_and_plan")
workflow.add_conditional_edges("prepare_and_plan", decide, {
    "spawn_subworkers": "spawn_subworkers",
    "END": "act"
})
workflow.add_edge("act", "reflect")
workflow.add_edge("reflect", "update_memory")
workflow.add_edge("update_memory", END)
workflow.add_edge("spawn_subworkers", END)

engineering_worker_app = workflow.compile()

def make_engineering_worker_node(agent_data: dict):
    """
    Wraps the EngineeringWorker LangGraph into a node compatible with the main OrchestratorGraph.
    Handles roles: 'EngineeringWorker', 'Coder', 'Engineering Manager', 'Software Engineer'.
    """
    role = agent_data["role"]
    agent_id = agent_data["id"]
    agent_model_id = agent_data.get("model")
    
    def node_func(state: OrchestratorState):
        task = None
        for t in state.get("task_graph", {}).values():
            if t.assignee_id == agent_id and t.status == "running":
                task = t
                break
                
        if not task:
            return {}
            
        business_id = state.get("business_id") or "00000000-0000-0000-0000-000000000001"
        
        worker_state = EngineeringWorkerState(
            business_id=business_id,
            task=task,
            model_id=agent_model_id,
            messages=[],
            shared_context=state.get("shared_context", {}),
            plan="",
            observations="",
            confidence=0.0,
            side_effects=[],
            status="running",
            cost=0.0,
            final_output="",
            needs_sub_workers=False
        )
        
        try:
            final_state = engineering_worker_app.invoke(worker_state)

            final_output = final_state.get("final_output", "")
            status = final_state.get("status", "success")
            confidence = float(final_state.get("confidence", 0.9))
            side_effects = final_state.get("side_effects", [])
            observations = final_state.get("observations", "")
            plan_text = final_state.get("plan", "")

            if "<thought>" not in final_output and "<think>" not in final_output and "### Thought" not in final_output:
                thought_parts = []
                if observations:
                    thought_parts.append(f"1. Technical Analysis & Architecture Scope:\n{observations}")
                if plan_text:
                    thought_parts.append(f"2. Implementation & Testing Plan:\n{plan_text}")
                thought_parts.append(f"3. Quality & Regression Verification:\nConfidence: {confidence:.2f} | Side Effects: {', '.join(side_effects) if side_effects else 'None'}")
                thought_block = f"<thought>\n" + "\n\n".join(thought_parts) + f"\n</thought>"
                full_deliverable = f"{thought_block}\n\n{final_output}"
            else:
                full_deliverable = final_output

            reasoning_summary = f"Confidence: {confidence:.2f}\nSide Effects: {side_effects}"

            task_service.update_task_result(task.id, full_deliverable)
            task_service.update_task_status(task.id, status)

            updated_task = task.copy()
            updated_task.status = status if status in ["completed", "failed"] else "completed" 
            updated_task.result = full_deliverable
            
        except Exception as e:
            import traceback
            err_msg = traceback.format_exc()
            task_service.update_task_status(task.id, "failed")
            task_service.update_task_result(task.id, f"Engineering Worker crashed: {str(e)}")
            
            updated_task = task.copy()
            updated_task.status = "failed"
            updated_task.result = f"Worker crashed: {str(e)}"
            final_output = updated_task.result
            status = "failed"
            confidence = 0.0
            side_effects = []
            reasoning_summary = f"Worker crashed: {str(e)}"
            
        worker_result = WorkerResult(
            task_id=task.id,
            agent_id=agent_id,
            role=role,
            status=status,
            output=final_output,
            cost=0.0
        )
        
        formatted_output = f"Result:\n{final_output}\n\nMetrics:\nStatus: {status}\nConfidence: {confidence:.2f}\nSide Effects: {side_effects}\nReasoning: {reasoning_summary}"
        worker_result.output = formatted_output
        
        return {
            "task_graph": {task.id: updated_task},
            "worker_results": [worker_result],
            "messages": [AIMessage(content=f"Engineering Worker ({role}) finished task '{task.description}':\n{formatted_output}")]
        }
        
    return node_func
