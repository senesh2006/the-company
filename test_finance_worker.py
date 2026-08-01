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

# Reset shared memory for clean run
mem = SharedMemoryService()
mem.clear("biz_123")
mem.set("biz_123", "finance_policy", {"approval_limit": "$1000", "tax_rate": "21%"}, tags=["finance", "policy"])

def run_test():
    print("=== Testing Finance Worker (Standard Task) ===")
    
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
    
    print("\n--- Worker Result ---")
    if result.get("worker_results"):
        worker_res = result["worker_results"][0]
        print(f"Status: {worker_res.status}")
        print(f"Output:\n{worker_res.output}")
        print(f"Cost: {worker_res.cost}")
    
    print("\n--- Messages ---")
    for m in result.get("messages", []):
        print(f"[{m.type}]: {m.content}")


def run_complex_test():
    print("\n=== Testing Finance Worker (Complex Task -> Supervisor Mode) ===")
    
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
    
    print("\n--- Worker Result ---")
    if result.get("worker_results"):
        worker_res = result["worker_results"][0]
        print(f"Status: {worker_res.status}")
        print(f"Output:\n{worker_res.output}")
        print(f"Cost: {worker_res.cost}")

if __name__ == "__main__":
    run_test()
    run_complex_test()
