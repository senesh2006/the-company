from typing import Literal
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from app.agents.state import AgentState
from app.agents.tools import register_default_tools
from app.agents.tool_registry import registry
from app.core.config import settings

def create_agent_graph(business_id: str, role: str = "assistant"):
    """
    Creates and compiles the LangGraph StateGraph for the given business and role.
    """
    # Register default tools for the specified role
    register_default_tools(business_id, role)
    
    # Retrieve LangChain-compatible tools from the registry
    tools = registry.get_langchain_tools(role)
    llm = ChatOpenAI(model="gpt-4o", api_key=settings.OPENAI_API_KEY).bind_tools(tools)
    
    # Node: Plan
    def plan_node(state: AgentState):
        messages = state.get("messages", [])
        step_count = state.get("step_count", 0)
        
        # Stop conditions check
        if step_count > 15:
            return {"status": "failed", "messages": [AIMessage(content="Max steps reached.")]}
            
        if state.get("status") in ["completed", "failed", "killed"]:
            return {} # Do nothing if already terminal
            
        system_msg = SystemMessage(
            content="You are an autonomous agent for 'The Company'. "
                    "You have access to shared memory. "
                    "Determine your next action, use tools if needed, or reply directly if the task is complete. "
                    "If you achieve the goal, ensure you state that clearly."
        )
        
        response = llm.invoke([system_msg] + messages)
        return {
            "messages": [response],
            "step_count": step_count + 1
        }
        
    # Edge Router: Should we act or end?
    def should_continue(state: AgentState) -> Literal["act", "observe", "update_memory", "END"]:
        messages = state.get("messages", [])
        if state.get("status") in ["completed", "failed", "killed"]:
            return "END"
            
        last_message = messages[-1]
        
        # If there are tool calls, we act
        if hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0:
            return "act"
            
        # Otherwise, the LLM has responded directly (goal achieved or asking for input)
        return "update_memory"
        
    # Node: Act (Tools)
    tool_node = ToolNode(tools)
    
    # Node: Update Memory (Sync to Supabase if anything is queued, or finalize)
    def update_memory_node(state: AgentState):
        # Here we could batch sync state.memory_updates to Supabase if we wanted to.
        # Since tools do it immediately, we might just check if the task is complete.
        status = state.get("status", "running")
        last_message = state["messages"][-1]
        
        if not hasattr(last_message, "tool_calls") or len(last_message.tool_calls) == 0:
            # If the LLM stopped calling tools, it might be done.
            # A more robust system would check for a specific structured output tool like `complete_task`.
            status = "completed"
            
        return {"status": status}

    workflow = StateGraph(AgentState)
    
    workflow.add_node("plan", plan_node)
    workflow.add_node("act", tool_node)
    workflow.add_node("update_memory", update_memory_node)
    
    workflow.set_entry_point("plan")
    
    workflow.add_conditional_edges(
        "plan",
        should_continue,
        {
            "act": "act",
            "update_memory": "update_memory",
            "END": END
        }
    )
    
    workflow.add_edge("act", "plan")
    workflow.add_edge("update_memory", END)
    
    return workflow
