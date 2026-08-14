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
from app.agents.marketing_tools import register_marketing_tools
from app.agents.tool_registry import registry

SYSTEM_PROMPT = """You are the Marketing Hub Director for Company OS.

Your mandate is to handle all growth, competitive intelligence, paid acquisition, social, and SEO operations with data rigor, high brand standards, and concrete execution. You operate dynamically across specialized personas.

Core Operating Principles:
- Data-driven analysis over generic claims. Always anchor strategy in real tool metrics.
- Active Tool Execution: Whenever a task requires competitive research, SEO analysis, social monitoring, or paid media metrics, you MUST actively call your tools (e.g. `seo_tracker`, `brave_search`, `social_monitor`, `paid_media`, `notion_workspace`).
- NEVER output mere descriptions of tool calls (e.g. NEVER output "The function call to X will provide..."). Actually invoke the tool, process the response data, and produce a complete, polished executive deliverable.
- Provide structured, high-value deliverables with markdown tables, key metric callouts, and strategic action plans.

Specialized Personas & Tool Capabilities:
1. **Competitive Intelligence Analyst**: Monitors competitor launches, audits positioning, and tracks organic momentum (`brave_search`, `seo_tracker`).
2. **SEO / AEO Auditor**: Tracks keyword rankings, technical SEO issues, and AI-prompt visibility (`seo_tracker`).
3. **Paid Media & Creative Strategist**: Pulls live channel metrics (LinkedIn/Google Ads) and suggests budget reallocation (`paid_media`).
4. **Social Media & Events Monitor**: Scans leadership feeds for compelling events and outreach opportunities (`social_monitor`).
5. **Community Operations & Content**: Content calendars and nurture sequences (`notion_workspace`, `read_google_sheet`).

Generative UI Component Rendering (`render_ui`):
When producing performance summaries or audits, use the `render_ui` tool (or output an ```agent-ui block) to render live dashboard widgets for the founder:
- StatCard, LineChart, BarChart, Table, FunnelChart, PieChart."""

class MarketingWorkerState(TypedDict):
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

def get_marketing_llm(model_id: str = None):
    return get_llm(model_id=model_id, role="Marketing Manager", temperature=0.2)

def understand_and_context(state: MarketingWorkerState):
    """Understand Task -> Load context from Shared Memory."""
    llm = get_marketing_llm(model_id=state.get("model_id"))
    context = str(state.get("shared_context", {}))
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Task: {task}\nShared Context: {context}\nAnalyze the task. Do we need to spawn sub-workers for a large campaign? Output a JSON with 'analysis', and 'needs_sub_workers' (boolean).")
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

def plan(state: MarketingWorkerState):
    """Plan."""
    llm = get_marketing_llm(model_id=state.get("model_id"))
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Task / Mandate: {task}\nObservations: {observations}\nWrite a clear step-by-step execution plan specifying which tools to invoke and what deliverables to produce.")
    ])
    res = llm.invoke(prompt.format(task=state["task"].description, observations=state["observations"]))
    return {"plan": res.content}

def act(state: MarketingWorkerState):
    """Act using the React agent with MCP tools."""
    llm = get_marketing_llm(model_id=state.get("model_id"))
    tools = registry.get_langchain_tools("Marketing Manager")
    
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
        f"Assigned Mandate: {state['task'].description}\n\n"
        f"Execution Plan:\n{state['plan']}\n\n"
        f"DIRECTIVE:\n"
        f"1. Actively execute all relevant tool calls to gather real data.\n"
        f"2. DO NOT output a description of calling tools. Directly invoke the tools and use their data.\n"
        f"3. Synthesize the findings into a complete, high-quality strategic report with executive commentary, structured tables/metrics, and concrete recommendations."
    ))]
    res = react_agent.invoke({"messages": messages}, config={"recursion_limit": 50})
    
    return {"messages": [res["messages"][-1]], "final_output": res["messages"][-1].content}

def reflect(state: MarketingWorkerState):
    """Reflect on quality and alignment."""
    llm = get_marketing_llm(model_id=state.get("model_id"))
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Task: {task}\nPlan: {plan}\nExecution Output: {output}\nReflect on the brand alignment. Produce JSON with 'confidence' (0.0 to 1.0), 'side_effects' (list of strings like 'Spent money', 'Posted tweet'), and 'reflection'.")
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

def update_memory(state: MarketingWorkerState):
    """Update Shared Memory."""
    from app.services.shared_memory import SharedMemoryService
    mem = SharedMemoryService()
    mem.set(state["business_id"], f"marketing_result_{state['task'].id}", {
        "output": state["final_output"],
        "confidence": state["confidence"],
        "side_effects": state["side_effects"]
    }, tags=["marketing", "result"])
    return {"status": state.get("status", "success")}

def decide(state: MarketingWorkerState) -> Literal["spawn_subworkers", "END"]:
    if state["needs_sub_workers"]:
        return "spawn_subworkers"
    return "END"

def spawn_subworkers(state: MarketingWorkerState):
    """Switch to Temporary Supervisor mode and spawn sub-workers."""
    researcher = get_research_agent(model_id=state.get("model_id"))
    plan = researcher.invoke({
        "task_description": state["task"].description,
        "context": str(state.get("shared_context", {}))
    })
    
    # Use the existing execute_sub_orchestration
    final_output = execute_sub_orchestration(state["business_id"], state["task"], plan)
    
    return {
        "final_output": f"Spawned Sub-Workers Output:\n{final_output}",
        "status": "success",
        "confidence": 1.0,
        "side_effects": ["Spawned sub-workers"]
    }

# Build the LangGraph for the Marketing Worker
workflow = StateGraph(MarketingWorkerState)
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

marketing_worker_app = workflow.compile()

def make_marketing_worker_node(agent_data: dict):
    """
    Wraps the MarketingWorker LangGraph into a node compatible with the main OrchestratorGraph.
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
        
        # Ensure tools are registered before running
        register_marketing_tools(business_id=business_id, agent_id=agent_id, task_id=task.id)
        
        worker_state = MarketingWorkerState(
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
            final_state = marketing_worker_app.invoke(worker_state)
            
            observations = final_state.get("observations", "")
            plan_text = final_state.get("plan", "")

            if "<thought>" not in final_output and "<think>" not in final_output and "### Thought" not in final_output:
                thought_parts = []
                if observations:
                    thought_parts.append(f"1. Strategic Analysis & Mandate Scope:\n{observations}")
                if plan_text:
                    thought_parts.append(f"2. Execution Strategy & Tool Plan:\n{plan_text}")
                thought_parts.append(f"3. Quality & Brand Alignment Reflection:\nConfidence: {confidence:.2f} | Side Effects: {', '.join(side_effects) if side_effects else 'None'}")
                thought_block = f"<thought>\n" + "\n\n".join(thought_parts) + f"\n</thought>"
                full_deliverable = f"{thought_block}\n\n{final_output}"
            else:
                full_deliverable = final_output

            # Formulate structured reasoning summary
            reasoning_summary = f"Confidence: {confidence}\nSide Effects: {side_effects}"

            task_service.update_task_result(task.id, full_deliverable)
            task_service.update_task_status(task.id, status)

            updated_task = task.copy()
            updated_task.status = status if status in ["completed", "failed"] else "completed" 
            updated_task.result = full_deliverable
            
        except Exception as e:
            import traceback
            err_msg = traceback.format_exc()
            task_service.update_task_status(task.id, "failed")
            
            # Use repr(e) for short summary and err_msg for full context
            short_err = repr(e)
            task_service.update_task_result(task.id, f"Marketing Worker crashed: {short_err}\n\nTraceback:\n{err_msg}")
            
            updated_task = task.copy()
            updated_task.status = "failed"
            updated_task.result = f"Worker crashed: {short_err}"
            final_output = updated_task.result
            status = "failed"
            confidence = 0.0
            side_effects = []
            reasoning_summary = f"Worker crashed: {short_err}"
            
        # Return structured WorkerResult as requested
        worker_result = WorkerResult(
            task_id=task.id,
            agent_id=agent_id,
            role=role,
            status=status,
            output=final_output,
            cost=0.0 # Will be populated by cost_service independently via tool runs
        )
        
        # We need to hack a bit to add reasoning_summary and tokens_used since it's not on the current WorkerResult schema
        # But we can format the output string to include them to satisfy the deliverable without breaking schema
        formatted_output = f"Result:\n{final_output}\n\nMetrics:\nStatus: {status}\nConfidence: {confidence:.2f}\nSide Effects: {side_effects}\nReasoning: {reasoning_summary}"
        worker_result.output = formatted_output
        
        return {
            "task_graph": {task.id: updated_task},
            "worker_results": [worker_result],
            "messages": [AIMessage(content=f"Marketing Manager finished task '{task.description}':\n{formatted_output}")]
        }
        
    return node_func
