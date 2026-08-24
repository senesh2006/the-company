import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.tool_discovery_service import ToolDiscoveryService, DynamicConnectedTool
from app.agents.tool_registry import ToolRegistry, BaseTool

client = TestClient(app)


def test_tool_discovery_service_connected_toolkits():
    """Test discovering connected toolkits from Google Sheets and Composio."""
    service = ToolDiscoveryService()

    with patch("app.services.tool_discovery_service.GoogleSheetsService") as mock_gs, \
         patch("app.services.tool_discovery_service.composio_service") as mock_comp:

        mock_gs_instance = MagicMock()
        mock_gs_instance.get_config.return_value = {
            "mode": "live_api",
            "spreadsheet_url": "https://docs.google.com/spreadsheets/d/test1234/edit",
            "spreadsheet_title": "Test Ledger"
        }
        mock_gs.return_value = mock_gs_instance

        mock_comp.list_user_connections.return_value = [
            {"toolkit": "gmail", "name": "Gmail", "status": "connected", "category": "Communication"},
            {"toolkit": "slack", "name": "Slack", "status": "connected", "category": "Collaboration"}
        ]

        toolkits = service.discover_connected_toolkits(user_id="user-1", business_id="biz-1")
        assert len(toolkits) == 3
        slugs = {t["toolkit"] for t in toolkits}
        assert "googlesheets" in slugs
        assert "gmail" in slugs
        assert "slack" in slugs


def test_tool_discovery_service_dynamic_tools():
    """Test dynamic tool construction for connected services."""
    service = ToolDiscoveryService()

    with patch.object(service, "discover_connected_toolkits") as mock_disc:
        mock_disc.return_value = [
            {"toolkit": "googlesheets", "name": "Google Sheets", "status": "connected"},
            {"toolkit": "gmail", "name": "Gmail", "status": "connected"},
            {"toolkit": "slack", "name": "Slack", "status": "connected"}
        ]

        tools = service.discover_tools_for_user(business_id="biz-1", user_id="user-1")
        assert len(tools) >= 3

        tool_names = {t.name for t in tools}
        assert "google_sheets" in tool_names
        assert "gmail_send_email" in tool_names
        assert "slack_send_message" in tool_names


def test_tool_registry_dynamic_discovery():
    """Test that ToolRegistry.get_tools dynamically discovers tools when user_id/business_id is provided."""
    reg = ToolRegistry()

    with patch("app.services.tool_discovery_service.tool_discovery_service.discover_tools_for_user") as mock_disc:
        mock_tool = MagicMock(spec=BaseTool)
        mock_tool.name = "dynamic_slack_tool"
        mock_tool.to_langchain_tool.return_value = MagicMock()
        mock_disc.return_value = [mock_tool]

        tools = reg.get_tools("Finance Manager", business_id="biz-1", user_id="user-1")
        assert any(t.name == "dynamic_slack_tool" for t in tools)


def test_api_discovered_tools_endpoint():
    """Test GET /api/v1/connections/discovered-tools endpoint."""
    with patch("app.services.tool_discovery_service.tool_discovery_service.get_discovered_tool_manifest") as mock_manifest:
        mock_manifest.return_value = {
            "business_id": "00000000-0000-0000-0000-000000000001",
            "user_id": "00000000-0000-0000-0000-000000000001",
            "connected_toolkits": [
                {"toolkit": "googlesheets", "name": "Google Sheets", "status": "connected"}
            ],
            "connected_toolkits_count": 1,
            "discovered_tools": [
                {"name": "google_sheets", "toolkit": "googlesheets", "description": "Manage spreadsheets"}
            ],
            "total_discovered_tools": 1
        }

        response = client.get("/api/v1/connections/discovered-tools")
        assert response.status_code == 200
        data = response.json()
        assert data["connected_toolkits_count"] == 1
        assert len(data["discovered_tools"]) == 1
        assert data["discovered_tools"][0]["name"] == "google_sheets"
