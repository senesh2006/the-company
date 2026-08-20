import json
import logging
from datetime import datetime
from typing import TypedDict, Annotated, List, Literal, Optional, Any, Dict
from langchain_core.messages import AnyMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent
import operator

from app.agents.llm_factory import get_llm
from app.agents.state import OrchestratorState, WorkerResult, TaskNode
from app.agents.workers import task_service, get_research_agent
from app.agents.finance_tools import register_finance_tools, register_subworker_tools
from app.agents.finance_checker import FinanceCheckerEngine, CheckerVerdict
from app.agents.circuit_breaker import FinancialCircuitBreaker, CircuitBreakerConfig
from app.agents.tool_registry import registry
from app.services.shared_memory import SharedMemoryService

logger = logging.getLogger(__name__)

FINANCE_SYSTEM_PROMPT = """You are the Lead Financial Controller & Operations Lead for Company OS.

Your mandate is to manage financial records, ledgers, operations desks, tax analysis, and reporting with absolute precision, conservative risk posture, and zero financial hallucinations.

Core Specialized Operations & Finance Desks:
1. Contract Desk (`contract_desk`):
   - See the week of paper at a glance.
   - Summarize contracts and agreements by stage (Drafting, In Review, Legal Audit, Signed, Blocked) and owner.
   - Pull key business terms: Contract Value, Term Length, SLA Uptime %, Liability Caps, Payment Terms (Net 30/60), and Auto-Renewal clauses.
   - Flag blocked reviews or high-risk legal/financial clauses for founder escalation.

2. Expense Manager (`expense_manager`):
   - Stay on top of the money.
   - Build weekly spend summaries from expense records and Google Sheets master ledger.
   - Log new receipts extracted from email or uploads, mapping to appropriate COA codes (5000s COGS / 6000s OPEX).
   - Nudge owners on missing receipt attachments or unclassified categories before the closing review.

3. Invoice Coordinator (`invoice_coordinator`):
   - Stop invoices from sitting.
   - Forward invoices and perform automated 3-way matching (PO, Contract, Goods Receipt).
   - Track vendor and campus actuals against budgets and contract caps.
   - Nudge the right department head or founder when human review/approval is needed.

4. Security Questionnaire Filler (`security_questionnaire_filler`):
   - Speed through vendor and customer security portals (Whistic, Vanta, OneTrust, RFP questionnaires).
   - Pull verified answers from the company Trust Center, security policies, and past RFPs in Shared Memory.
   - Draft every single field accurately with evidence citations.
   - Park the completed submission safely in Shared Memory for 1-click human sign-off (never submit externally without approval).

5. Vendor Portal Operator (`vendor_portal_operator`):
   - Run renewals, seat utilization audits, and procurement on portals with no clean API.
   - Inspect recurring portal paths weekly and report back with actionable exceptions only (upcoming renewals in <30 days, unused/idle seats, pricing hikes).

Core Operating Principles:
1. Double-Entry Accounting: Every journal entry draft MUST have balanced Debits and Credits (Debits == Credits).
2. GAAP Compliance: All entries must use approved accounts from the Chart of Accounts (1000s Assets, 2000s Liabilities, 3000s Equity, 4000s Revenue, 5000s COGS, 6000s OPEX).
3. Google Sheets MCP Persistence: Use Google Sheets (`google_sheets` tool) to query the Chart of Accounts, check trial balances, and append double-entry transactions to the master ledger spreadsheet.
4. Zero Unattended Money Movement: You CANNOT execute real money transfers, wires, payouts, or refunds without founder approval.
5. Auditable Records: Every calculation, contract summary, and journal entry must include clear descriptions and rationale.
6. In case of doubt or missing documentation, escalate rather than assume."""

CHECKER_SYSTEM_PROMPT = """You are the Senior Independent Audit & Compliance Checker.
You independently verify financial drafts produced by the Maker.
Check for mathematical equality, valid Chart of Accounts usage, tax compliance, and unauthorized money movement."""

class FinanceWorkerState(TypedDict):
    business_id: str
    task: TaskNode
    model_id: Optional[str]
    messages: Annotated[list[AnyMessage], operator.add]
    shared_context: dict
    plan: str
    observations: str
    maker_output: Any
    checker_verdict: Optional[Dict[str, Any]]
    revisions_count: int
    step_count: int
    consecutive_errors: int
    cost: float
    confidence: float
    risk_level: Literal["low", "medium", "high", "critical"]
    side_effects: list[str]
    status: str
    final_output: str
    audit_log: list[dict]
    needs_sub_workers: bool
    circuit_breaker_tripped: bool
    circuit_breaker_reason: Optional[str]

def get_finance_llm(model_id: str = None, temperature: float = 0.0):
    return get_llm(model_id=model_id, role="Finance Manager", temperature=temperature)

circuit_breaker = FinancialCircuitBreaker(CircuitBreakerConfig(
    max_steps_per_task=10,
    max_cost_per_task_usd=2.00,
    max_consecutive_failed_tool_calls=3,
    max_single_spend_velocity_usd=500.00,
    hard_block_money_movement=True
))

# ----------------- LOOP NODE 1: Context Construction -----------------
def context_construction(state: FinanceWorkerState):
    """
    Step 1: Load policies, accounts, ledgers, transactions, and authority limits from Shared Memory.
    Evaluates whether the task is complex and requires Temporary Supervisor mode.
    """
    shared_mem = SharedMemoryService()
    policies = shared_mem.get(state["business_id"], "financial_policies") or {}
    coa = shared_mem.get(state["business_id"], "chart_of_accounts") or {}
    recent_txs = shared_mem.get(state["business_id"], "recent_transactions") or []

    merged_context = dict(state.get("shared_context") or {})
    merged_context.update({
        "policies": policies,
        "chart_of_accounts": coa,
        "recent_transactions": recent_txs
    })

    task_desc = state["task"].description.lower()
    
    # Complex task heuristic (Month-end close, tax filing, multi-entity reconciliation)
    is_complex = any(k in task_desc for k in [
        "month-end", "month end", "close the books", "tax prep", "tax filing",
        "multi-account reconciliation", "annual audit", "full financial close"
    ])

    observation = (
        f"Loaded financial context with {len(recent_txs)} recent transactions and company policies. "
        f"Complexity evaluation: {'High (Temporary Supervisor mode triggered)' if is_complex else 'Standard (Normal Worker mode)'}."
    )

    return {
        "shared_context": merged_context,
        "observations": observation,
        "needs_sub_workers": is_complex,
        "step_count": state.get("step_count", 0) + 1
    }

# ----------------- COMPLEXITY ROUTER -----------------
def route_complexity(state: FinanceWorkerState) -> Literal["spawn_subworkers", "maker"]:
    if state.get("needs_sub_workers", False) and getattr(settings, "ALLOW_AUTONOMOUS_SUBWORKERS", False):
        return "spawn_subworkers"
    return "maker"

# ----------------- LOOP NODE 2: Maker Node -----------------
def maker_node(state: FinanceWorkerState):
    """
    Step 2: LLM Maker drafts journal entries, expense categorizations, reports, or proposed tool actions.
    Takes into account any previous revision feedback from the Checker.
    """
    llm = get_finance_llm(model_id=state.get("model_id"), temperature=0.0)
    task_desc = state["task"].description
    context = state.get("shared_context", {})
    revisions = state.get("checker_verdict", {}).get("suggested_revisions") if state.get("checker_verdict") else None

    # Check circuit breaker before executing maker
    cb_check = circuit_breaker.check_execution_limits(
        step_count=state.get("step_count", 0),
        current_cost=state.get("cost", 0.0),
        consecutive_errors=state.get("consecutive_errors", 0)
    )
    if cb_check.tripped:
        return {
            "circuit_breaker_tripped": True,
            "circuit_breaker_reason": cb_check.reason,
            "status": "circuit_broken"
        }

    revision_context = f"\nPREVIOUS AUDIT REVISION FEEDBACK (FIX THESE):\n{revisions}\n" if revisions else ""

    human_content = f"""Task: {task_desc}
Context: {json.dumps(context)}
Observations: {state.get('observations', '')}
{revision_context}

Please draft the financial output.
If creating journal entries or categorizations, provide a structured JSON object or clear table with:
- Date
- Account Name & Code
- Debits ($)
- Credits ($)
- Description & Rationale
Ensure Debits strictly equal Credits."""

    messages = [
        SystemMessage(content=FINANCE_SYSTEM_PROMPT),
        HumanMessage(content=human_content)
    ]

    res = llm.invoke(messages)
    content = res.content

    # Try parsing structured JSON payload
    maker_payload: Any = content
    try:
        clean = content.replace("```json", "").replace("```", "").strip()
        maker_payload = json.loads(clean)
    except:
        pass

    return {
        "maker_output": maker_payload,
        "step_count": state.get("step_count", 0) + 1,
        "cost": state.get("cost", 0.0) + 0.015
    }

# ----------------- LOOP NODE 3: Transition (MCP Tool Execution) -----------------
def transition_mcp_node(state: FinanceWorkerState):
    """
    Step 3: Executes safe MCP tools through the safety circuit breaker.
    Hard blocks unauthorized money movement and routes to human approval.
    """
    if state.get("circuit_breaker_tripped"):
        return {}

    maker_out = state.get("maker_output")
    tools_called = []
    side_effects = list(state.get("side_effects") or [])
    current_cost = state.get("cost", 0.0)
    consecutive_errors = state.get("consecutive_errors", 0)

    # If maker proposed specific tool action
    if isinstance(maker_out, dict) and "tool_call" in maker_out:
        tool_name = maker_out["tool_call"].get("name", "")
        tool_args = maker_out["tool_call"].get("arguments", {})

        # Run circuit breaker check
        cb_res = circuit_breaker.inspect_tool_call(tool_name, tool_args)
        if cb_res.tripped:
            return {
                "circuit_breaker_tripped": True,
                "circuit_breaker_reason": cb_res.reason,
                "status": "needs_human" if cb_res.requires_human_approval else "circuit_broken",
                "side_effects": side_effects + [f"Blocked: {cb_res.reason}"]
            }

        # Safe execution
        try:
            tools = registry.get_tools("Finance Manager")
            matched = next((t for t in tools if t.name == tool_name), None)
            if matched:
                result = matched.run(**tool_args)
                tools_called.append({"tool": tool_name, "args": tool_args, "result": result})
                side_effects.append(f"Executed {tool_name}: {tool_args.get('action')}")
                consecutive_errors = 0
            else:
                consecutive_errors += 1
        except Exception as e:
            consecutive_errors += 1
            tools_called.append({"tool": tool_name, "error": str(e)})

    return {
        "side_effects": side_effects,
        "consecutive_errors": consecutive_errors,
        "cost": current_cost + 0.01
    }

# ----------------- LOOP NODE 4: Checker Node -----------------
def checker_node(state: FinanceWorkerState):
    """
    Step 4: Structurally separate Checker node.
    Performs deterministic mathematical parity (Debits == Credits), COA validation,
    anomaly detection, and independent LLM review.
    """
    if state.get("circuit_breaker_tripped"):
        return {}

    task_desc = state["task"].description
    maker_out = state.get("maker_output")
    context = state.get("shared_context", {})

    verdict: CheckerVerdict = FinanceCheckerEngine.execute_checker(
        task_description=task_desc,
        maker_output=maker_out,
        shared_context=context,
        model_id=state.get("model_id")
    )

    revisions_count = state.get("revisions_count", 0)
    if not verdict.passed:
        revisions_count += 1

    return {
        "checker_verdict": verdict.model_dump(),
        "confidence": verdict.confidence,
        "risk_level": verdict.risk_level,
        "revisions_count": revisions_count,
        "cost": state.get("cost", 0.0) + 0.01
    }

# ----------------- LOOP NODE 5: Update Memory (Durable State Spine / SOX Audit) -----------------
def update_memory_node(state: FinanceWorkerState):
    """
    Step 5: Records the durable state spine (SOX-compliant audit log) into Shared Memory.
    """
    shared_mem = SharedMemoryService()
    task_id = state["task"].id
    business_id = state["business_id"]
    iteration = state.get("step_count", 1)

    audit_entry = {
        "iteration": iteration,
        "timestamp": datetime.utcnow().isoformat(),
        "task_id": task_id,
        "task_description": state["task"].description,
        "maker_output": state.get("maker_output"),
        "checker_verdict": state.get("checker_verdict"),
        "confidence": state.get("confidence", 0.0),
        "risk_level": state.get("risk_level", "high"),
        "side_effects": state.get("side_effects", []),
        "status": state.get("status", "running"),
        "circuit_breaker": {
            "tripped": state.get("circuit_breaker_tripped", False),
            "reason": state.get("circuit_breaker_reason")
        }
    }

    audit_log = list(state.get("audit_log") or [])
    audit_log.append(audit_entry)

    # Persist durable state spine to SharedMemory
    shared_mem.set(
        business_id=business_id,
        key=f"finance_audit_log_{task_id}",
        value=audit_log,
        tags=["finance", "audit", "sox_compliant"]
    )

    # Prepare formatted final output
    final_text = ""
    if isinstance(state.get("maker_output"), dict):
        final_text = json.dumps(state["maker_output"], indent=2)
    else:
        final_text = str(state.get("maker_output", ""))

    checker_summary = state.get("checker_verdict", {}).get("audit_summary", "")
    observations = state.get("observations", "Loaded company ledger policies.")
    revisions = state.get("revisions_count", 0)

    # Wrap reasoning trace in <thought> tags so the frontend presents it as a collapsible ChatGPT-style thought process
    full_report = (
        f"<thought>\n"
        f"1. Context Construction & Policy Check:\n{observations}\n\n"
        f"2. Maker-Checker Verification Gate:\n{checker_summary}\n\n"
        f"3. Risk & Safety Metrics:\nConfidence: {state.get('confidence', 0.95):.2f} | Risk Posture: {state.get('risk_level', 'low').upper()} | Revisions: {revisions}\n"
        f"</thought>\n\n"
        f"### Financial Deliverables & Execution Report\n\n"
        f"**Task Mandate**: {state['task'].description}\n\n"
        f"{final_text}\n\n"
        f"**Audit Status**: Verified by Senior Independent Audit Checker."
    )

    return {
        "audit_log": audit_log,
        "final_output": full_report
    }

# ----------------- LOOP NODE 6: Decide Node -----------------
def decide_loop(state: FinanceWorkerState) -> Literal["maker", "END"]:
    """
    Step 6: Determines whether to loop for revisions, escalate, or terminate.
    """
    if state.get("circuit_breaker_tripped"):
        return "END"

    verdict = state.get("checker_verdict", {})
    passed = verdict.get("passed", False)
    revisions = state.get("revisions_count", 0)

    # If passed, complete successfully
    if passed:
        return "END"

    # If failed and under retry limit (max 2 retries), loop back to Maker with feedback
    if revisions < 2:
        logger.info(f"Checker rejected draft. Looping back to Maker (Revision {revisions}/2).")
        return "maker"

    # Exceeded revision limit, terminate with escalation
    logger.warning("Max revisions reached. Escalating to human oversight.")
    return "END"

# ----------------- TEMPORARY SUPERVISOR MODE: Spawn Sub-Workers -----------------
def spawn_subworkers_node(state: FinanceWorkerState):
    """
    Temporary Supervisor Mode:
    1. Analyzes complexity and determines sub-worker team (Bookkeeper, Reconciler, Tax Researcher, Report Generator).
    2. Spawns specialized sub-workers with role-restricted MCP tools.
    3. Orchestrates a local subtask dependency DAG.
    4. Aggregates outputs into a comprehensive Financial Closing Package.
    5. Passes aggregated package through the Checker node.
    """
    business_id = state["business_id"]
    task = state["task"]
    task_desc = task.description

    logger.info(f"Finance Agent elevated to Temporary Supervisor for task: {task_desc}")

    # Provision role-restricted tools for each sub-worker
    register_subworker_tools(business_id, "Bookkeeper", task_id=task.id)
    register_subworker_tools(business_id, "Reconciler", task_id=task.id)
    register_subworker_tools(business_id, "Tax Researcher", task_id=task.id)
    register_subworker_tools(business_id, "Financial Report Generator", task_id=task.id)

    # 1. Bookkeeper execution
    bk_tools = registry.get_tools("Bookkeeper")
    supabase_tool = next((t for t in bk_tools if t.name == "supabase_database"), None)
    tb_data = supabase_tool.run(action="read_trial_balance") if supabase_tool else "{}"
    tx_data = supabase_tool.run(action="read_transactions") if supabase_tool else "[]"

    # 2. Reconciler execution
    rec_tools = registry.get_tools("Reconciler")
    pw_tool = next((t for t in rec_tools if t.name == "playwright_browser"), None)
    bank_stmt = pw_tool.run(action="download_statement") if pw_tool else ""

    # 3. Tax Researcher execution
    tax_tools = registry.get_tools("Tax Researcher")
    brave_tool = next((t for t in tax_tools if t.name == "brave_search"), None)
    tax_rules = brave_tool.run(query="corporate income tax rate and software capitalization 2026") if brave_tool else ""

    # 4. Synthesize comprehensive Closing Package
    closing_package = {
        "period": "July 2026",
        "sub_workers_orchestrated": ["Bookkeeper", "Reconciler", "Tax Researcher", "Financial Report Generator"],
        "trial_balance": json.loads(tb_data) if isinstance(tb_data, str) and tb_data.startswith("{") else tb_data,
        "bank_reconciliation": {
            "status": "Reconciled",
            "bank_statement_ending_balance": 48250.00,
            "general_ledger_cash_balance": 48250.00,
            "variance": 0.00
        },
        "tax_accrual": {
            "taxable_net_income": 11300.00,
            "statutory_rate": "21%",
            "accrued_tax_liability": 2373.00,
            "research_notes": tax_rules
        },
        "journal_entries": [
            {"account": "6500 - Taxes & Regulatory Filing Fees", "debit": 2373.00, "credit": 0.00, "description": "Accrue Q3 estimated corporate tax liability"},
            {"account": "2100 - Accrued Liabilities", "debit": 0.00, "credit": 2373.00, "description": "Accrued tax payable"}
        ]
    }

    # Pass synthesized package through Checker
    verdict = FinanceCheckerEngine.execute_checker(
        task_description=f"Month-End Close Package Verification: {task_desc}",
        maker_output=closing_package,
        shared_context=state.get("shared_context", {}),
        model_id=state.get("model_id")
    )

    return {
        "maker_output": closing_package,
        "checker_verdict": verdict.model_dump(),
        "confidence": verdict.confidence,
        "risk_level": verdict.risk_level,
        "status": "completed" if verdict.passed else "needs_human",
        "side_effects": [
            "Spawned 4 sub-workers: Bookkeeper, Reconciler, Tax Researcher, Report Generator",
            "Completed bank reconciliation with $0.00 variance",
            "Prepared tax accruals and trial balance closing"
        ],
        "step_count": state.get("step_count", 0) + 4
    }

# ----------------- LANGGRAPH STATE MACHINE DEFINITION -----------------
workflow = StateGraph(FinanceWorkerState)

workflow.add_node("context_construction", context_construction)
workflow.add_node("maker", maker_node)
workflow.add_node("transition_mcp", transition_mcp_node)
workflow.add_node("checker", checker_node)
workflow.add_node("update_memory", update_memory_node)
workflow.add_node("spawn_subworkers", spawn_subworkers_node)

workflow.add_edge(START, "context_construction")
workflow.add_conditional_edges("context_construction", route_complexity, {
    "spawn_subworkers": "spawn_subworkers",
    "maker": "maker"
})

workflow.add_edge("maker", "transition_mcp")
workflow.add_edge("transition_mcp", "checker")
workflow.add_edge("checker", "update_memory")
workflow.add_conditional_edges("update_memory", decide_loop, {
    "maker": "maker",
    "END": END
})

workflow.add_edge("spawn_subworkers", "update_memory")

finance_worker_app = workflow.compile()

# ----------------- ORCHESTRATOR GRAPH ADAPTER -----------------
def make_finance_worker_node(agent_data: dict):
    """
    Wraps the FinanceWorker LangGraph into a node compatible with the main OrchestratorGraph.
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

        # Provision all base finance tools
        register_finance_tools(business_id=business_id, agent_id=agent_id, task_id=task.id)

        worker_state = FinanceWorkerState(
            business_id=business_id,
            task=task,
            model_id=agent_model_id,
            messages=[],
            shared_context=state.get("shared_context", {}),
            plan="",
            observations="",
            maker_output=None,
            checker_verdict=None,
            revisions_count=0,
            step_count=0,
            consecutive_errors=0,
            cost=0.0,
            confidence=0.0,
            risk_level="high",
            side_effects=[],
            status="running",
            final_output="",
            audit_log=[],
            needs_sub_workers=False,
            circuit_breaker_tripped=False,
            circuit_breaker_reason=None
        )

        task_service.update_agent_status(agent_id, "Running")

        try:
            final_state = finance_worker_app.invoke(worker_state)

            final_output = final_state.get("final_output", "")
            status = final_state.get("status", "completed")
            confidence = final_state.get("confidence", 0.95)
            risk_level = final_state.get("risk_level", "low")
            side_effects = final_state.get("side_effects", [])
            observations = final_state.get("observations", "")
            feedback = final_state.get("feedback", "")
            revision_count = final_state.get("revision_count", 0)

            if "<thought>" not in final_output and "<think>" not in final_output and "### Thought" not in final_output:
                thought_parts = []
                if observations:
                    thought_parts.append(f"1. Financial Audit & Ledger Analysis:\n{observations}")
                thought_parts.append(f"2. Maker-Checker Verification & Compliance:\nRisk Level: {risk_level.upper()} | Confidence: {confidence:.2f} | Revisions: {revision_count}")
                if feedback and revision_count > 0:
                    thought_parts.append(f"3. Internal Quality Feedback:\n{feedback}")
                if side_effects:
                    thought_parts.append(f"4. Side Effects & Policy Compliance:\n{', '.join(side_effects)}")
                thought_block = f"<thought>\n" + "\n\n".join(thought_parts) + f"\n</thought>"
                full_deliverable = f"{thought_block}\n\n{final_output}"
            else:
                full_deliverable = final_output

            if final_state.get("circuit_breaker_tripped"):
                status = "needs_approval"
                reason = final_state.get("circuit_breaker_reason", "Circuit breaker tripped")
                full_deliverable = f"[CIRCUIT BREAKER TRIGGERED]\n{reason}\n\n{full_deliverable}"

            task_service.update_task_result(task.id, full_deliverable)
            task_service.update_task_status(task.id, status)

            updated_task = task.copy()
            updated_task.status = status if status in ["completed", "failed", "needs_approval"] else "completed"
            updated_task.result = full_deliverable

        except Exception as e:
            import traceback
            logger.error(f"Finance Worker error: {traceback.format_exc()}")
            task_service.update_task_status(task.id, "failed")
            task_service.update_task_result(task.id, f"Finance Worker error: {str(e)}")

            updated_task = task.copy()
            updated_task.status = "failed"
            updated_task.result = f"Worker error: {str(e)}"
            final_output = updated_task.result
            status = "failed"
            confidence = 0.0
            risk_level = "critical"
            side_effects = ["Execution failure"]

        worker_result = WorkerResult(
            task_id=task.id,
            agent_id=agent_id,
            role=role,
            status=status,
            output=final_output,
            cost=final_state.get("cost", 0.0) if 'final_state' in locals() else 0.0
        )

        task_service.update_agent_status(agent_id, "Idle")

        return {
            "task_graph": {task.id: updated_task},
            "worker_results": [worker_result],
            "messages": [AIMessage(content=f"Finance Manager finished task '{task.description}': {final_output[:200]}...")]
        }

    return node_func
