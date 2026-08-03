import pytest
import uuid
from datetime import datetime
from unittest.mock import patch, MagicMock

from app.agents.finance_checker import (
    FinanceCheckerEngine,
    STANDARD_CHART_OF_ACCOUNTS,
    MathematicalCheckResult,
    PolicyCheckResult,
    AnomalyCheckResult
)
from app.agents.circuit_breaker import FinancialCircuitBreaker, CircuitBreakerConfig
from app.agents.finance_worker import finance_worker_app, FinanceWorkerState
from app.agents.state import TaskNode
from app.services.shared_memory import SharedMemoryService

# ----------------- 1. Deterministic Mathematical Parity Tests -----------------
def test_mathematical_parity_balanced():
    balanced_entry = {
        "journal_entries": [
            {"account": "6000 - Software Subscriptions & SaaS Tools", "debit": 150.00, "credit": 0.00, "description": "Figma Subscription"},
            {"account": "1050 - Operating Bank Account", "debit": 0.00, "credit": 150.00, "description": "Paid via Operating Card"}
        ]
    }
    result = FinanceCheckerEngine.verify_mathematics(balanced_entry)
    assert result.passed is True
    assert result.imbalance == 0.0
    assert result.total_debits == 150.0
    assert result.total_credits == 150.0

def test_mathematical_parity_unbalanced():
    unbalanced_entry = {
        "journal_entries": [
            {"account": "6000 - Software Subscriptions & SaaS Tools", "debit": 250.00, "credit": 0.00, "description": "AWS Hosting"},
            {"account": "1050 - Operating Bank Account", "debit": 0.00, "credit": 150.00, "description": "Cash deduction"}
        ]
    }
    result = FinanceCheckerEngine.verify_mathematics(unbalanced_entry)
    assert result.passed is False
    assert result.imbalance == 100.0
    assert "Double-Entry Parity Violated" in result.details[0]

# ----------------- 2. Chart of Accounts Policy Tests -----------------
def test_chart_of_accounts_valid():
    valid_entry = {
        "journal_entries": [
            {"account": "5000 - Cloud Hosting & Server Infrastructure", "debit": 500.0, "credit": 0.0},
            {"account": "2000 - Accounts Payable", "debit": 0.0, "credit": 500.0}
        ]
    }
    result = FinanceCheckerEngine.verify_chart_of_accounts(valid_entry)
    assert result.passed is True

def test_chart_of_accounts_invalid_account():
    invalid_entry = {
        "journal_entries": [
            {"account": "9999 - Unregulated Speculative Crypto Asset", "debit": 500.0, "credit": 0.0},
            {"account": "1050 - Operating Bank Account", "debit": 0.0, "credit": 500.0}
        ]
    }
    result = FinanceCheckerEngine.verify_chart_of_accounts(invalid_entry)
    assert result.passed is False
    assert len(result.unauthorized_accounts) == 1
    assert "9999 - Unregulated Speculative Crypto Asset" in result.unauthorized_accounts

# ----------------- 3. Anomaly Detection Tests -----------------
def test_anomaly_detection_duplicate_transaction():
    shared_context = {
        "recent_transactions": [
            {"id": "tx_old", "amount": 420.50, "vendor": "aws cloud services", "date": "2026-07-15"}
        ]
    }
    maker_output = {
        "amount": 420.50,
        "vendor": "AWS Cloud Services",
        "description": "Payment for AWS"
    }
    result = FinanceCheckerEngine.verify_anomalies(maker_output, shared_context)
    assert result.passed is False
    assert any("Potential duplicate transaction detected" in d for d in result.anomalies_detected)

# ----------------- 4. Financial Safety Circuit Breaker Tests -----------------
def test_circuit_breaker_execution_limits():
    cb = FinancialCircuitBreaker(CircuitBreakerConfig(max_steps_per_task=5, max_cost_per_task_usd=1.00))
    
    # Within limits
    res = cb.check_execution_limits(step_count=3, current_cost=0.50, consecutive_errors=0)
    assert res.tripped is False

    # Exceed steps
    res_steps = cb.check_execution_limits(step_count=6, current_cost=0.50, consecutive_errors=0)
    assert res_steps.tripped is True
    assert "step limit exceeded" in res_steps.reason

    # Exceed cost
    res_cost = cb.check_execution_limits(step_count=2, current_cost=1.50, consecutive_errors=0)
    assert res_cost.tripped is True
    assert "budget limit exceeded" in res_cost.reason

def test_circuit_breaker_blocks_money_movement():
    cb = FinancialCircuitBreaker()
    
    # Intercept refund
    refund_res = cb.inspect_tool_call(
        tool_name="stripe_finance",
        tool_args={"action": "issue_refund", "amount": 250.00, "customer_id": "cus_123"}
    )
    assert refund_res.tripped is True
    assert refund_res.requires_human_approval is True
    assert "strictly requires human founder approval" in refund_res.reason

    # Intercept wire transfer
    transfer_res = cb.inspect_tool_call(
        tool_name="supabase_database",
        tool_args={"action": "transfer_funds", "amount": 1000.00}
    )
    assert transfer_res.tripped is True
    assert transfer_res.requires_human_approval is True

# ----------------- 5. End-to-End LangGraph Flow: Simple Task -----------------
@patch("app.agents.finance_worker.get_finance_llm")
@patch("app.agents.finance_checker.get_checker_llm")
def test_finance_worker_simple_expense_categorization(mock_checker_llm, mock_maker_llm):
    # Mock LLMs to return consistent JSON without API calls
    mock_maker = MagicMock()
    mock_maker.invoke.return_value = MagicMock(content="""{
        "journal_entries": [
            {"account": "6000 - Software Subscriptions & SaaS Tools", "debit": 85.00, "credit": 0.00, "description": "ChatGPT Team Subscription"},
            {"account": "1050 - Operating Bank Account", "debit": 0.00, "credit": 85.00, "description": "Paid via Operating Card"}
        ],
        "rationale": "Classified under standard SaaS OPEX account 6000."
    }""")
    mock_maker_llm.return_value = mock_maker

    mock_checker = MagicMock()
    mock_checker.invoke.return_value = MagicMock(content="""{
        "passed": true,
        "confidence": 0.98,
        "risk_level": "low",
        "audit_findings": ["Double-entry debits equal credits.", "Valid Chart of Accounts 6000 and 1050 used."]
    }""")
    mock_checker_llm.return_value = mock_checker

    test_biz_id = f"biz_{uuid.uuid4().hex[:8]}"
    test_task = TaskNode(
        id=str(uuid.uuid4()),
        description="Categorize ChatGPT software subscription of $85.00",
        role="Finance Manager",
        status="running"
    )

    initial_state = FinanceWorkerState(
        business_id=test_biz_id,
        task=test_task,
        messages=[],
        shared_context={},
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

    final_state = finance_worker_app.invoke(initial_state)

    assert final_state.get("circuit_breaker_tripped") is False
    assert final_state["checker_verdict"]["passed"] is True
    assert final_state["confidence"] >= 0.90
    assert final_state["risk_level"] == "low"
    assert "Financial Execution & Audit Report" in final_state["final_output"]

    # Verify Durable State Spine (SOX audit log) written to SharedMemory
    mem = SharedMemoryService()
    saved_audit = mem.get(test_biz_id, f"finance_audit_log_{test_task.id}")
    assert saved_audit is not None
    audit_entries = saved_audit.get("value", []) if isinstance(saved_audit, dict) else saved_audit
    assert len(audit_entries) >= 1
    assert audit_entries[0]["task_id"] == test_task.id
    assert audit_entries[0]["checker_verdict"]["passed"] is True

# ----------------- 6. End-to-End LangGraph Flow: Month-End Close (Supervisor Mode) -----------------
@patch("app.agents.finance_checker.get_checker_llm")
def test_finance_worker_month_end_close_supervisor_mode(mock_checker_llm):
    mock_checker = MagicMock()
    mock_checker.invoke.return_value = MagicMock(content="""{
        "passed": true,
        "confidence": 0.99,
        "risk_level": "low",
        "audit_findings": ["All 4 sub-worker reconciliations balanced.", "Tax accruals calculated accurately at 21%."]
    }""")
    mock_checker_llm.return_value = mock_checker

    test_biz_id = f"biz_{uuid.uuid4().hex[:8]}"
    test_task = TaskNode(
        id=str(uuid.uuid4()),
        description="Execute Month-End Close for July 2026: reconcile bank accounts, calculate tax accruals, and close books.",
        role="Finance Manager",
        status="running"
    )

    initial_state = FinanceWorkerState(
        business_id=test_biz_id,
        task=test_task,
        messages=[],
        shared_context={},
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

    final_state = finance_worker_app.invoke(initial_state)

    assert final_state["status"] == "completed"
    assert final_state["needs_sub_workers"] is True
    assert final_state["checker_verdict"]["passed"] is True
    assert any("Bookkeeper" in se for se in final_state["side_effects"])
    assert "July 2026" in str(final_state["maker_output"])

    # Verify SOX audit trail in memory
    mem = SharedMemoryService()
    audit_trail = mem.get(test_biz_id, f"finance_audit_log_{test_task.id}")
    assert audit_trail is not None
    audit_items = audit_trail.get("value", []) if isinstance(audit_trail, dict) else audit_trail
    assert len(audit_items) >= 1
