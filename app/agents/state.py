import operator
from typing import TypedDict, Annotated, Sequence, Any, Optional
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    """
    The state for the LangGraph agent runner.
    """
    # Identifiers
    business_id: str
    agent_id: str
    task_id: str
    
    # Message history
    messages: Annotated[Sequence[BaseMessage], operator.add]
    
    # Current plan or reasoning scratchpad
    plan: str
    
    # Execution metrics
    step_count: int
    
    # Status flags
    status: str # "running", "paused", "completed", "failed", "killed"
    
    # Temporary shared memory updates queued for Supabase
    memory_updates: dict[str, Any]
