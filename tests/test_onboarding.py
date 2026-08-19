import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestOnboardingEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_onboarding_status(self):
        response = self.client.get("/api/v1/onboarding/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("completed", data)
        self.assertIn("business_id", data)

    def test_complete_onboarding_flow(self):
        payload = {
            "company_name": "Antigravity Cloud Corp",
            "website_url": "https://antigravity.example.com",
            "industry": "B2B SaaS & Cloud",
            "stage": "Seed / Early Growth",
            "target_audience": "Enterprise Engineers & CTOs",
            "primary_goals": [
                "Accelerate Inbound Pipeline & SEO",
                "Ship Features & Automate Code Reviews"
            ],
            "top_bottlenecks": ["Manual operational overhead"],
            "brand_voice": "Professional, modern, and data-driven",
            "refund_policy_terms": "30-day full refund guarantee.",
            "sla_guarantees": "99.9% uptime SLA.",
            "data_retention_policy": "90-day encrypted retention.",
            "knowledge_snippets": ["Enterprise plan includes dedicated Slack channel."],
            "monthly_budget_usd": 3000.0,
            "approval_threshold_usd": 600.0
        }
        response = self.client.post("/api/v1/onboarding/complete", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["company_name"], "Antigravity Cloud Corp")
        self.assertIn("company_profile", data["memory_keys_created"])
        self.assertIn("refund_policy", data["memory_keys_created"])
        self.assertIn("sla_guarantees", data["memory_keys_created"])

if __name__ == "__main__":
    unittest.main()
