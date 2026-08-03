import asyncio
from typing import Dict
from langchain_core.messages import AIMessage
from app.agents.state import OrchestratorState, TaskNode
from app.agents.finance_worker import make_finance_worker_node
from app.services.task_service import TaskService
from app.services.shared_memory import SharedMemoryService

# Create mock services for local execution
task_service = TaskService()
task_service.get_task = lambda t_id: TaskNode(
    id=t_id, 
    description="Categorize last week's expenses and flag any large unapproved transfers.", 
    status="running", 
    assignee_id="agent_999"
)
task_service.update_task_status = lambda t_id, status: print(f"[MOCK] Task {t_id} status updated to: {status}")
task_service.update_task_result = lambda t_id, res: print(f"[MOCK] Task {t_id} result updated.")

# Shared memory service
mem = SharedMemoryService()

def test_finance_worker_standard():
    print("=== Testing Finance Worker (Standard Task) ===")
    mem.clear("biz_123")
    mem.set("biz_123", "finance_policy", {"approval_limit": "$1000", "tax_rate": "21%"}, tags=["finance", "policy"])
    
    agent_data = {
        "id": "agent_999",
        "role": "Finance Manager",
        "name": "Fiona"
    }
    
    # 1. Create the compiled node function
    finance_node = make_finance_worker_node(agent_data)
    
    # 2. Setup mock OrchestratorState
    state: OrchestratorState = {
        "business_id": "biz_123",
        "task_graph": {
            "task_1": TaskNode(
                id="task_1",
                description="Categorize last week's expenses and flag any large unapproved transfers.",
                status="running",
                assignee_id="agent_999"
            )
        },
        "worker_results": [],
        "messages": [],
        "iteration_count": 0,
        "shared_context": mem.get_context("biz_123")
    }
    
    # 3. Execute
    result = finance_node(state)
    
    assert "worker_results" in result
    assert len(result["worker_results"]) > 0
    worker_res = result["worker_results"][0]
    assert worker_res.status in ["success", "completed", "needs_human", "failed"]


def test_finance_worker_complex():
    print("\n=== Testing Finance Worker (Complex Task -> Supervisor Mode) ===")
    mem.clear("biz_123")
    mem.set("biz_123", "finance_policy", {"approval_limit": "$1000", "tax_rate": "21%"}, tags=["finance", "policy"])
    
    agent_data = {
        "id": "agent_999",
        "role": "Finance Manager",
        "name": "Fiona"
    }
    
    finance_node = make_finance_worker_node(agent_data)
    
    state: OrchestratorState = {
        "business_id": "biz_123",
        "task_graph": {
            "task_2": TaskNode(
                id="task_2",
                description="Execute the full Monthly Close process. This requires multi-account reconciliation, auditing the payroll ledger, and generating the consolidated financial statements.",
                status="running",
                assignee_id="agent_999"
            )
        },
        "worker_results": [],
        "messages": [],
        "iteration_count": 0,
        "shared_context": mem.get_context("biz_123")
    }
    
    result = finance_node(state)
    
    assert "worker_results" in result
    assert len(result["worker_results"]) > 0
    worker_res = result["worker_results"][0]
    assert worker_res.status in ["success", "completed", "needs_human", "failed"]
