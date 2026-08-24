import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.assistant_service import PersonalAssistantService


client = TestClient(app)


import asyncio

def test_assistant_service_conversational_chat():
    """Test that small talk and greetings return chat_reply without creating a task."""
    service = PersonalAssistantService()
    
    mock_llm_response = MagicMock()
    mock_llm_response.content = '{"is_task": false, "intent_summary": "Friendly greeting", "reply": "Hello Founder! How can I help you today?", "task_title": null, "task_description": null, "assignee_role": "Personal Assistant", "priority": "P1"}'
    
    with patch("app.services.assistant_service.get_fast_llm") as mock_get_llm, \
         patch.object(service.task_service, "create_task") as mock_create_task:
        
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = mock_llm_response
        mock_get_llm.return_value = mock_llm

        res = asyncio.run(service.process_chat(
            message="Hey there! How is everything running?",
            business_id="00000000-0000-0000-0000-000000000001",
            sender_name="Founder",
            channel="web"
        ))

        assert res["is_task"] is False
        assert res["type"] == "chat_reply"
        assert "Hello Founder" in res["reply"]
        mock_create_task.assert_not_called()


def test_assistant_service_actionable_task_dispatch():
    """Test that actionable mandates trigger task creation and background execution."""
    service = PersonalAssistantService()

    mock_llm_response = MagicMock()
    mock_llm_response.content = '{"is_task": true, "intent_summary": "Financial audit mandate", "reply": "I am dispatching this invoice audit to our Finance Manager right away.", "task_title": "Audit Stripe Invoices for Q2", "task_description": "Audit all Stripe invoices and calculate outstanding revenue for Q2.", "assignee_role": "Finance Manager", "priority": "P0"}'

    with patch("app.services.assistant_service.get_fast_llm") as mock_get_llm, \
         patch.object(service.task_service, "create_task") as mock_create_task, \
         patch.object(service.task_service, "log_audit_event") as mock_log_audit, \
         patch("app.services.assistant_service.TeamRunner") as mock_runner:

        mock_llm = MagicMock()
        mock_llm.invoke.return_value = mock_llm_response
        mock_get_llm.return_value = mock_llm

        mock_create_task.return_value = {"id": "task-test-123", "description": "Audit Stripe Invoices for Q2"}

        res = asyncio.run(service.process_chat(
            message="Audit all Stripe invoices and calculate outstanding revenue for Q2.",
            business_id="00000000-0000-0000-0000-000000000001",
            sender_name="Founder",
            channel="web"
        ))

        assert res["is_task"] is True
        assert res["type"] == "task_dispatched"
        assert res["task_id"] == "task-test-123"
        assert res["assignee_role"] == "Finance Manager"
        mock_create_task.assert_called_once()
        mock_log_audit.assert_called_once()


def test_api_assistant_chat_endpoint_conversational():
    """Test the POST /api/v1/assistant/chat HTTP endpoint for conversational message."""
    with patch("app.services.assistant_service.assistant_service.process_chat", new_callable=AsyncMock) as mock_process:
        mock_process.return_value = {
            "type": "chat_reply",
            "reply": "Good morning! All systems and agents are operating smoothly.",
            "is_task": False
        }

        response = client.post(
            "/api/v1/assistant/chat",
            json={"message": "Good morning assistant!"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "chat_reply"
        assert data["is_task"] is False
        assert "Good morning" in data["reply"]


def test_api_assistant_chat_endpoint_task_dispatched():
    """Test the POST /api/v1/assistant/chat HTTP endpoint for actionable task."""
    with patch("app.services.assistant_service.assistant_service.process_chat", new_callable=AsyncMock) as mock_process:
        mock_process.return_value = {
            "type": "task_dispatched",
            "reply": "Dispatching to Marketing Manager...",
            "is_task": True,
            "task_id": "task-abc-456",
            "assignee_role": "Marketing Manager"
        }

        response = client.post(
            "/api/v1/assistant/chat",
            json={"message": "Draft a marketing campaign for product launch"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "task_dispatched"
        assert data["is_task"] is True
        assert data["task_id"] == "task-abc-456"


def test_waha_webhook_personal_assistant_chat():
    """Test that WAHA webhook routes incoming chat through Personal Assistant and sends response."""
    from app.services.waha_service import waha_service

    payload = {
        "event": "message",
        "session": "default",
        "payload": {
            "from": "94765236834@c.us",
            "body": "Hello assistant!",
            "_data": {"notifyName": "Senesh"}
        }
    }

    with patch("app.services.assistant_service.assistant_service.process_chat", new_callable=AsyncMock) as mock_process, \
         patch.object(waha_service, "send_text", new_callable=AsyncMock) as mock_send_text:

        mock_process.return_value = {
            "type": "chat_reply",
            "reply": "Hello Senesh! Ready to assist.",
            "is_task": False
        }

        res = asyncio.run(waha_service.handle_webhook_event(payload))
        assert res["status"] == "chat_replied"
        assert res["is_task"] is False
        mock_send_text.assert_called_once()
