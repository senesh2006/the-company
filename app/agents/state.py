import operator
from typing import TypedDict, Annotated, Sequence, Any, Optional, Dict, List
from langchain_core.messages import BaseMessage
from pydantic import BaseModel

class Task(BaseModel):
    id: str
    description: str
    assignee_role: str
    dependencies: List[str] = []
    status: str = "queued" # queued, running, completed, failed
    result: Optional[str] = None

def merge_tasks(old: Dict[str, Task], new: Dict[str, Task]) -> Dict[str, Task]:
    if old is None:
        return new
    merged = old.copy()
    merged.update(new)
    return merged

class TeamState(TypedDict):
    """
    The state for the LangGraph multi-agent supervisor team runner.
    """
    # Identifiers
    business_id: str
    task_id: str
    
    # Task DAG
    tasks: Annotated[Dict[str, Task], merge_tasks]
    
    # Message history
    messages: Annotated[Sequence[BaseMessage], operator.add]
    
    # Execution metrics
    step_count: int
    
    # Status flags
    status: str # "running", "paused", "completed", "failed", "killed"
    
    # Temporary shared memory updates queued for Supabase
    memory_updates: dict[str, Any]
