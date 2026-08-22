import asyncio
import json
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.task_stream_bus import TaskStreamBroadcaster
from app.agents.runner import TeamRunner
from app.api.deps import get_current_user


@pytest.fixture
def mock_user():
    return {
        "id": "user-test-123",
        "email": "tester@company.com",
        "business_id": "00000000-0000-0000-0000-000000000001"
    }


@pytest.fixture
def client(mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_task_broadcaster_publish_and_subscribe():
    async def _test():
        broadcaster = TaskStreamBroadcaster()
        task_id = "test-task-1"

        # Publish an event before subscription (tests historical replay)
        await broadcaster.publish(task_id, {
            "node": "start",
            "status": "running",
            "content": {"mandate": "Test Mandate"}
        })

        # Subscribe and verify receipt of historical event + new event
        events_received = []

        async def collect_events():
            async for ev in broadcaster.subscribe(task_id, timeout=1.0):
                events_received.append(ev)

        collector_task = asyncio.create_task(collect_events())

        # Allow subscriber to attach and get history
        await asyncio.sleep(0.05)

        # Publish live event
        await broadcaster.publish(task_id, {
            "node": "global_supervisor",
            "status": "completed",
            "content": {"thoughts": "Planning steps..."}
        })

        # Publish termination event
        await broadcaster.publish(task_id, {
            "node": "end",
            "status": "completed",
            "content": {"result": "Done!"}
        })

        await asyncio.wait_for(collector_task, timeout=2.0)

        assert len(events_received) == 3
        assert events_received[0]["node"] == "start"
        assert events_received[1]["node"] == "global_supervisor"
        assert events_received[2]["node"] == "end"

    asyncio.run(_test())


def test_task_broadcaster_already_completed_task():
    async def _test():
        broadcaster = TaskStreamBroadcaster()
        task_id = "completed-task-1"

        # Publish completion
        await broadcaster.publish(task_id, {
            "node": "end",
            "status": "completed",
            "content": {"result": "Completed prior"}
        })

        events = []
        async for ev in broadcaster.subscribe(task_id, timeout=0.5):
            events.append(ev)

        assert len(events) == 1
        assert events[0]["node"] == "end"
        assert events[0]["status"] == "completed"

    asyncio.run(_test())


def test_sse_endpoint_404_on_missing_task(client):
    with patch("app.api.routes.tasks.task_service.get_task", return_value=None):
        resp = client.get("/api/v1/tasks/00000000-0000-0000-0000-000000000001/missing-task-id/stream")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Task not found"


def test_sse_endpoint_completed_task_emits_single_event(client):
    completed_task = {
        "id": "done-task-id",
        "business_id": "00000000-0000-0000-0000-000000000001",
        "status": "completed",
        "description": "Generate Financial Audit",
        "result": "Trial balance verified balanced with $0 variance.",
        "updated_at": "2026-08-22T08:00:00Z"
    }

    with patch("app.api.routes.tasks.task_service.get_task", return_value=completed_task):
        resp = client.get(f"/api/v1/tasks/{completed_task['business_id']}/{completed_task['id']}/stream")
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/event-stream")

        lines = [line.strip() for line in resp.text.split("\n") if line.strip()]
        assert len(lines) >= 1
        assert lines[0].startswith("data:")
        
        event_data = json.loads(lines[0][5:].strip())
        assert event_data["node"] == "end"
        assert event_data["status"] == "completed"
        assert "Trial balance" in event_data["content"]["result"]


def test_team_runner_stream_execution():
    async def _test():
        runner = TeamRunner("00000000-0000-0000-0000-000000000001", "stream-test-task-123")
        
        # Mock task_service methods
        runner.task_service.list_agents = MagicMock(return_value=[
            {"id": "agent-1", "name": "Accountant", "role": "Accountant", "model": None}
        ])
        runner.task_service.update_task_status = MagicMock()
        runner.task_service.complete_task = MagicMock()
        runner.task_service.update_agent_status = MagicMock()

        # Mock compiled graph astream
        async def fake_astream(initial_state, config, stream_mode):
            yield {
                "global_supervisor": {
                    "supervisor_thoughts": ["Supervisor planned the mandate."],
                    "task_graph": {
                        "sub-1": {"id": "sub-1", "description": "Review accounts", "assignee_role": "Accountant"}
                    }
                }
            }
            yield {
                "worker_agent-1": {
                    "worker_results": [
                        {"agent_id": "agent-1", "agent_role": "Accountant", "output": "Accounts reviewed."}
                    ]
                }
            }
            yield {
                "executive_synthesis": {
                    "messages": [MagicMock(content="Executive synthesis complete.")]
                }
            }

        mock_compiled = MagicMock()
        mock_compiled.astream = fake_astream

        with patch.object(runner.graph, "compile", return_value=mock_compiled):
            yielded_events = []
            async for ev in runner.stream("Analyze monthly payroll"):
                yielded_events.append(ev)

            assert len(yielded_events) == 5
            assert yielded_events[0]["node"] == "start"
            assert yielded_events[1]["node"] == "global_supervisor"
            assert yielded_events[2]["node"] == "worker_agent-1"
            assert yielded_events[3]["node"] == "executive_synthesis"
            assert yielded_events[4]["node"] == "end"
            assert yielded_events[4]["status"] == "completed"

            runner.task_service.complete_task.assert_called_once_with("stream-test-task-123")

    asyncio.run(_test())
