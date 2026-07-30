import json
from typing import Any, List
from pydantic import BaseModel, Field
from app.agents.tool_registry import BaseTool, registry
from app.services.shared_memory import SharedMemoryService

# Initialize the global memory service
memory_service = SharedMemoryService()

# --- Shared Memory Tools ---

class ReadMemoryInput(BaseModel):
    key: str = Field(description="The key to read from shared memory")

class ReadSharedMemoryTool(BaseTool):
    name = "read_shared_memory"
    description = "Reads a value from shared memory. Use this to retrieve context, rules, or state."
    args_schema = ReadMemoryInput
    cost_estimate = 0.001
    
    def __init__(self, business_id: str):
        self.business_id = business_id
        
    def _run(self, key: str) -> str:
        result = memory_service.get(self.business_id, key)
        if result:
            return json.dumps(result.get("value"))
        return f"Key '{key}' not found in shared memory."

class WriteMemoryInput(BaseModel):
    key: str = Field(description="The key to write to shared memory")
    value: str = Field(description="The value to store (JSON string or plain text)")
    tags: List[str] = Field(default_factory=list, description="Tags to associate with the memory")

class WriteSharedMemoryTool(BaseTool):
    name = "write_shared_memory"
    description = "Writes a value to shared memory. Use this to store context, results, or state."
    args_schema = WriteMemoryInput
    cost_estimate = 0.005
    
    def __init__(self, business_id: str):
        self.business_id = business_id

    def _run(self, key: str, value: str, tags: List[str] = []) -> str:
        try:
            parsed_value = json.loads(value)
        except json.JSONDecodeError:
            parsed_value = value
            
        memory_service.set(self.business_id, key, parsed_value, tags)
        return f"Successfully wrote '{key}' to shared memory."

# --- Web Search Tool (Mock/Free) ---

class SearchWebInput(BaseModel):
    query: str = Field(description="The query to search the web for")

class SearchWebTool(BaseTool):
    name = "search_web"
    description = "Searches the web for up to date information."
    args_schema = SearchWebInput
    cost_estimate = 0.01

    def _run(self, query: str) -> str:
        # MOCK IMPLEMENTATION
        return f"Search results for '{query}': Found 3 relevant articles indicating that the query is valid."

# --- Communication Tools (Mock) ---

class SendEmailInput(BaseModel):
    to_email: str = Field(description="The recipient's email address")
    subject: str = Field(description="The subject of the email")
    body: str = Field(description="The content of the email")

class SendEmailTool(BaseTool):
    name = "send_email"
    description = "Sends an email to a specified recipient."
    args_schema = SendEmailInput
    cost_estimate = 0.05

    def _run(self, to_email: str, subject: str, body: str) -> str:
        # MOCK IMPLEMENTATION
        return f"Email successfully sent to {to_email} with subject '{subject}'."

# --- Scheduling Tools (Mock) ---

class CreateCalendarEventInput(BaseModel):
    title: str = Field(description="The title of the event")
    start_time: str = Field(description="ISO 8601 formatted start time")
    end_time: str = Field(description="ISO 8601 formatted end time")
    attendees: List[str] = Field(description="List of attendee email addresses")

class CreateCalendarEventTool(BaseTool):
    name = "create_calendar_event"
    description = "Creates a calendar event and invites attendees."
    args_schema = CreateCalendarEventInput
    cost_estimate = 0.05

    def _run(self, title: str, start_time: str, end_time: str, attendees: List[str]) -> str:
        # MOCK IMPLEMENTATION
        return f"Calendar event '{title}' scheduled from {start_time} to {end_time} with {len(attendees)} attendees."

class SpawnSubtaskInput(BaseModel):
    description: str = Field(description="Description of the task to be done")
    assignee_role: str = Field(description="Role of the agent to assign this to")
    dependencies: List[str] = Field(default=[], description="List of task IDs that must be completed first")

class SpawnSubtaskTool(BaseTool):
    name = "spawn_subtask"
    description = "Spawns a new sub-task for the team. Use this when you need another agent to do something before you can finish, or to delegate work."
    args_schema = SpawnSubtaskInput
    cost_estimate = 0.005
    
    def __init__(self, business_id: str, main_task_id: str):
        self.business_id = business_id
        self.main_task_id = main_task_id

    def _run(self, description: str, assignee_role: str, dependencies: List[str] = []) -> str:
        task = task_service.create_task(
            business_id=self.business_id, 
            description=description, 
            status="queued", 
            parent_id=self.main_task_id, 
            dependencies=dependencies,
            assignee_role=assignee_role
        )
        return f"Spawned subtask successfully: ID {task['id']}. It will be routed by the dispatcher."

# --- Registration Helper ---

def register_default_tools(business_id: str, role: str = "assistant", agent_id: str = None, task_id: str = None):
    """
    Registers the default tools for the specified agent role.
    This should be called when initializing the agent's runner.
    """
    # Standard tools available to all roles
    base_tools = [
        ReadSharedMemoryTool(business_id=business_id),
        WriteSharedMemoryTool(business_id=business_id),
        SearchWebTool(),
        SendEmailTool(),
        CreateCalendarEventTool(),
        SpawnSubtaskTool(business_id=business_id, main_task_id=task_id)
    ]

    # Inject metadata for cost tracking
    for tool in base_tools:
        tool.business_id = business_id
        tool.agent_id = agent_id
        tool.task_id = task_id

    # Register in memory (replaces existing list for that role to prevent duplicates in singleton if called repeatedly)
    registry._tools[role] = base_tools
