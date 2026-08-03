import uuid
from app.agents.state import OrchestratorState, TaskNode
from app.agents.engineering_worker import make_engineering_worker_node

def test_engineering_worker_node():
    business_id = "test_business_engineering"
    agent_id = "agent_coder_1"
    
    agent_data = {
        "id": agent_id,
        "role": "Coder",
        "name": "Alex Coder"
    }
    
    task_id = str(uuid.uuid4())
    task = TaskNode(
        id=task_id,
        description="Refactor user authentication endpoint to add input validation.",
        assignee_role="Coder",
        assignee_id=agent_id,
        status="running"
    )
    
    state: OrchestratorState = {
        "business_id": business_id,
        "task_id": "global_task_eng_1",
        "messages": [],
        "active_agents": {},
        "task_graph": {task_id: task},
        "shared_context": {"repo": "main_repo"},
        "pending_approvals": [],
        "execution_mode": "autonomous",
        "supervisor_thoughts": [],
        "worker_results": [],
        "risk_flags": [],
        "cost_tracker": {},
        "iteration": 1,
        "max_iterations": 10,
        "status": "running",
        "active_sub_orchestrations": {}
    }
    
    worker_node = make_engineering_worker_node(agent_data)
    result = worker_node(state)
    
    assert "worker_results" in result
    assert len(result["worker_results"]) > 0
    worker_res = result["worker_results"][0]
    assert worker_res.status in ["success", "completed", "needs_human", "failed"]
