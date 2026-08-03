import json
from typing import TypedDict, Annotated, List, Literal, Optional
from langchain_core.messages import AnyMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent
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

def understand_and_context(state: EngineeringWorkerState):
    """Understand Task -> Load context from Shared Memory."""
    llm = get_engineering_llm(model_id=state.get("model_id"))
    context = str(state.get("shared_context", {}))
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Task: {task}\nShared Context: {context}\nAnalyze the engineering task. Does this require spawning sub-workers (e.g., Frontend, Backend, QA)? Output JSON with 'analysis' and 'needs_sub_workers' (boolean).")
    ])
    
    res = llm.invoke(prompt.format(task=state["task"].description, context=context))
    try:
        data = json.loads(res.content.replace("```json", "").replace("```", "").strip())
        needs_sub_workers = data.get("needs_sub_workers", False)
        analysis = data.get("analysis", "")
    except:
        needs_sub_workers = False
        analysis = "Could not parse JSON. Proceeding manually."

    return {"observations": analysis, "needs_sub_workers": needs_sub_workers}

def plan(state: EngineeringWorkerState):
    """Plan technical implementation."""
    llm = get_engineering_llm(model_id=state.get("model_id"))
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Task: {task}\nObservations: {observations}\nWrite a technical execution plan including file modifications, test requirements, and architecture strategy.")
    ])
    res = llm.invoke(prompt.format(task=state["task"].description, observations=state["observations"]))
    return {"plan": res.content}

def act(state: EngineeringWorkerState):
    """Act using the React agent with engineering tools."""
    llm = get_engineering_llm(model_id=state.get("model_id"))
    role = state["task"].assignee_role or "Coder"
    tools = registry.get_langchain_tools(role)
    if not tools:
        tools = registry.get_langchain_tools("assistant")
    
    react_agent = create_react_agent(llm, tools, state_modifier=SYSTEM_PROMPT)
    
    messages = [HumanMessage(content=f"Execute this technical plan:\n{state['plan']}")]
    res = react_agent.invoke({"messages": messages}, config={"recursion_limit": 50})
    
    return {"messages": [res["messages"][-1]], "final_output": res["messages"][-1].content}

def reflect(state: EngineeringWorkerState):
    """Reflect on code quality, testing, and potential risks."""
    llm = get_engineering_llm(model_id=state.get("model_id"))
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Task: {task}\nPlan: {plan}\nExecution Output: {output}\nReflect on code quality and correctness. Produce JSON with 'confidence' (0.0 to 1.0), 'side_effects' (list of strings like 'Created file', 'Updated schema'), and 'reflection'.")
    ])
    res = llm.invoke(prompt.format(task=state["task"].description, plan=state["plan"], output=state["final_output"]))
    try:
        data = json.loads(res.content.replace("```json", "").replace("```", "").strip())
        confidence = float(data.get("confidence", 0.9))
        side_effects = data.get("side_effects", [])
    except:
        confidence = 0.9
        side_effects = []
        
    status = "needs_human" if confidence < 0.85 else "success"
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
    if state["needs_sub_workers"]:
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

# Build the LangGraph for the Engineering Worker
workflow = StateGraph(EngineeringWorkerState)
workflow.add_node("understand_and_context", understand_and_context)
workflow.add_node("create_plan", plan)
workflow.add_node("act", act)
workflow.add_node("reflect", reflect)
workflow.add_node("update_memory", update_memory)
workflow.add_node("spawn_subworkers", spawn_subworkers)

workflow.add_edge(START, "understand_and_context")
workflow.add_conditional_edges("understand_and_context", decide, {
    "spawn_subworkers": "spawn_subworkers",
    "END": "create_plan"
})
workflow.add_edge("create_plan", "act")
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
            
        business_id = state.get("business_id", "default_business")
        
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
            
            final_output = final_state["final_output"]
            status = final_state["status"]
            confidence = final_state["confidence"]
            side_effects = final_state["side_effects"]
            
            reasoning_summary = f"Confidence: {confidence}\nSide Effects: {side_effects}"
            
            task_service.update_task_result(task.id, final_output)
            task_service.update_task_status(task.id, status)
            
            updated_task = task.copy()
            updated_task.status = status if status in ["completed", "failed"] else "completed" 
            updated_task.result = final_output
            
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
