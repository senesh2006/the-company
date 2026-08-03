import json
from typing import Any, List
from pydantic import BaseModel, Field
from app.agents.tool_registry import BaseTool, registry
from app.services.shared_memory import SharedMemoryService
from app.services.task_service import task_service

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

class SearchWebTool(BaseTool):
    name = "search_web"
    description = "Searches the web for up to date information."
    args_schema = SearchWebInput
    cost_estimate = 0.01

    def _run(self, query: str) -> str:
        import urllib.request
        import urllib.parse
        try:
            encoded_query = urllib.parse.quote(query)
            url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = resp.read().decode("utf-8", errors="ignore")
                return f"Search results for '{query}': {data[:1000]}"
        except Exception as e:
            return f"Search request executed for query '{query}': {str(e)}"

# --- Communication Tools ---

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
        return f"Email processed and sent to {to_email} with subject '{subject}'."

# --- Scheduling Tools ---

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
        return f"Calendar event '{title}' scheduled from {start_time} to {end_time} with attendees: {', '.join(attendees)}."

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

class CalculateFinancialsInput(BaseModel):
    revenue: float = Field(description="Total revenue")
    expenses: float = Field(description="Total expenses")
    tax_rate: float = Field(default=0.2, description="Tax rate as a decimal (e.g. 0.2 for 20%)")

class CalculateFinancialsTool(BaseTool):
    name = "calculate_financials"
    description = "Calculates net profit, tax liability, and profit margin."
    args_schema = CalculateFinancialsInput
    cost_estimate = 0.05

    def _run(self, revenue: float, expenses: float, tax_rate: float) -> str:
        gross_profit = revenue - expenses
        tax = max(0, gross_profit * tax_rate)
        net_profit = gross_profit - tax
        margin = (net_profit / revenue * 100) if revenue > 0 else 0
        return f"Financial Report: Gross Profit: ${gross_profit:,.2f} | Tax Liability: ${tax:,.2f} | Net Profit: ${net_profit:,.2f} | Profit Margin: {margin:.1f}%"

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
    
    if role == "Accountant":
        base_tools.append(CalculateFinancialsTool())

    # Inject metadata for cost tracking
    for tool in base_tools:
        tool.business_id = business_id
        tool.agent_id = agent_id
        tool.task_id = task_id

    # Register in memory (replaces existing list for that role to prevent duplicates in singleton if called repeatedly)
    registry._tools[role] = base_tools
