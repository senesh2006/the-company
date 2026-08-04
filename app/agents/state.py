import operator
from typing import TypedDict, Annotated, Sequence, Any, Optional, Dict, List, Literal
from langchain_core.messages import BaseMessage, AnyMessage
from pydantic import BaseModel, Field

# --- Pydantic Schemas for Structured State ---

class TaskNode(BaseModel):
    id: str
    description: str
    assignee_role: Optional[str] = None
    assignee_id: Optional[str] = None
    dependencies: List[str] = []
    status: str = "queued" # queued, running, completed, failed
    result: Optional[str] = None
    priority: int = 0

class AgentStatus(BaseModel):
    id: str
    role: str
    name: str
    status: str = "idle" # idle, running, failed, paused
    current_task_id: Optional[str] = None
    model: Optional[str] = None

class ApprovalRequest(BaseModel):
    id: str
    requester_id: str
    reason: str
    context: str
    status: str = "pending" # pending, approved, rejected

class WorkerResult(BaseModel):
    task_id: str
    agent_id: str
    role: str
    status: str # completed, failed
    output: str
    cost: float = 0.0

class SubOrchestrationState(BaseModel):
    supervisor_id: str
    original_task_id: str
    sub_tasks: Dict[str, TaskNode] = {}
    active_sub_workers: Dict[str, AgentStatus] = {}
    status: str = "planning" # planning, executing, aggregating, completed, failed

# --- Reducers ---

def merge_dict(old: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Any]:
    if old is None:
        return new.copy() if new else {}
    merged = old.copy()
    if new:
        merged.update(new)
    return merged

def merge_list(old: List[Any], new: List[Any]) -> List[Any]:
    if old is None:
        return new.copy() if new else []
    return old + (new if new else [])

# --- Global State Definition ---

class OrchestratorState(TypedDict):
    """
    The rich hierarchical state for the LangGraph orchestrator.
    """
    business_id: str
    task_id: str
    
    # Message history
    messages: Annotated[list[AnyMessage], operator.add]
    
    # Core entities
    active_agents: Annotated[Dict[str, AgentStatus], merge_dict]
    task_graph: Annotated[Dict[str, TaskNode], merge_dict]
    
    # Execution Tracking
    shared_context: Annotated[Dict[str, Any], merge_dict]
    pending_approvals: Annotated[list[ApprovalRequest], merge_list]
    execution_mode: Literal["autonomous", "semi", "manual"]
    
    # Logs and metrics
    supervisor_thoughts: Annotated[list[str], merge_list]
    worker_results: Annotated[list[WorkerResult], merge_list]
    risk_flags: Annotated[list[str], merge_list]
    cost_tracker: Annotated[Dict[str, float], merge_dict]
    
    # Control flags
    iteration: int
    max_iterations: int
    status: str # "running", "paused", "completed", "failed", "killed"
    
    # Hierarchical Orchestration
    active_sub_orchestrations: Annotated[Dict[str, SubOrchestrationState], merge_dict]
