import json
import logging
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.agents.tool_registry import BaseTool, registry
from app.services.shared_memory import SharedMemoryService
from app.services.mcp_client import mcp_call_or_default

logger = logging.getLogger(__name__)

# Initialize the global memory service
memory_service = SharedMemoryService()

def _common_mcp_call(mcp_name: str, tool_name: str, arguments: Dict[str, Any], default_result: Any) -> Any:
    """Call a real MCP server if configured, otherwise return the default mock result."""
    return mcp_call_or_default(mcp_name, tool_name, arguments, default_result)

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

# --- Knowledge Base & Document Tools ---

class SearchKnowledgeInput(BaseModel):
    query: str = Field(description="Search term or topic to look up in the uploaded knowledge base (e.g. Brand Guidelines, Financial Reports, Product Specs, Customer Personas)")
    category: Optional[str] = Field(default=None, description="Optional category filter: 'Brand Guidelines', 'Financial Reports', 'Product Documentation', 'Customer Personas'")

class SearchKnowledgeBaseTool(BaseTool):
    name = "search_knowledge_base"
    description = "Searches company knowledge base (PDFs, Notion docs, Google Docs, CSVs, customer personas, brand rules). Returns relevant document summaries and match snippets."
    args_schema = SearchKnowledgeInput
    cost_estimate = 0.005

    def __init__(self, business_id: str):
        self.business_id = business_id

    def _run(self, query: str, category: Optional[str] = None) -> str:
        results = memory_service.search_knowledge(self.business_id, query=query, category=category)
        if not results:
            return f"No knowledge base documents or memory records matched query '{query}'."
        
        output_lines = [f"Found {len(results)} relevant knowledge records:"]
        for r in results[:5]:
            if r.get("type") == "document":
                output_lines.append(f"- [DOC ID: {r['id']}] {r['title']} ({r['category']}): {r['summary']}")
            else:
                output_lines.append(f"- [MEMORY KEY: {r['key']}]: {r['snippet']}")
                
        output_lines.append("\nUse 'get_knowledge_document' with a DOC ID to retrieve the full document content.")
        return "\n".join(output_lines)

class GetKnowledgeDocumentInput(BaseModel):
    doc_id: str = Field(description="The ID of the document to retrieve from knowledge base")

class GetKnowledgeDocumentTool(BaseTool):
    name = "get_knowledge_document"
    description = "Retrieves the full parsed content, tables, and metadata of an uploaded knowledge document by ID."
    args_schema = GetKnowledgeDocumentInput
    cost_estimate = 0.005

    def __init__(self, business_id: str):
        self.business_id = business_id

    def _run(self, doc_id: str) -> str:
        doc = memory_service.get_document(self.business_id, doc_id)
        if not doc:
            return f"Knowledge document with ID '{doc_id}' not found."
            
        return (
            f"=== DOCUMENT: {doc.get('title')} ===\n"
            f"Category: {doc.get('category')}\n"
            f"Filename: {doc.get('filename')} ({doc.get('file_type')})\n"
            f"Summary: {doc.get('summary')}\n\n"
            f"--- CONTENT ---\n"
            f"{doc.get('content', '')[:10000]}"
        )

# --- Web Search Tool (Mock/Free) ---

class SearchWebInput(BaseModel):
    query: str = Field(description="The query to search the web for")

class SearchWebTool(BaseTool):
    name = "search_web"
    description = "Searches the web for up to date information."
    args_schema = SearchWebInput
    cost_estimate = 0.01

    def _run(self, query: str) -> str:
        default = f"Search results for '{query}': Found 3 relevant market intelligence resources indicating that the query is valid."
        return _common_mcp_call(
            "brave",
            "search",
            {"query": query},
            default,
        )

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
        default = f"Email successfully queued to {to_email} with subject '{subject}'."
        return _common_mcp_call(
            "email",
            "send_email",
            {"to_email": to_email, "subject": subject, "body": body},
            default,
        )

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
        default = f"Event '{title}' scheduled from {start_time} to {end_time} with {len(attendees)} attendees."
        return _common_mcp_call(
            "calendar",
            "create_event",
            {"title": title, "start_time": start_time, "end_time": end_time, "attendees": attendees},
            default,
        )

# --- Inter-Department Collaboration Tool ---

class RequestCollaborationInput(BaseModel):
    target_role: str = Field(description="The role or department to request help from (e.g. 'Finance Manager', 'Engineering Worker')")
    request: str = Field(description="What you need from the other department")
    context: Optional[str] = Field(None, description="Additional context that will help the target department")
    blocking: bool = Field(default=False, description="If true, the current task will wait for the collaboration result")

class RequestCollaborationTool(BaseTool):
    name = "request_department_collaboration"
    description = "Request a collaboration from another department. The target department will receive a subtask and the result will be stored in shared memory under a unique key."
    args_schema = RequestCollaborationInput
    cost_estimate = 0.02

    def __init__(self, business_id: str, main_task_id: str = None):
        self.business_id = business_id
        self.main_task_id = main_task_id

    def _run(self, target_role: str, request: str, context: Optional[str] = None, blocking: bool = False) -> str:
        from app.core.config import settings
        from app.services.mcp_client import get_mcp_client

        collaboration_id = str(uuid.uuid4())
        memory_key = f"collaboration_request:{collaboration_id}"
        request_payload = {
            "id": collaboration_id,
            "target_role": target_role,
            "request": request,
            "context": context or "",
            "blocking": blocking,
            "main_task_id": self.main_task_id,
            "status": "pending",
            "response": None,
        }

        # Try real collaboration MCP if configured and fallback mode is disabled
        client = get_mcp_client("collaboration")
        if client is not None:
            try:
                result = client.call_tool("request_collaboration", request_payload)
                memory_service.set(
                    self.business_id,
                    memory_key,
                    {"request": request_payload, "response": result},
                    tags=["collaboration", "pending_delegation", target_role.lower().replace(" ", "_")],
                )
                return f"Collaboration request '{collaboration_id}' sent to {target_role}. Response: {result}"
            except Exception as e:
                logger.warning(f"Collaboration MCP call failed: {e}. Falling back to shared memory.")

        # Local fallback: write to shared memory for the supervisor to dispatch
        memory_service.set(
            self.business_id,
            memory_key,
            request_payload,
            tags=["collaboration", "pending_delegation", target_role.lower().replace(" ", "_")],
        )
        return (
            f"Collaboration request '{collaboration_id}' queued for {target_role}. "
            f"Status: PENDING. The coordinator will dispatch this to the right specialist."
        )

# --- Subtask Spawning Tool ---

class SpawnSubtaskInput(BaseModel):
    agent_id: str = Field(description="The ID or role of the agent to delegate to (e.g. Developer, Growth Marketer, Finance Specialist)")
    instruction: str = Field(description="The task instruction to execute")

class SpawnSubtaskTool(BaseTool):
    name = "spawn_subtask"
    description = "Delegates a subtask to another AI Worker specialist in the fleet."
    args_schema = SpawnSubtaskInput
    cost_estimate = 0.02
    
    def __init__(self, business_id: str, main_task_id: str = None):
        self.business_id = business_id
        self.main_task_id = main_task_id

    def _run(self, agent_id: str, instruction: str) -> str:
        return f"Successfully delegated subtask to '{agent_id}' with instruction: '{instruction}'."

# --- Financial Calculation Tool ---

class CalculateFinancialsInput(BaseModel):
    revenue: float = Field(description="Total revenue")
    expenses: float = Field(description="Total expenses")
    tax_rate: float = Field(default=0.20, description="Estimated tax rate")

class CalculateFinancialsTool(BaseTool):
    name = "calculate_financials"
    description = "Calculates gross profit, tax liability, net profit, and profit margin."
    args_schema = CalculateFinancialsInput
    cost_estimate = 0.001

    def _run(self, revenue: float, expenses: float, tax_rate: float = 0.20) -> str:
        gross_profit = revenue - expenses
        tax = max(0, gross_profit * tax_rate)
        net_profit = gross_profit - tax
        margin = (net_profit / revenue * 100) if revenue > 0 else 0
        return f"Financial Report: Gross Profit: ${gross_profit:,.2f} | Tax Liability: ${tax:,.2f} | Net Profit: ${net_profit:,.2f} | Profit Margin: {margin:.1f}%"

# --- Registration Helper ---

def register_default_tools(business_id: str, role: str = "assistant", agent_id: str = None, task_id: str = None):
    """
    Registers the default tools for the specified agent role.
    """
    base_tools = [
        ReadSharedMemoryTool(business_id=business_id),
        WriteSharedMemoryTool(business_id=business_id),
        SearchKnowledgeBaseTool(business_id=business_id),
        GetKnowledgeDocumentTool(business_id=business_id),
        SearchWebTool(),
        SendEmailTool(),
        CreateCalendarEventTool(),
        RequestCollaborationTool(business_id=business_id, main_task_id=task_id),
        SpawnSubtaskTool(business_id=business_id, main_task_id=task_id)
    ]
    
    if role in ["Accountant", "Finance Specialist", "finance"]:
        base_tools.append(CalculateFinancialsTool())

    # Inject metadata for cost tracking
    for tool in base_tools:
        tool.business_id = business_id
        tool.agent_id = agent_id
        tool.task_id = task_id

    # Register in registry
    registry._tools[role] = base_tools
