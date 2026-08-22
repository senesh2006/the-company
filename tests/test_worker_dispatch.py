import pytest
import uuid
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import User, get_current_user
from app.agents.state import DEFAULT_TEAM_COMPLETION_FALLBACK
from app.agents.workers import dispatch_worker_direct
from app.agents.supervisor import executive_synthesis_node
from app.agents.finance_checker import (
    CheckerVerdict,
    MathematicalCheckResult,
    PolicyCheckResult,
    AnomalyCheckResult
)
from langchain_core.messages import HumanMessage, AIMessage


@pytest.fixture
def mock_user():
    return User(
        id="00000000-0000-0000-0000-000000000001",
        email="founder@companyos.ai",
        role="founder",
        business_id="00000000-0000-0000-0000-000000000001"
    )


@pytest.fixture
def client(mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_direct_dispatch_finance_endpoint(client):
    """
    POST /api/v1/tasks/{business_id}/dispatch/finance
    Tests direct dispatch to finance role with a mocked GoogleSheetsTool response.
    Asserts raw WorkerResult (not synthesized/generic fallback) comes back with mocked content.
    """
    mock_sheet_result = (
        '{"status": "SUCCESS", "spreadsheet_title": "Trial Balance 2026", '
        '"spreadsheet_url": "https://docs.google.com/spreadsheets/d/mock-trial-balance-123", '
        '"sheets_created": ["Accounts", "General Journal", "Trial Balance"]}'
    )

    mock_llm = MagicMock()
    mock_llm.invoke.return_value = AIMessage(
        content="Successfully created Google Sheet: https://docs.google.com/spreadsheets/d/mock-trial-balance-123 with Trial Balance accounts."
    )

    mock_verdict = CheckerVerdict(
        passed=True,
        confidence=0.98,
        risk_level="low",
        reasons=[],
        mathematical_check=MathematicalCheckResult(passed=True, total_debits=0.0, total_credits=0.0, imbalance=0.0, details=[]),
        policy_check=PolicyCheckResult(passed=True, unauthorized_accounts=[], policy_violations=[], approval_required=False, details=[]),
        anomaly_check=AnomalyCheckResult(passed=True, anomalies_detected=[], risk_score=0.0, details=[]),
        suggested_revisions=None,
        audit_summary="Mathematical balance verified."
    )

    with patch("app.agents.google_sheets_tool.GoogleSheetsTool._run", return_value=mock_sheet_result), \
         patch("app.agents.finance_worker.get_finance_llm", return_value=mock_llm), \
         patch("app.agents.finance_worker.FinanceCheckerEngine.execute_checker", return_value=mock_verdict):
        response = client.post(
            "/api/v1/tasks/00000000-0000-0000-0000-000000000001/dispatch/finance",
            json={"description": "create a google sheet named trial balance"}
        )

        assert response.status_code == 200
        data = response.json()

        # Check raw WorkerResult fields
        assert "task_id" in data
        assert "role" in data
        assert "status" in data
        assert "output" in data
        assert "cost" in data

        assert "finance" in data["role"].lower()
        assert data["status"] in ["completed", "running", "success"]
        # Assert raw output contains mocked spreadsheet URL / content and not generic placeholder
        assert "mock-trial-balance-123" in data["output"]
        assert "Task processed and verified by specialized team." not in data["output"]


def test_direct_dispatch_function_direct():
    """
    Tests dispatch_worker_direct function directly with mocked tool execution.
    """
    mock_sheet_result = "https://docs.google.com/spreadsheets/d/direct-dispatch-test-sheet"

    mock_llm = MagicMock()
    mock_llm.invoke.return_value = AIMessage(
        content="Created sheet: https://docs.google.com/spreadsheets/d/direct-dispatch-test-sheet"
    )

    mock_verdict = CheckerVerdict(
        passed=True,
        confidence=0.98,
        risk_level="low",
        reasons=[],
        mathematical_check=MathematicalCheckResult(passed=True, total_debits=0.0, total_credits=0.0, imbalance=0.0, details=[]),
        policy_check=PolicyCheckResult(passed=True, unauthorized_accounts=[], policy_violations=[], approval_required=False, details=[]),
        anomaly_check=AnomalyCheckResult(passed=True, anomalies_detected=[], risk_score=0.0, details=[]),
        suggested_revisions=None,
        audit_summary="Verified."
    )

    with patch("app.agents.google_sheets_tool.GoogleSheetsTool._run", return_value=mock_sheet_result), \
         patch("app.agents.finance_worker.get_finance_llm", return_value=mock_llm), \
         patch("app.agents.finance_worker.FinanceCheckerEngine.execute_checker", return_value=mock_verdict):
        res = dispatch_worker_direct(
            business_id="00000000-0000-0000-0000-000000000001",
            role="Finance Manager",
            description="create a google sheet named trial balance"
        )

        assert isinstance(res, dict)
        assert res.get("role") == "Finance Manager"
        assert res.get("status") in ["completed", "running", "success"]
        assert "direct-dispatch-test-sheet" in res.get("output", "")


def test_executive_synthesis_fallback_diagnostic_logging():
    """
    Tests that executive_synthesis_node logs a diagnostic entry to the Company Feed
    when deliverables are empty.
    """
    state = {
        "business_id": "00000000-0000-0000-0000-000000000001",
        "task_id": str(uuid.uuid4()),
        "messages": [HumanMessage(content="Check quarterly balance")],
        "task_graph": {},
        "worker_results": [],
        "supervisor_thoughts": []
    }

    mock_synth_llm = MagicMock()
    mock_synth_llm.invoke.return_value = AIMessage(content="Direct synthesized answer for quarterly balance.")

    with patch("app.agents.supervisor.task_service.log_audit_event") as mock_log, \
         patch("app.agents.supervisor.get_llm", return_value=mock_synth_llm):
        res = executive_synthesis_node(state)

        assert "messages" in res
        assert len(res["messages"]) > 0

        # Assert audit diagnostic event was called
        mock_log.assert_called()
        call_args = mock_log.call_args[1]
        assert call_args["action"] == "Synthesis Fallback Diagnostic"
        assert call_args["details"]["worker_results_count"] == 0
        assert call_args["details"]["task_graph_count"] == 0


def test_shared_default_completion_constant():
    """
    Tests that DEFAULT_TEAM_COMPLETION_FALLBACK is defined consistently.
    """
    assert DEFAULT_TEAM_COMPLETION_FALLBACK == "Task successfully completed by your team."
