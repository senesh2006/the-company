import uuid
from typing import Dict, Any
from app.agents.state import OrchestratorState, TaskNode
from app.agents.marketing_worker import make_marketing_worker_node

def test_marketing_worker_normal():
    print("--- TESTING NORMAL TASK EXECUTION ---")
    business_id = "test_business_123"
    agent_id = "agent_marketing_1"
    
    agent_data = {
        "id": agent_id,
        "role": "Marketing Manager",
        "name": "Sarah Marketing"
    }
    
    task_id = str(uuid.uuid4())
    task = TaskNode(
        id=task_id,
        description="Write a quick promotional tweet for our new API feature.",
        assignee_role="Marketing Manager",
        assignee_id=agent_id,
        status="running"
    )
    
    state: OrchestratorState = {
        "business_id": business_id,
        "task_id": "global_task_1",
        "messages": [],
        "active_agents": {},
        "task_graph": {task_id: task},
        "shared_context": {"brand_guidelines": "Tone should be professional but exciting. Use emoji."},
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
    
    worker_node = make_marketing_worker_node(agent_data)
    result = worker_node(state)
    
    assert "worker_results" in result
    assert len(result["worker_results"]) > 0
    worker_res = result["worker_results"][0]
    assert worker_res.status in ["success", "completed", "needs_human", "failed"]

def test_marketing_worker_sub_orchestration():
    print("--- TESTING TEMPORARY SUPERVISOR ESCALATION ---")
    business_id = "test_business_123"
    agent_id = "agent_marketing_1"
    
    agent_data = {
        "id": agent_id,
        "role": "Marketing Manager",
        "name": "Sarah Marketing"
    }
    
    task_id = str(uuid.uuid4())
    task = TaskNode(
        id=task_id,
        description="Launch a massive month-long marketing campaign for the new product, including blog posts, 15 social media threads, influencer outreach, and a webinar.",
        assignee_role="Marketing Manager",
        assignee_id=agent_id,
        status="running"
    )
    
    state: OrchestratorState = {
        "business_id": business_id,
        "task_id": "global_task_1",
        "messages": [],
        "active_agents": {},
        "task_graph": {task_id: task},
        "shared_context": {"brand_guidelines": "Tone should be professional but exciting. Use emoji."},
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
    
    worker_node = make_marketing_worker_node(agent_data)
    result = worker_node(state)
    
    assert "worker_results" in result
    assert len(result["worker_results"]) > 0
    worker_res = result["worker_results"][0]
    assert worker_res.status in ["success", "completed", "needs_human", "failed"]
