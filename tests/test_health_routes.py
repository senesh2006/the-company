import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch, MagicMock

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_llm_health_check_endpoint():
    with patch("app.core.config.settings.GROQ_API_KEY", "gsk_test1234567890"), \
         patch("langchain_openai.ChatOpenAI.invoke") as mock_invoke:
        mock_resp = MagicMock()
        mock_resp.content = "OK"
        mock_invoke.return_value = mock_resp

        response = client.get("/api/v1/health/llm")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        assert "groq" in data["providers"]
        assert data["providers"]["groq"]["configured"] is True
        assert data["providers"]["groq"]["status"] == "ok"
