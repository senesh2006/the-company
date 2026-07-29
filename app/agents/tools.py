import json
from typing import Any, List
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field
from app.services.shared_memory import SharedMemoryService

# We initialize a global or dependency-injected service
memory_service = SharedMemoryService()

class ReadMemoryInput(BaseModel):
    key: str = Field(description="The key to read from shared memory")

class WriteMemoryInput(BaseModel):
    key: str = Field(description="The key to write to shared memory")
    value: str = Field(description="The value to store (JSON string or plain text)")
    tags: List[str] = Field(default_factory=list, description="Tags to associate with the memory")

class SetFlagInput(BaseModel):
    flag_name: str = Field(description="The name of the flag to set")
    value: bool = Field(description="The boolean value of the flag")

def create_supabase_tools(business_id: str) -> List[StructuredTool]:
    """
    Returns a list of LangChain tools bound to a specific business_id.
    """
    
    def read_shared_memory(key: str) -> str:
        """Reads a value from the Supabase shared memory for the current business."""
        result = memory_service.get(business_id, key)
        if result:
            return json.dumps(result.get("value"))
        return f"Key '{key}' not found in shared memory."

    def write_shared_memory(key: str, value: str, tags: List[str] = []) -> str:
        """Writes a value to the Supabase shared memory for the current business."""
        try:
            # Try to parse as JSON if possible to store correctly in JSONB
            parsed_value = json.loads(value)
        except json.JSONDecodeError:
            parsed_value = value
            
        memory_service.set(business_id, key, parsed_value, tags)
        return f"Successfully wrote '{key}' to shared memory."

    def set_flag(flag_name: str, value: bool) -> str:
        """Sets a boolean flag in the Supabase shared memory."""
        memory_service.set_flag(business_id, flag_name, value)
        return f"Successfully set flag '{flag_name}' to {value}."

    return [
        StructuredTool.from_function(
            func=read_shared_memory,
            name="read_shared_memory",
            description="Reads a value from shared memory. Use this to retrieve context, rules, or state.",
            args_schema=ReadMemoryInput
        ),
        StructuredTool.from_function(
            func=write_shared_memory,
            name="write_shared_memory",
            description="Writes a value to shared memory. Use this to store context, results, or state.",
            args_schema=WriteMemoryInput
        ),
        StructuredTool.from_function(
            func=set_flag,
            name="set_flag",
            description="Sets a boolean flag in shared memory. Useful for signaling other agents.",
            args_schema=SetFlagInput
        )
    ]
