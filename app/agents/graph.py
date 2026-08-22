from langgraph.graph import StateGraph, START, END
from app.agents.state import OrchestratorState
from app.agents.supervisor import global_supervisor_node, global_router, executive_synthesis_node
from app.agents.workers import make_specialist_worker_node
from app.agents.marketing_worker import make_marketing_worker_node
from app.agents.finance_worker import make_finance_worker_node
from app.agents.engineering_worker import make_engineering_worker_node
from app.agents.tools import register_default_tools
from app.services.task_service import TaskService

task_service = TaskService()

def create_team_graph(business_id: str, main_task_id: str):
    """
    Creates and compiles the LangGraph Level 1 & 2 Multi-Agent Orchestrator.
    """
    agents = task_service.list_agents(business_id) or []
    
    # Ensure Personal Assistant is always part of the team for general operations & administrative mandates
    has_pa = any("assistant" in a.get("role", "").lower() or "admin" in a.get("role", "").lower() for a in agents)
    if not has_pa:
        pa_agent = {
            "id": "d38bfed5-cfec-5c65-98e1-c85c03ae93ad",
            "name": "Personal Assistant",
            "role": "Personal Assistant",
            "trust_tier": "operate",
            "business_id": business_id,
            "model": None
        }
        agents = [pa_agent] + list(agents)
        
    for agent in agents:
        if agent["role"] not in ["Marketing Manager", "Finance Manager", "EngineeringWorker", "Coder", "Engineering Manager", "Software Engineer"]:
            register_default_tools(business_id, agent["role"], agent["id"], main_task_id)
        # Tools registered dynamically inside dedicated worker nodes where applicable.

    workflow = StateGraph(OrchestratorState)
    
    # Add Supervisor Level 1
    workflow.add_node("global_supervisor", global_supervisor_node)
    
    # Add Executive Synthesis Node
    workflow.add_node("executive_synthesis", executive_synthesis_node)
    workflow.add_edge("executive_synthesis", END)
    
    # Add Specialist Workers Level 2
    agent_nodes = []
    for agent in agents:
        node_name = f"worker_{agent['id']}"
        agent_nodes.append(node_name)
        if agent["role"] == "Marketing Manager":
            workflow.add_node(node_name, make_marketing_worker_node(agent))
        elif agent["role"] == "Finance Manager":
            workflow.add_node(node_name, make_finance_worker_node(agent))
        elif agent["role"] in ["EngineeringWorker", "Coder", "Engineering Manager", "Software Engineer"]:
            workflow.add_node(node_name, make_engineering_worker_node(agent))
        else:
            workflow.add_node(node_name, make_specialist_worker_node(agent))
        # Workers return to supervisor to report results and get next task
        workflow.add_edge(node_name, "global_supervisor")

    workflow.add_edge(START, "global_supervisor")
    
    # Router conditional edges to workers, executive synthesis, or end
    workflow.add_conditional_edges("global_supervisor", global_router, agent_nodes + ["executive_synthesis", END])
    
    return workflow
