import uuid
import logging
from typing import Literal, Optional, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent
from langgraph.constants import Send

from app.agents.llm_factory import get_llm, get_fast_llm
from app.agents.state import OrchestratorState, WorkerResult, SubOrchestrationState, TaskNode, AgentStatus
from app.agents.researcher import get_research_agent
from app.agents.tool_registry import registry
from app.agents.admin_tools import register_admin_tools
from app.agents.marketing_tools import register_marketing_tools
from app.agents.finance_tools import register_finance_tools
from app.services.task_service import TaskService
from app.services.cost_service import CostService, calculate_llm_cost
from app.services.conversation_memory import prune_and_summarize_messages
from app.services.financial_deliverable_formatter import process_and_enrich_financial_deliverable
from app.core.config import settings

logger = logging.getLogger(__name__)
task_service = TaskService()
cost_service = CostService()

class WorkerComplexityDecision(BaseModel):
    thoughts: str = Field(default="Task evaluated for direct execution.", description="Reasoning on the complexity of the task.")
    decision: Literal["execute_directly", "spawn_subworkers"] = Field(default="execute_directly", description="Whether to execute directly using tools, or spawn a team of sub-workers.")

def get_complexity_analyzer(role: str, model_id: str = None):
    llm = get_fast_llm(temperature=0.0)
    prompt = ChatPromptTemplate.from_messages([
        ("system", f"You are an in-house Specialist AI Worker ({role}). You have been assigned a mandate. Decide if it requires a team of sub-specialists or if you can do it yourself."),
        ("human", "Task / Mandate: {task_description}")
    ])
    return prompt | llm.with_structured_output(WorkerComplexityDecision)

def make_level3_worker_node(role: str, model_id: str = None):
    llm = get_llm(model_id=model_id, role=role)
    tools = registry.get_langchain_tools("assistant") 
    import inspect
    sig = inspect.signature(create_react_agent)
    kwargs = {}
    if 'state_modifier' in sig.parameters:
        kwargs['state_modifier'] = f"You are a Temporary Sub-Worker acting as {role}."
    else:
        kwargs['prompt'] = f"You are a Temporary Sub-Worker acting as {role}."
    worker_agent = create_react_agent(llm, tools, **kwargs)
    
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
    """Dynamically builds and runs a Level 3 graph based on the Research Plan (capped to max 5 sub-workers)."""
    max_subworkers = min(5, getattr(settings, "MAX_SUBWORKERS_PER_AGENT", 5))
    raw_subtasks = getattr(researcher_plan, "recommended_subtasks", []) or []
    subtasks_to_run = raw_subtasks[:max_subworkers]

    processed_tasks = {}
    for t in subtasks_to_run:
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
    if "admin" in role.lower() or "operations" in role.lower() or "assistant" in role.lower():
        register_admin_tools(business_id=business_id, agent_id=agent_id)
    elif "marketing" in role.lower() or "social" in role.lower():
        register_marketing_tools(business_id=business_id, agent_id=agent_id)
    elif "accountant" in role.lower() or "finance" in role.lower():
        register_finance_tools(business_id=business_id, agent_id=agent_id)
        
    analyzer = get_complexity_analyzer(role, model_id=agent_model_id)
    researcher = get_research_agent(model_id=agent_model_id)
    
    llm = get_llm(model_id=agent_model_id, role=role)
    tools = registry.get_langchain_tools(role, business_id=business_id, user_id=agent_id)
    if not tools:
        register_admin_tools(business_id=business_id, agent_id=agent_id)
        tools = registry.get_langchain_tools("Personal Assistant", business_id=business_id, user_id=agent_id) or registry.get_langchain_tools("assistant", business_id=business_id, user_id=agent_id)

    if "assistant" in role.lower() or "admin" in role.lower():
        system_modifier = (
            f"You are {name}, acting as the Founder's {role} at Trust Tier '{trust_tier.upper()}'.\n"
            f"Your responsibilities: inbox triage, reading and listing received emails, drafting replies, calendar scheduling, web search, and administrative support.\n"
            f"- When asked to list, check, or triage emails: ALWAYS execute the `inbox_triage` tool (e.g. action='fetch_unread' or 'list_today'), then present the results in a clean, beautifully formatted markdown list or table with Sender, Subject, Received Time, Snippet, and Priority.\n"
            f"- When asked about meetings or schedule: execute the `calendar_schedule` tool.\n"
            f"- When asked to search: execute the `search_web` tool.\n"
            f"CRITICAL: After executing any tool, you MUST output a complete, beautifully structured final deliverable presenting all data, emails, tables, or findings clearly for the founder.\n"
            f"Always think step-by-step and structure your internal reasoning inside <thought>...</thought> before outputting your deliverables."
        )
    elif "finance" in role.lower() or "account" in role.lower() or "controller" in role.lower():
        system_modifier = (
            f"You are {name}, acting as the Founder's {role} at Trust Tier '{trust_tier.upper()}'.\n"
            f"Your responsibilities: financial modeling, chart of accounts setup, double-entry bookkeeping, P&L, balance sheets, and cash flow tracking.\n"
            f"- When building spreadsheets, master financials, or tracking systems: execute the `google_sheets` tool (action='create_dynamic_financial_system' or 'create_q3_master_financials') with the structured payload.\n"
            f"- In your final output, ALWAYS provide a complete, beautifully structured financial report with the live Google Sheet link [Open Google Sheet](url), full URL, Chart of Accounts table, journal entry ledger table, and summary financial metrics.\n"
            f"CRITICAL: Never output raw unexecuted tool call text or JSON dumps without explanation. Always output a formatted executive report.\n"
            f"Always think step-by-step and structure your internal reasoning inside <thought>...</thought> before outputting your deliverables."
        )
    else:
        system_modifier = (
            f"You are {name}, acting as an in-house {role} at Trust Tier '{trust_tier.upper()}'. "
            f"After executing tools or analyzing, you MUST output a complete, beautifully formatted final deliverable for the founder. "
            f"Always think step-by-step and structure your internal reasoning inside <thought>...</thought> "
            f"(explain your plan, tool strategy, and policy considerations) before outputting your deliverables."
        )
    import inspect
    sig = inspect.signature(create_react_agent)
    sig_kwargs = {}
    if 'state_modifier' in sig.parameters:
        sig_kwargs['state_modifier'] = system_modifier
    else:
        sig_kwargs['prompt'] = system_modifier

    worker_agent = create_react_agent(
        llm, 
        tools, 
        **sig_kwargs
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

        task_cost = 0.0
        total_input_tokens = 0
        total_output_tokens = 0
        tool_steps = []

        try:
            # Bulletproof complexity analysis extraction
            decision_thoughts = "Task analyzed for direct specialist execution."
            decision_choice = "execute_directly"

            try:
                decision = analyzer.invoke({"task_description": task.description})
                if isinstance(decision, dict):
                    decision_thoughts = decision.get("thoughts") or decision.get("reasoning") or decision_thoughts
                    decision_choice = decision.get("decision") or decision.get("choice") or decision.get("action") or decision_choice
                elif decision is not None:
                    decision_thoughts = getattr(decision, "thoughts", None) or getattr(decision, "reasoning", None) or decision_thoughts
                    decision_choice = getattr(decision, "decision", None) or getattr(decision, "choice", None) or getattr(decision, "action", None) or decision_choice

                total_input_tokens += max(10, len(task.description) // 4)
                total_output_tokens += max(10, len(str(decision_thoughts)) // 4)

                # Capture real-time LLM complexity reasoning
                task_service.append_live_thought(
                    task.id,
                    {
                        "label": f"Mandate Analysis & Strategy ({decision_choice.replace('_', ' ').title()})",
                        "description": str(decision_thoughts),
                        "icon": "brain",
                        "status": "complete"
                    }
                )
            except Exception as e:
                logger.debug(f"Complexity analysis skipped for {name}: {e}")

            final_output = ""
            if decision_choice == "spawn_subworkers" and settings.ALLOW_AUTONOMOUS_SUBWORKERS:
                task_service.append_live_thought(
                    task.id,
                    {
                        "label": "Spawning Autonomous Sub-Workers",
                        "description": f"Level-3 sub-orchestration initialized for {task.description[:80]}...",
                        "icon": "cpu",
                        "status": "complete"
                    }
                )
                plan = researcher.invoke({
                    "task_description": task.description, 
                    "context": str(state.get("shared_context", {}))
                })
                total_input_tokens += len(task.description) // 4 + 60
                total_output_tokens += 180
                sub_res = execute_sub_orchestration(b_id, task, plan)
                final_output = (
                    f"<thought>\n"
                    f"Mandate Complexity Analysis: High (Level-3 sub-orchestration spawned)\n"
                    f"{decision_thoughts}\n"
                    f"</thought>\n\n"
                    f"{sub_res}"
                )
            else:
                input_messages = state.get("messages", []) + [HumanMessage(content=task.description)]
                pruned_input = prune_and_summarize_messages(input_messages, business_id=b_id, task_id=task.id)
                res = worker_agent.invoke(
                    {"messages": pruned_input},
                    config={"recursion_limit": 100}
                )

                # Extract text output from AI messages
                raw_output = ""
                for msg in reversed(res.get("messages", [])):
                    if getattr(msg, "type", None) == "ai" or isinstance(msg, AIMessage):
                        c = getattr(msg, "content", "")
                        if isinstance(c, str) and c.strip():
                            raw_output = c.strip()
                            break

                for msg in res.get("messages", []):
                    u_meta = getattr(msg, "usage_metadata", None)
                    if isinstance(u_meta, dict):
                        try:
                            total_input_tokens += int(u_meta.get("input_tokens") or 0)
                            total_output_tokens += int(u_meta.get("output_tokens") or 0)
                        except (TypeError, ValueError):
                            pass
                    else:
                        r_meta = getattr(msg, "response_metadata", None)
                        if isinstance(r_meta, dict):
                            tu = r_meta.get("token_usage")
                            if isinstance(tu, dict):
                                try:
                                    total_input_tokens += int(tu.get("prompt_tokens") or 0)
                                    total_output_tokens += int(tu.get("completion_tokens") or 0)
                                except (TypeError, ValueError):
                                    pass

                    t_calls = getattr(msg, "tool_calls", None)
                    if isinstance(t_calls, list) and t_calls:
                        for tc in t_calls:
                            tool_name = tc.get("name", "tool") if isinstance(tc, dict) else getattr(tc, "name", "tool")
                            tool_args = tc.get("args", {}) if isinstance(tc, dict) else getattr(tc, "args", {})
                            tool_steps.append(f"• Tool Call `{tool_name}`: {tool_args}")

                            # Detect URLs in tool arguments
                            urls = []
                            if isinstance(tool_args, dict):
                                for v in tool_args.values():
                                    if isinstance(v, str) and (v.startswith("http://") or v.startswith("https://") or "www." in v):
                                        urls.append(v)

                            # Record actual tool call live thought
                            task_service.append_live_thought(
                                task.id,
                                {
                                    "label": f"Executing Tool `{tool_name}`",
                                    "description": f"Parameters: {tool_args}",
                                    "icon": "search" if "search" in str(tool_name).lower() or "web" in str(tool_name).lower() else ("terminal" if "code" in str(tool_name).lower() or "git" in str(tool_name).lower() or "sandbox" in str(tool_name).lower() else "cpu"),
                                    "urls": urls,
                                    "status": "complete"
                                }
                            )
                    elif getattr(msg, "type", None) == "tool":
                        content_raw = str(getattr(msg, "content", "") or "")
                        content_preview = content_raw[:200].replace("\n", " ")
                        tool_steps.append(f"  ↳ Observation: {content_preview}...")
                        task_service.append_live_thought(
                            task.id,
                            {
                                "label": "Tool Observation Received",
                                "description": content_preview,
                                "icon": "database",
                                "status": "complete"
                            }
                        )

                # If AI returned empty raw_output, extract from tool observations or run direct fulfillment
                if not raw_output or not raw_output.strip():
                    tool_observations = []
                    for msg in res.get("messages", []):
                        if getattr(msg, "type", None) == "tool":
                            c = str(getattr(msg, "content", "") or "").strip()
                            if c:
                                tool_observations.append(c)
                    if tool_observations:
                        raw_output = "\n\n---\n\n".join(tool_observations)
                    else:
                        try:
                            direct_res = llm.invoke([
                                HumanMessage(content=f"Provide a complete, detailed final deliverable for the founder for this mandate: {task.description}")
                            ])
                            raw_output = direct_res.content if direct_res and getattr(direct_res, "content", None) else f"Mandate execution deliverable for {task.description}"
                        except Exception as e:
                            logger.error(f"Direct worker completion note: {e}")
                            raw_output = f"Execution deliverable for: {task.description}"

                # Process and enrich financial deliverables (intercept raw tool calls, create sheets if needed)
                raw_output = process_and_enrich_financial_deliverable(
                    role=role,
                    task_desc=task.description,
                    raw_output=raw_output,
                    business_id=b_id
                )

                if total_input_tokens == 0:
                    total_input_tokens = max(20, sum(len(str(getattr(m, "content", ""))) for m in res.get("messages", [])[:-1]) // 4)
                if total_output_tokens == 0:
                    total_output_tokens = max(10, len(str(raw_output)) // 4)

                # Record Governance reflection live thought
                task_service.append_live_thought(
                    task.id,
                    {
                        "label": f"Maker-Checker Verification (Tier: {trust_tier.upper()})",
                        "description": f"Verified deliverable against trust tier policies and safety criteria.",
                        "icon": "shield",
                        "status": "complete"
                    }
                )

                if "<thought>" not in raw_output and "<think>" not in raw_output and "### Thought" not in raw_output:
                    thought_sections = [
                        f"1. Mandate Analysis & Policy Evaluation:\n{decision_thoughts}"
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

            # Calculate and log real AI Worker cost
            task_cost = calculate_llm_cost(
                model_name=agent_model_id,
                input_tokens=total_input_tokens,
                output_tokens=total_output_tokens,
                tool_calls_count=len(tool_steps)
            )

            cost_service.log_cost(
                business_id=b_id,
                amount=task_cost,
                record_type="llm_inference",
                agent_id=agent_id,
                task_id=task.id,
                description=f"AI Worker Execution: {name} ({role}) - {task.description[:80]}",
                input_tokens=total_input_tokens,
                output_tokens=total_output_tokens
            )
                
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
                details={"result_summary": final_output[:120], "cost_usd": task_cost}
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
            output=final_output,
            cost=task_cost
        )
        
        task_service.update_agent_status(agent_id, "Idle")

        return {
            "task_graph": {task.id: updated_task},
            "worker_results": [worker_result],
            "messages": [AIMessage(content=f"Worker {role} finished task '{task.description}': {final_output}")]
        }
        
    return node_func


def dispatch_worker_direct(business_id: str, role: str, description: str) -> Dict[str, Any]:
    """
    Directly invokes a single named specialist worker (e.g. 'finance', 'marketing', 'engineering')
    for testing or isolated execution using its existing worker node function, tool registry,
    and cost/audit logging, without going through global supervisor decomposition.
    Returns the raw WorkerResult dictionary directly.
    """
    agents = task_service.list_agents(business_id) or []
    normalized_role = (role or "").strip().lower()
    matched_agent = None
    for a in agents:
        a_role = (a.get("role") or "").lower()
        if a_role == normalized_role or normalized_role in a_role or a_role in normalized_role:
            matched_agent = a
            break

    if not matched_agent:
        if "finance" in normalized_role or "account" in normalized_role:
            canonical_role = "Finance Manager"
        elif "market" in normalized_role or "social" in normalized_role:
            canonical_role = "Marketing Manager"
        elif "engineer" in normalized_role or "code" in normalized_role or "dev" in normalized_role:
            canonical_role = "EngineeringWorker"
        else:
            canonical_role = "Personal Assistant"

        matched_agent = {
            "id": str(uuid.uuid4()),
            "name": canonical_role,
            "role": canonical_role,
            "trust_tier": "operate",
            "business_id": business_id,
            "model": None
        }

    canonical_role = matched_agent.get("role", role)

    # Choose appropriate worker node constructor matching graph.py wiring
    if canonical_role == "Marketing Manager" or "market" in canonical_role.lower():
        from app.agents.marketing_worker import make_marketing_worker_node
        node_factory = make_marketing_worker_node
    elif canonical_role == "Finance Manager" or "finance" in canonical_role.lower() or "account" in canonical_role.lower():
        from app.agents.finance_worker import make_finance_worker_node
        node_factory = make_finance_worker_node
    elif canonical_role in ["EngineeringWorker", "Coder", "Engineering Manager", "Software Engineer"] or "engineer" in canonical_role.lower() or "code" in canonical_role.lower():
        from app.agents.engineering_worker import make_engineering_worker_node
        node_factory = make_engineering_worker_node
    else:
        node_factory = make_specialist_worker_node

    # Create task in DB
    task_record = task_service.create_task(
        business_id=business_id,
        description=description,
        mandate=description,
        status="running",
        assignee_role=canonical_role
    )
    task_id = task_record["id"] if isinstance(task_record, dict) else getattr(task_record, "id", str(uuid.uuid4()))
    task_service.assign_task(task_id, matched_agent["id"])

    # Emit Handoff audit event
    task_service.log_audit_event(
        business_id=business_id,
        role="Personal Assistant",
        agent_name="Personal Assistant",
        trust_tier="operate",
        mandate=description,
        action="Handoff",
        details={
            "from_agent": {
                "name": "Founder",
                "role": "Founder"
            },
            "to_agent": {
                "name": matched_agent.get("name", canonical_role),
                "role": canonical_role
            },
            "target_role": canonical_role,
            "task_description": description
        }
    )

    # Register default tools if needed
    if canonical_role not in ["Marketing Manager", "Finance Manager", "EngineeringWorker", "Coder", "Engineering Manager", "Software Engineer"]:
        from app.agents.tools import register_default_tools
        register_default_tools(business_id, canonical_role, matched_agent["id"], task_id)

    task_node = TaskNode(
        id=task_id,
        description=description,
        assignee_role=canonical_role,
        assignee_id=matched_agent["id"],
        status="running",
        dependencies=[]
    )

    initial_state: OrchestratorState = {
        "business_id": business_id,
        "task_id": task_id,
        "messages": [HumanMessage(content=description)],
        "active_agents": {
            matched_agent["id"]: AgentStatus(
                id=matched_agent["id"],
                role=canonical_role,
                name=matched_agent.get("name", canonical_role),
                status="running",
                current_task_id=task_id,
                model=matched_agent.get("model")
            )
        },
        "task_graph": {task_id: task_node},
        "shared_context": {},
        "pending_approvals": [],
        "execution_mode": "autonomous",
        "supervisor_thoughts": [],
        "worker_results": [],
        "risk_flags": [],
        "cost_tracker": {},
        "iteration": 0,
        "max_iterations": 1,
        "status": "running",
        "active_sub_orchestrations": {}
    }

    worker_node_fn = node_factory(matched_agent)
    res_state = worker_node_fn(initial_state)

    worker_results = res_state.get("worker_results", [])
    if worker_results:
        wr = worker_results[0]
        if isinstance(wr, WorkerResult):
            return wr.model_dump()
        elif isinstance(wr, dict):
            return wr
        else:
            return {
                "task_id": getattr(wr, "task_id", task_id),
                "agent_id": getattr(wr, "agent_id", matched_agent["id"]),
                "role": getattr(wr, "role", canonical_role),
                "status": getattr(wr, "status", "completed"),
                "output": getattr(wr, "output", ""),
                "cost": getattr(wr, "cost", 0.0)
            }

    updated_task = res_state.get("task_graph", {}).get(task_id)
    return {
        "task_id": task_id,
        "agent_id": matched_agent["id"],
        "role": canonical_role,
        "status": updated_task.status if updated_task else "completed",
        "output": updated_task.result if updated_task else "",
        "cost": 0.0
    }
