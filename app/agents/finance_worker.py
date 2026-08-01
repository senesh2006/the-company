import json
from typing import TypedDict, Annotated, List, Literal, Optional
from langchain_core.messages import AnyMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent
import operator

from app.core.config import settings
from app.agents.state import OrchestratorState, WorkerResult, TaskNode
from app.agents.workers import execute_sub_orchestration, task_service, get_research_agent
from app.agents.finance_tools import register_finance_tools
from app.agents.tool_registry import registry

SYSTEM_PROMPT = """You are the Finance Agent for a company.

Your job is to manage the company’s finances with maximum accuracy, transparency, and caution.

Core Rules:
- Accuracy is non-negotiable. Never guess numbers.
- Never send money, make payments, issue refunds, or approve transfers without human approval unless the amount is within a pre-approved low-risk limit stored in Shared Memory.
- Always check Shared Memory first for financial policies, approval limits, account details, and recent transactions.
- Keep clean, auditable records at all times.
- Clearly state data sources and assumptions in every report.
- Immediately flag any unusual transactions, discrepancies, or risks.
- When in doubt, escalate rather than take action.
- After every significant action, update Shared Memory with the latest financial state.

How you work:
1. Understand the task completely
2. Load relevant financial context from Shared Memory
3. Create a careful plan
4. Execute using only approved tools
5. Reflect deeply on accuracy and risk
6. Return a structured result with confidence and risk level

When to become Temporary Supervisor:
- For complex tasks such as monthly close, tax preparation, multi-account reconciliation, or financial forecasting, you may spawn and orchestrate sub-workers (e.g. Bookkeeper, Reconciler, Financial Analyst).
- Any real money movement with confidence below 0.9 must be escalated to a human.

You are precise, skeptical, highly responsible, and protective of the company’s money."""

class FinanceWorkerState(TypedDict):
    business_id: str
    task: TaskNode
    messages: Annotated[list[AnyMessage], operator.add]
    shared_context: dict
    plan: str
    observations: str
    confidence: float
    risk_level: Literal["low", "medium", "high"]
    side_effects: list[str]
    status: str
    cost: float
    final_output: str
    needs_sub_workers: bool

def get_llm():
    return ChatOpenAI(
        model="accounts/fireworks/models/kimi-k3" if settings.FIREWORKS_API_KEY else "gpt-4o",
        api_key=settings.FIREWORKS_API_KEY or settings.OPENAI_API_KEY,
        base_url="https://api.fireworks.ai/inference/v1" if settings.FIREWORKS_API_KEY else None,
        temperature=0.0 # Extremely low temperature for finance tasks
    )

def understand_and_context(state: FinanceWorkerState):
    """Understand Task -> Load context from Shared Memory."""
    llm = get_llm()
    context = str(state.get("shared_context", {}))
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Task: {task}\nShared Context: {context}\nAnalyze the task. Is this a complex task (e.g. tax prep, monthly close) that requires spawning sub-workers? Output JSON with 'analysis' and 'needs_sub_workers' (boolean).")
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

def create_plan(state: FinanceWorkerState):
    """Create careful plan."""
    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Task: {task}\nObservations: {observations}\nWrite a highly detailed, step-by-step execution plan focusing on safety, audits, and accuracy using the allowed MCP tools.")
    ])
    res = llm.invoke(prompt.format(task=state["task"].description, observations=state["observations"]))
    return {"plan": res.content}

def act(state: FinanceWorkerState):
    """Act using the React agent with restricted Finance tools."""
    llm = get_llm()
    tools = registry.get_langchain_tools("Finance Manager")
    
    react_agent = create_react_agent(llm, tools, state_modifier=SYSTEM_PROMPT)
    
    messages = [HumanMessage(content=f"Execute this careful plan:\n{state['plan']}")]
    res = react_agent.invoke({"messages": messages}, config={"recursion_limit": 50})
    
    return {"messages": [res["messages"][-1]], "final_output": res["messages"][-1].content}

def reflect(state: FinanceWorkerState):
    """Reflect on accuracy, risk, and side effects."""
    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Task: {task}\nPlan: {plan}\nExecution Output: {output}\nReflect on accuracy and risks. Produce JSON with 'confidence' (0.0 to 1.0), 'risk_level' ('low', 'medium', 'high'), 'side_effects' (list of strings like 'Initiated $500 transfer', 'Created invoice'), and 'reflection'.")
    ])
    res = llm.invoke(prompt.format(task=state["task"].description, plan=state["plan"], output=state["final_output"]))
    try:
        data = json.loads(res.content.replace("```json", "").replace("```", "").strip())
        confidence = float(data.get("confidence", 0.9))
        risk_level = data.get("risk_level", "medium")
        side_effects = data.get("side_effects", [])
    except:
        confidence = 0.8
        risk_level = "high"
        side_effects = ["Failed to parse reflection JSON"]
        
    status = "needs_human" if (confidence < 0.9 or risk_level == "high") else "success"
    return {"confidence": confidence, "risk_level": risk_level, "side_effects": side_effects, "status": status}

def update_memory(state: FinanceWorkerState):
    """Update Shared Memory with audit trail."""
    from app.services.shared_memory import SharedMemoryService
    mem = SharedMemoryService()
    mem.set(state["business_id"], f"finance_result_{state['task'].id}", {
        "output": state["final_output"],
        "confidence": state["confidence"],
        "risk_level": state["risk_level"],
        "side_effects": state["side_effects"]
    }, tags=["finance", "audit"])
    return {}

def decide(state: FinanceWorkerState) -> Literal["spawn_subworkers", "END"]:
    if state["needs_sub_workers"]:
        return "spawn_subworkers"
    return "END"

def spawn_subworkers(state: FinanceWorkerState):
    """Switch to Temporary Supervisor mode and spawn financial sub-workers."""
    researcher = get_research_agent()
    plan = researcher.invoke({
        "task_description": f"Plan a financial execution strategy for this complex task involving sub-workers like Bookkeeper, Reconciler, and Analyst: {state['task'].description}",
        "context": str(state.get("shared_context", {}))
    })
    
    final_output = execute_sub_orchestration(state["business_id"], state["task"], plan)
    
    return {
        "final_output": f"Spawned Financial Sub-Workers Output:\n{final_output}",
        "status": "success",
        "confidence": 1.0,
        "risk_level": "medium",
        "side_effects": ["Spawned financial sub-workers"]
    }

# Build the LangGraph for the Finance Worker
workflow = StateGraph(FinanceWorkerState)
workflow.add_node("understand_and_context", understand_and_context)
workflow.add_node("create_plan", create_plan)
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

finance_worker_app = workflow.compile()

def make_finance_worker_node(agent_data: dict):
    """
    Wraps the FinanceWorker LangGraph into a node compatible with the main OrchestratorGraph.
    """
    role = agent_data["role"]
    agent_id = agent_data["id"]
    
    def node_func(state: OrchestratorState):
        task = None
        for t in state.get("task_graph", {}).values():
            if t.assignee_id == agent_id and t.status == "running":
                task = t
                break
                
        if not task:
            return {}
            
        business_id = state.get("business_id", "default_business")
        
        # Ensure tools are registered
        register_finance_tools(business_id=business_id, agent_id=agent_id, task_id=task.id)
        
        worker_state = FinanceWorkerState(
            business_id=business_id,
            task=task,
            messages=[],
            shared_context=state.get("shared_context", {}),
            plan="",
            observations="",
            confidence=0.0,
            risk_level="high",
            side_effects=[],
            status="running",
            cost=0.0,
            final_output="",
            needs_sub_workers=False
        )
        
        try:
            final_state = finance_worker_app.invoke(worker_state)
            
            final_output = final_state["final_output"]
            status = final_state["status"]
            confidence = final_state["confidence"]
            risk_level = final_state["risk_level"]
            side_effects = final_state["side_effects"]
            
            # Formulate structured reasoning summary
            reasoning_summary = f"Confidence: {confidence} | Risk Level: {risk_level}\nSide Effects: {side_effects}"
            
            task_service.update_task_result(task.id, final_output)
            task_service.update_task_status(task.id, status)
            
            updated_task = task.copy()
            updated_task.status = status if status in ["completed", "failed"] else "completed" 
            updated_task.result = final_output
            
        except Exception as e:
            import traceback
            err_msg = traceback.format_exc()
            task_service.update_task_status(task.id, "failed")
            task_service.update_task_result(task.id, f"Finance Worker crashed: {str(e)}")
            
            updated_task = task.copy()
            updated_task.status = "failed"
            updated_task.result = f"Worker crashed: {str(e)}"
            final_output = updated_task.result
            status = "failed"
            confidence = 0.0
            risk_level = "high"
            side_effects = ["Crash"]
            reasoning_summary = "Crashed during execution."
            
        worker_result = WorkerResult(
            task_id=task.id,
            agent_id=agent_id,
            role=role,
            status=status,
            output=final_output,
            cost=0.0
        )
        
        formatted_output = f"Result:\n{final_output}\n\nMetrics:\nStatus: {status}\nConfidence: {confidence:.2f}\nRisk Level: {risk_level}\nSide Effects: {side_effects}\nReasoning: {reasoning_summary}"
        worker_result.output = formatted_output
        
        return {
            "task_graph": {task.id: updated_task},
            "worker_results": [worker_result],
            "messages": [AIMessage(content=f"Finance Manager finished task '{task.description}':\n{formatted_output}")]
        }
        
    return node_func
