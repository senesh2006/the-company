import asyncio
import uuid
from typing import Dict
from unittest.mock import AsyncMock, MagicMock, patch

from app.agents.state import OrchestratorState, TaskNode, WorkerResult
from app.agents.workers import make_specialist_worker_node
from app.services.shared_memory import SharedMemoryService
from app.services.waha_service import WAHAService


def test_specialist_company_rep_unit_test():
    """
    Unit Test: Specialist Company Representative Worker Node Execution.
    Mocks internal LLM analyzer and ReAct agent calls to test control flow, 
    task status transitions, shared context integration, and result generation.
    """
    print("\n=== Running Unit Test: Specialist Company Representative Worker Node ===")
    
    agent_data = {
        "id": "rep_agent_001",
        "name": "Alex (Company Rep)",
        "role": "Customer Support Representative",
        "trust_tier": "assist",
        "business_id": "00000000-0000-0000-0000-000000000001"
    }

    task_id = str(uuid.uuid4())
    task = TaskNode(
        id=task_id,
        description="Respond to customer query regarding pricing plans and refund policies.",
        status="running",
        assignee_id="rep_agent_001",
        assignee_role="Customer Support Representative"
    )

    state: OrchestratorState = {
        "business_id": "00000000-0000-0000-0000-000000000001",
        "task_graph": {task.id: task},
        "worker_results": [],
        "messages": [],
        "iteration_count": 0,
        "shared_context": {"policy": "Full refunds within 30 days."}
    }

    # Mock TaskService DB operations and LLM invocation
    with patch("app.agents.workers.task_service") as mock_task_service, \
         patch("app.agents.workers.get_complexity_analyzer") as mock_analyzer, \
         patch("app.agents.workers.create_react_agent") as mock_create_agent:

        # Mock analyzer decision
        mock_decision = MagicMock()
        mock_decision.decision = "execute_directly"
        mock_decision.thoughts = "Customer query is straightforward, handle directly."
        mock_analyzer.return_value.invoke.return_value = mock_decision

        # Mock agent output message
        mock_msg = MagicMock()
        mock_msg.content = "Thank you for reaching out! We offer full refunds within 30 days of purchase."
        mock_msg.tool_calls = []
        mock_msg.type = "ai"
        
        mock_agent_instance = MagicMock()
        mock_agent_instance.invoke.return_value = {"messages": [mock_msg]}
        mock_create_agent.return_value = mock_agent_instance

        # Build worker node
        rep_node = make_specialist_worker_node(agent_data)

        # Execute node
        result = rep_node(state)

        # Assertions
        assert "worker_results" in result, "Worker results missing"
        assert len(result["worker_results"]) == 1, "Expected 1 WorkerResult"
        
        res: WorkerResult = result["worker_results"][0]
        assert res.agent_id == "rep_agent_001"
        assert res.role == "Customer Support Representative"
        assert res.status == "completed"
        assert "Thank you for reaching out!" in res.output
        assert "<thought>" in res.output, "Output should contain formatted reasoning trace"

        # Verify task service updates were triggered
        assert mock_task_service.update_task_result.called
        assert mock_task_service.record_task_verdict.called


def test_waha_company_rep_webhook_ingestion():
    """
    Integration/Unit Test: WAHA Inbound WhatsApp Company Representative Webhook Ingestion.
    Verifies that an incoming message from a customer is stored in shared memory,
    creates a task mandate, logs an audit event, and returns an automated receipt message.
    """
    print("\n=== Running Test: WAHA Inbound Webhook (Company Rep Service) ===")

    async def _run():
        waha = WAHAService(base_url="http://mock-waha:3000", api_key="test_key")

        mock_webhook_payload = {
            "event": "message",
            "session": "default",
            "payload": {
                "fromMe": False,
                "from": "+15551234567@c.us",
                "body": "Can someone help me set up an enterprise account?",
                "timestamp": 1700000000,
                "_data": {
                    "notifyName": "Jane Founder"
                }
            }
        }

        with patch("app.services.shared_memory.SharedMemoryService.set") as mock_mem_set, \
             patch("app.services.task_service.TaskService.create_task") as mock_create_task, \
             patch("app.services.task_service.TaskService.list_agents") as mock_list_agents, \
             patch("app.services.task_service.TaskService.log_audit_event") as mock_audit, \
             patch("app.agents.runner.TeamRunner") as mock_team_runner_class, \
             patch("app.services.waha_service.WAHAService.send_text", new_callable=AsyncMock) as mock_send_text:

            mock_create_task.return_value = {"id": "mock_task_123"}
            mock_list_agents.return_value = [{"id": "agent_1", "role": "Personal Assistant", "name": "Alex"}]
            mock_send_text.return_value = {"success": True}

            response = await waha.handle_webhook_event(mock_webhook_payload)

            # Assert memory set was invoked for WhatsApp communication tracking
            assert mock_mem_set.called, "Shared Memory was not updated with inbound WhatsApp message"
            
            # Check call arguments to memory
            calls = mock_mem_set.call_args_list
            keys_set = [call.kwargs.get("key") for call in calls]
            assert any("whatsapp_last_msg_" in k for k in keys_set if k), "Message key not stored in memory"

            # Assert task creation and acknowledgment
            assert mock_create_task.called, "Task creation failed"
            assert mock_send_text.called, "WhatsApp reply not sent"

            assert response.get("status") in ["processed", "mandate_dispatched", "ignored"]
            print(f"Webhook response: {response}")

    asyncio.run(_run())


if __name__ == "__main__":
    test_specialist_company_rep_unit_test()
    test_waha_company_rep_webhook_ingestion()
    print("\nAll Company Rep tests passed successfully!")
