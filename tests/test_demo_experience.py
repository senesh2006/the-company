import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.api.routes.tasks import reset_demo_rate_limits, DEMO_MAX_TASKS_PER_WINDOW
from scripts.reset_demo_account import reset_demo_state

def test_demo_login_endpoint():
    """Verify /demo/login returns a valid JWT token scoped to DEMO_BUSINESS_ID."""
    client = TestClient(app)
    
    # Test POST /demo/login and /api/v1/demo/login
    for path in ["/demo/login", "/api/v1/demo/login"]:
        response = client.post(path)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"
        assert "access_token" in data
        assert data.get("token_type") == "bearer"
        assert data.get("business_id") == settings.DEMO_BUSINESS_ID
        assert data.get("user", {}).get("email") == settings.DEMO_EMAIL

        # Test token validity against protected endpoints
        token = data["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}
        
        status_resp = client.get("/api/v1/onboarding/status", headers=auth_headers)
        assert status_resp.status_code == 200
        assert status_resp.json().get("business_id") == settings.DEMO_BUSINESS_ID

def test_demo_business_rate_limiting():
    """Verify demo business_id is rate limited to 3 tasks per 10 minutes, while others are not."""
    client = TestClient(app)
    demo_biz = settings.DEMO_BUSINESS_ID
    reset_demo_rate_limits()

    # Log in as demo user to get valid token
    login_resp = client.post("/api/v1/demo/login")
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Dispatch up to max tasks
    for i in range(DEMO_MAX_TASKS_PER_WINDOW):
        resp = client.post(
            f"/api/v1/tasks/{demo_biz}/queue",
            json={"description": f"Judge Demo Verification Task #{i+1} ({time_str(i)})", "priority": 1},
            headers=headers
        )
        assert resp.status_code == 200, f"Task {i+1} should succeed, got {resp.status_code}: {resp.text}"

    # 4th task dispatch should trigger 429 Too Many Requests
    excess_resp = client.post(
        f"/api/v1/tasks/{demo_biz}/queue",
        json={"description": "Excess demo judge task exceeding quota", "priority": 1},
        headers=headers
    )
    assert excess_resp.status_code == 429
    assert "Demo rate limit reached" in excess_resp.json()["detail"]

    # Non-demo business ID should NOT be blocked by demo rate limit
    non_demo_biz = "99999999-9999-9999-9999-999999999999"
    non_demo_resp = client.post(
        f"/api/v1/tasks/{non_demo_biz}/queue",
        json={"description": "Independent non-demo task", "priority": 1},
        headers=headers
    )
    # Status should be 200 (not 429)
    assert non_demo_resp.status_code == 200

    # Reset rate limits again
    reset_demo_rate_limits()

def time_str(idx: int) -> str:
    import time
    return f"{int(time.time())}_{idx}"
