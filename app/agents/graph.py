from typing import Literal, Sequence, Dict, Any
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel
from app.agents.state import TeamState
from app.agents.tools import register_default_tools
from app.agents.tool_registry import registry
from app.core.config import settings
from app.services.cost_service import CostService
from app.services.task_service import TaskService

cost_service = CostService()
task_service = TaskService()

def create_team_graph(business_id: str, task_id: str):
    """
    Creates and compiles the LangGraph Multi-Agent Supervisor StateGraph.
    """
    # Fetch active agents for the business
    agents = task_service.list_agents(business_id)
    if not agents:
        raise ValueError("No agents found for this business. Please hire agents first.")
        
    members = [f"{agent['name']}_{agent['role']}" for agent in agents]
    options = ["FINISH"] + members
    
    # Register default tools for all agents
    for agent in agents:
        register_default_tools(business_id, agent["role"], agent["id"], task_id)
        
    # Build Supervisor Node
    llm = ChatOpenAI(
        model="accounts/fireworks/models/llama-v3p1-70b-instruct" if settings.FIREWORKS_API_KEY else "gpt-4o", 
        api_key=settings.FIREWORKS_API_KEY or settings.OPENAI_API_KEY,
        base_url="https://api.fireworks.ai/inference/v1" if settings.FIREWORKS_API_KEY else None
    )
    
    class Router(BaseModel):
        """Worker to route to next. If no workers needed, route to FINISH."""
        next: Literal[tuple(options)]
        
    system_prompt = (
        "You are a supervisor managing a conversation between the following workers: {members}. "
        "Given the following user request or task, respond with the worker to act next. "
        "Each worker will perform a task and respond with their results and status. "
        "When the overarching task is finished, respond with FINISH."
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="messages"),
        ("system", "Given the conversation above, who should act next? Or should we FINISH? Select one of: {options}"),
    ])
    
    supervisor_chain = prompt | llm.with_structured_output(Router)
    
    def supervisor_node(state: TeamState):
        if state.get("step_count", 0) > 20:
            return {"next": "FINISH", "status": "failed", "messages": [AIMessage(content="Max steps reached.")]}
            
        if state.get("status") in ["completed", "failed", "killed", "paused"]:
            return {"next": "FINISH"}
            
        result = supervisor_chain.invoke({
            "messages": state["messages"],
            "members": ", ".join(members),
            "options": ", ".join(options)
        })
        
        status = state.get("status", "running")
        if result.next == "FINISH":
            status = "completed"
            
        return {
            "next": result.next,
            "step_count": state.get("step_count", 0) + 1,
            "status": status
        }
        
    # Build Worker Nodes
    def make_worker_node(agent_data: dict):
        role = agent_data["role"]
        name_role = f"{agent_data['name']}_{role}"
        tools = registry.get_langchain_tools(role)
        
        worker_agent = create_react_agent(llm, tools, state_modifier=f"You are {agent_data['name']}, acting as a {role}.")
        
        def worker_node(state: TeamState):
            result = worker_agent.invoke({"messages": state["messages"]})
            last_message = result["messages"][-1]
            return {
                "messages": [HumanMessage(content=last_message.content, name=name_role)]
            }
            
        return worker_node

    workflow = StateGraph(TeamState)
    
    workflow.add_node("supervisor", supervisor_node)
    
    for agent in agents:
        name_role = f"{agent['name']}_{agent['role']}"
        workflow.add_node(name_role, make_worker_node(agent))
        # Workers always return to supervisor
        workflow.add_edge(name_role, "supervisor")
        
    workflow.add_conditional_edges(
        "supervisor",
        lambda x: x["next"],
        {**{m: m for m in members}, "FINISH": END}
    )
    
    workflow.add_edge(START, "supervisor")
    
    return workflow
