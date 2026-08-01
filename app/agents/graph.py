from langgraph.graph import StateGraph, START, END
from app.agents.state import OrchestratorState
from app.agents.supervisor import global_supervisor_node, global_router
from app.agents.workers import make_specialist_worker_node
from app.agents.marketing_worker import make_marketing_worker_node
from app.agents.finance_worker import make_finance_worker_node
from app.agents.tools import register_default_tools
from app.services.task_service import TaskService

task_service = TaskService()

def create_team_graph(business_id: str, main_task_id: str):
    """
    Creates and compiles the LangGraph Level 1 & 2 Multi-Agent Orchestrator.
    """
    agents = task_service.list_agents(business_id)
    if not agents:
        raise ValueError("No agents found for this business. Please hire agents first.")
        
    for agent in agents:
        if agent["role"] not in ["Marketing Manager", "Finance Manager"]:
            register_default_tools(business_id, agent["role"], agent["id"], main_task_id)
        # For Marketing/Finance Managers, tools are registered dynamically inside their dedicated nodes.

    workflow = StateGraph(OrchestratorState)
    
    # Add Supervisor Level 1
    workflow.add_node("global_supervisor", global_supervisor_node)
    
    # Add Specialist Workers Level 2
    agent_nodes = []
    for agent in agents:
        node_name = f"worker_{agent['id']}"
        agent_nodes.append(node_name)
        if agent["role"] == "Marketing Manager":
            workflow.add_node(node_name, make_marketing_worker_node(agent))
        elif agent["role"] == "Finance Manager":
            workflow.add_node(node_name, make_finance_worker_node(agent))
        else:
            workflow.add_node(node_name, make_specialist_worker_node(agent))
        # Workers return to supervisor to report results and get next task
        workflow.add_edge(node_name, "global_supervisor")

    workflow.add_edge(START, "global_supervisor")
    
    # Router conditional edges to workers or end
    workflow.add_conditional_edges("global_supervisor", global_router, agent_nodes + [END])
    
    return workflow
