import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch

from app.services.routine_service import RoutineService, DEFAULT_BUSINESS_ID
from app.services.shared_memory import SharedMemoryService


@pytest.fixture
def mock_memory():
    store = {}

    def mock_get(business_id, key):
        val = store.get(f"{business_id}:{key}")
        if val is not None:
            return {"key": key, "value": val}
        return None

    def mock_set(business_id, key, value, **kwargs):
        store[f"{business_id}:{key}"] = value
        return {"key": key, "value": value}

    svc = MagicMock(spec=SharedMemoryService)
    svc.get.side_effect = mock_get
    svc.set.side_effect = mock_set
    return svc


def test_create_and_list_routine(mock_memory):
    service = RoutineService(memory_service=mock_memory)
    
    routine = service.create_routine(
        business_id=DEFAULT_BUSINESS_ID,
        title="Daily Financial Audit",
        description="Audit ledger and check trial balance.",
        assignee_role="Finance Manager",
        schedule_type="daily",
        schedule_config={"time": "09:00"},
        priority="high",
        is_active=True
    )

    assert routine["id"].startswith("routine_")
    assert routine["title"] == "Daily Financial Audit"
    assert routine["assignee_role"] == "Finance Manager"
    assert routine["is_active"] is True
    assert routine["next_run_at"] is not None

    # List routines
    all_routines = service.list_routines(DEFAULT_BUSINESS_ID)
    assert len(all_routines) == 1
    assert all_routines[0]["id"] == routine["id"]


def test_update_and_toggle_routine(mock_memory):
    service = RoutineService(memory_service=mock_memory)
    
    created = service.create_routine(
        business_id=DEFAULT_BUSINESS_ID,
        title="Hourly Triage",
        schedule_type="hourly",
        is_active=True
    )

    # Pause routine
    updated = service.toggle_routine(DEFAULT_BUSINESS_ID, created["id"], is_active=False)
    assert updated["is_active"] is False

    # Resume routine
    resumed = service.toggle_routine(DEFAULT_BUSINESS_ID, created["id"], is_active=True)
    assert resumed["is_active"] is True


def test_delete_routine(mock_memory):
    service = RoutineService(memory_service=mock_memory)
    
    r1 = service.create_routine(business_id=DEFAULT_BUSINESS_ID, title="Routine 1")
    r2 = service.create_routine(business_id=DEFAULT_BUSINESS_ID, title="Routine 2")
    assert len(service.list_routines(DEFAULT_BUSINESS_ID)) == 2

    # Delete r1
    success = service.delete_routine(DEFAULT_BUSINESS_ID, r1["id"])
    assert success is True

    remaining = service.list_routines(DEFAULT_BUSINESS_ID)
    assert len(remaining) == 1
    assert remaining[0]["id"] == r2["id"]


@patch("app.services.routine_service.dispatch_worker_direct")
def test_execute_routine(mock_worker, mock_memory):
    mock_worker.return_value = {
        "status": "completed",
        "output": "Financial audit passed with 0 discrepancies."
    }

    service = RoutineService(memory_service=mock_memory)
    routine = service.create_routine(
        business_id=DEFAULT_BUSINESS_ID,
        title="Audit Routine",
        description="Verify ledger debits equal credits",
        assignee_role="Finance Manager"
    )

    result = service.execute_routine(DEFAULT_BUSINESS_ID, routine["id"])
    assert result["status"] == "completed"
    assert result["routine_id"] == routine["id"]
    assert "Financial audit passed" in result["result_summary"]

    # Verify updated routine state
    updated = service.get_routine(DEFAULT_BUSINESS_ID, routine["id"])
    assert updated["run_count"] == 1
    assert updated["last_status"] == "completed"
    assert updated["last_run_at"] is not None
