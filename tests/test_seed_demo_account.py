import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from scripts.seed_demo_account import DemoSeedRunner, BUSINESS_PROFILE, WORKER_ROLES, JOURNAL_ENTRIES, DEMO_DOCUMENTS, DEMO_TASKS, DOCS_DIR

def test_demo_documents_exist():
    """Verify all required demo document files exist and have valid content."""
    for doc in DEMO_DOCUMENTS:
        file_path = DOCS_DIR / doc["file_name"]
        assert file_path.exists(), f"Demo document {doc['file_name']} missing"
        assert file_path.stat().st_size > 50, f"Demo document {doc['file_name']} is too small"

def test_seed_demo_account_end_to_end():
    """Verify DemoSeedRunner executes all 7 steps end-to-end through FastAPI routes."""
    client = TestClient(app)

    runner = DemoSeedRunner(base_url="http://testserver")
    # Redirect runner's requests.Session calls to FastAPI TestClient
    runner.session = client

    # Mock the internal _request method to route through TestClient
    def test_request(method: str, path: str, is_json: bool = True, **kwargs):
        endpoint = runner._url(path)
        headers = {**runner._headers(is_json=is_json), **kwargs.pop("headers", {})}
        
        # TestClient uses client.request
        resp = client.request(method, endpoint, headers=headers, **kwargs)
        if not (200 <= resp.status_code < 300):
            raise RuntimeError(f"Request failed: {method.upper()} {endpoint} returned status {resp.status_code}: {resp.text}")
        return resp

    runner._request = test_request

    # Execute end-to-end run
    runner.run()

    # Validate statistics
    assert runner.stats["agents_hired"] == len(WORKER_ROLES)
    assert runner.stats["journal_entries_posted"] == len(JOURNAL_ENTRIES)
    assert runner.stats["documents_uploaded"] >= 1
    assert runner.stats["tasks_queued"] == len(DEMO_TASKS)
    assert runner.business_id is not None
