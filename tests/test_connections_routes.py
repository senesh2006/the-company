import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import User, get_current_user


class TestConnectionsRoutes(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_user = User(
            id="00000000-0000-0000-0000-000000000001",
            email="founder@companyos.ai",
            role="founder",
            business_id="00000000-0000-0000-0000-000000000001"
        )
        app.dependency_overrides[get_current_user] = lambda: self.mock_user

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_list_connections(self):
        """GET /api/v1/connections should return list of toolkits."""
        response = self.client.get("/api/v1/connections")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("connections", data)
        self.assertIn("total_count", data)
        toolkits = [c["toolkit"] for c in data["connections"]]
        self.assertIn("gmail", toolkits)
        self.assertIn("slack", toolkits)

    def test_initiate_connection(self):
        """POST /api/v1/connections/initiate should return redirect_url."""
        response = self.client.post(
            "/api/v1/connections/initiate",
            json={"toolkit": "gmail", "redirect_url": "http://localhost:3000/callback"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("redirect_url", data)
        self.assertEqual(data["toolkit"], "gmail")
        self.assertEqual(data["status"], "pending")

    def test_connection_callback(self):
        """GET /api/v1/connections/callback should update status and redirect to frontend."""
        response = self.client.get(
            "/api/v1/connections/callback?toolkit=gmail&status=connected",
            follow_redirects=False
        )
        self.assertEqual(response.status_code, 302)
        self.assertIn("/integrations?connected=gmail&status=connected", response.headers["location"])

    def test_disconnect_connection(self):
        """DELETE /api/v1/connections/{toolkit} should disconnect."""
        response = self.client.delete("/api/v1/connections/gmail")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "disconnected")
        self.assertEqual(data["toolkit"], "gmail")


if __name__ == "__main__":
    unittest.main()
