import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.briefing_service import BriefingService

class TestBriefing(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.business_id = "00000000-0000-0000-0000-000000000001"

    def test_briefing_service_fallback_generation(self):
        service = BriefingService()
        briefing = service.get_today_briefing(self.business_id, force_refresh=True)
        
        self.assertIn("headline", briefing)
        self.assertIn("executive_summary", briefing)
        self.assertIn("marketing_update", briefing)
        self.assertIn("finance_update", briefing)
        self.assertIn("completed_milestones", briefing)
        self.assertIn("todays_priorities", briefing)
        self.assertIn("metrics", briefing)
        self.assertIsInstance(briefing["completed_milestones"], list)
        self.assertIsInstance(briefing["todays_priorities"], list)

    def test_briefing_api_endpoint(self):
        response = self.client.get("/api/v1/briefing/today")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("headline", data)
        self.assertIn("executive_summary", data)
        self.assertIn("marketing_update", data)
        self.assertIn("finance_update", data)

    def test_briefing_refresh_endpoint(self):
        response = self.client.post("/api/v1/briefing/refresh")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("headline", data)
        self.assertIn("period", data)

if __name__ == "__main__":
    unittest.main()
