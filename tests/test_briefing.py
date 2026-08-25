import pytest
from unittest.mock import MagicMock, patch
from app.services.briefing_service import BriefingService
from app.services.shared_memory import SharedMemoryService
from app.services.task_service import TaskService

DEFAULT_BUSINESS_ID = "00000000-0000-0000-0000-000000000001"


@pytest.fixture
def mock_deps():
    mem = MagicMock(spec=SharedMemoryService)
    mem.get.return_value = None
    mem.set.return_value = None

    tasks = MagicMock(spec=TaskService)
    tasks.list_tasks.return_value = []
    tasks.list_audit_feed.return_value = []
    tasks.list_agents.return_value = []

    return mem, tasks


def test_briefing_generation_fallback_safety(mock_deps):
    mem, tasks = mock_deps
    service = BriefingService(memory_service=mem, task_service=tasks)

    # Force fallback by mocking LLM to fail
    with patch("app.services.briefing_service.get_fast_llm") as mock_llm:
        mock_llm.side_effect = Exception("LLM connection timeout")
        briefing = service.get_today_briefing(DEFAULT_BUSINESS_ID, force_refresh=True)

        assert briefing is not None
        assert "headline" in briefing
        assert "executive_summary" in briefing
        assert "metrics" in briefing
        assert briefing["metrics"]["completed_tasks_count"] == 0
        assert briefing["metrics"]["total_revenue"] == 0.0
