import concurrent.futures
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import get_current_user, User
from app.services.task_service import TaskService, get_business_task_lock, _IN_MEMORY_TASKS
from app.agents.runner import TeamRunner
from app.api.routes.tasks import run_team_task_bg

test_user = User(
    id="test-user-id-001",
    email="founder@company.com",
    role="founder",
    business_id="test-biz-dedup-001"
)

@pytest.fixture(autouse=True)
def clean_test_state():
    _IN_MEMORY_TASKS.clear()
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield
    _IN_MEMORY_TASKS.clear()
    app.dependency_overrides.clear()


def test_has_active_task_for_objective_matching():
    """Tests exact, normalized, and fuzzy matching for active tasks."""
    ts = TaskService()
    biz_id = "test-biz-dedup-001"

    # Create an initial running task
    task = ts.create_task(
        business_id=biz_id,
        description="Set up a complete financial tracking system and master spreadsheet",
        status="running"
    )

    # 1. Exact match
    match1 = ts.has_active_task_for_objective(biz_id, "Set up a complete financial tracking system and master spreadsheet")
    assert match1 is not None
    assert match1["id"] == task["id"]

    # 2. Case and whitespace normalized match
    match2 = ts.has_active_task_for_objective(biz_id, "   set UP a complete financial   tracking SYSTEM and master spreadsheet  ")
    assert match2 is not None
    assert match2["id"] == task["id"]

    # 3. Fuzzy close match (> 0.85 similarity)
    match3 = ts.has_active_task_for_objective(biz_id, "Set up complete financial tracking system and master spreadsheets")
    assert match3 is not None
    assert match3["id"] == task["id"]

    # 4. Different objective should not match
    match4 = ts.has_active_task_for_objective(biz_id, "Launch marketing campaign on LinkedIn for Q3")
    assert match4 is None

    # 5. Different business_id should not match
    match5 = ts.has_active_task_for_objective("other-biz-999", "Set up a complete financial tracking system and master spreadsheet")
    assert match5 is None

    # 6. Exclude task_id
    match6 = ts.has_active_task_for_objective(biz_id, "Set up a complete financial tracking system and master spreadsheet", exclude_task_id=task["id"])
    assert match6 is None


def test_has_active_task_ignores_completed_or_failed():
    """Tests that completed or failed tasks do not block new submissions of the same objective."""
    ts = TaskService()
    biz_id = "test-biz-dedup-002"

    task = ts.create_task(
        business_id=biz_id,
        description="Generate quarterly revenue report",
        status="completed"
    )

    match = ts.has_active_task_for_objective(biz_id, "Generate quarterly revenue report")
    assert match is None

    ts.update_task_status(task["id"], "failed")
    match_failed = ts.has_active_task_for_objective(biz_id, "Generate quarterly revenue report")
    assert match_failed is None


def test_queue_task_route_deduplication_in_quick_succession():
    """Tests that calling queue_task twice in quick succession returns already_running on the second attempt."""
    client = TestClient(app)
    biz_id = "test-biz-dedup-001"
    objective = "Audit Google Sheets reconciliation discrepancies for August 2026"

    with patch("app.api.routes.tasks.run_team_task_bg") as mock_bg_run:
        # First submission
        resp1 = client.post(
            f"/api/v1/tasks/{biz_id}/queue",
            json={"description": objective, "priority": 1}
        )
        assert resp1.status_code == 200
        data1 = resp1.json()
        assert data1["status"] == "success"
        assert "task" in data1
        first_task_id = data1["task"]["id"]
        assert mock_bg_run.call_count == 1

        # Immediate duplicate submission
        resp2 = client.post(
            f"/api/v1/tasks/{biz_id}/queue",
            json={"description": objective, "priority": 1}
        )
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2["status"] == "already_running"
        assert data2["task_id"] == first_task_id
        # Background task was NOT scheduled a second time
        assert mock_bg_run.call_count == 1


def test_concurrent_queue_task_requests_race_condition():
    """Tests that concurrent threads firing identical tasks simultaneously are locked and only 1 task is created."""
    client = TestClient(app)
    biz_id = "test-biz-dedup-race"
    objective = "Deploy new AI onboarding flow to production cluster"

    with patch("app.api.routes.tasks.run_team_task_bg") as mock_bg_run:
        def fire_request():
            return client.post(
                f"/api/v1/tasks/{biz_id}/queue",
                json={"description": objective, "priority": 0}
            )

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(fire_request) for _ in range(5)]
            responses = [f.result() for f in futures]

        statuses = [r.json().get("status") for r in responses]
        success_count = statuses.count("success")
        already_running_count = statuses.count("already_running")

        # Exactly 1 request succeeds in creating the task, the other 4 get already_running
        assert success_count == 1
        assert already_running_count == 4
        assert mock_bg_run.call_count == 1


def test_team_runner_and_bg_guard():
    """Tests belt-and-suspenders guard in run_team_task_bg and TeamRunner.start."""
    ts = TaskService()
    biz_id = "test-biz-dedup-runner"
    objective = "Sync Stripe subscriptions to Google Sheet master ledger"

    # Create task 1 (running)
    t1 = ts.create_task(business_id=biz_id, description=objective, status="running")

    # Create task 2 (queued duplicate that somehow bypassed HTTP)
    t2 = ts.create_task(business_id=biz_id, description=objective, status="queued")

    with patch("app.agents.runner.create_team_graph") as mock_graph:
        # Calling run_team_task_bg for t2 should abort immediately
        run_team_task_bg(biz_id, t2["id"], objective)

        # Team graph was not created or executed for t2
        mock_graph.assert_not_called()

        # Task 2 was marked failed/aborted
        t2_updated = ts.get_task(t2["id"])
        assert t2_updated["status"] == "failed"
        assert "duplicate" in str(t2_updated.get("result", "")).lower()
