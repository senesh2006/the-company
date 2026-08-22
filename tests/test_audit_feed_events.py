import pytest
from app.services.task_service import TaskService
from app.services.shared_memory import SharedMemoryService
from app.agents.supervisor import global_supervisor_node
from app.agents.state import OrchestratorState, TaskNode
from langchain_core.messages import HumanMessage
from unittest.mock import patch, MagicMock


def test_handoff_and_memory_update_audit_events():
    """
    Tests that Handoff and Memory Updated audit events are properly emitted,
    contain structured details (from_agent, to_agent, trigger_messages),
    and appear in the Company Feed.
    """
    ts = TaskService()
    biz_id = "00000000-0000-0000-0000-000000000001"

    # 1. Test Handoff event emission
    handoff_entry = ts.log_audit_event(
        business_id=biz_id,
        role="Personal Assistant",
        agent_name="Personal Assistant",
        trust_tier="operate",
        mandate="Audit runway for Q3",
        action="Handoff",
        details={
            "from_agent": {"name": "Personal Assistant", "role": "Personal Assistant"},
            "to_agent": {"name": "Finance Manager", "role": "Finance Manager"},
            "target_role": "Finance Manager",
            "task_description": "Audit runway for Q3"
        }
    )

    assert handoff_entry["action"] == "Handoff"
    assert handoff_entry["details"]["target_role"] == "Finance Manager"
    assert handoff_entry["details"]["from_agent"]["role"] == "Personal Assistant"
    assert handoff_entry["details"]["to_agent"]["role"] == "Finance Manager"

    # 2. Test Memory Updated event emission via SharedMemoryService
    mem = SharedMemoryService()
    mem_record = mem.set(
        business_id=biz_id,
        key="test_workflow_context",
        value={"summary": "Updated pricing model guidelines for 2026", "messages": ["User requested pricing review"]},
        updated_by="Marketing Manager"
    )

    feed = ts.list_audit_feed(biz_id, limit=20)
    actions = [e["action"] for e in feed]
    
    assert "Handoff" in actions
    assert "Memory Updated" in actions

    mem_entry = next((e for e in feed if e["action"] == "Memory Updated" and e.get("details", {}).get("memory_key") == "test_workflow_context"), None)
    assert mem_entry is not None
    assert mem_entry["details"]["agent_name"] == "Marketing Manager"
    assert len(mem_entry["details"]["trigger_messages"]) > 0
