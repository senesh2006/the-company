import json
from abc import ABC, abstractmethod
from typing import Type, Any, Dict, List, Optional
from pydantic import BaseModel
from langchain_core.tools import StructuredTool
from app.core.logging import logger

class BaseTool(ABC):
    """
    Abstract base class for all agent tools.
    """
    name: str
    description: str
    args_schema: Type[BaseModel]
    cost_estimate: float = 0.0

    @abstractmethod
    def _run(self, **kwargs) -> Any:
        """The actual implementation of the tool logic."""
        pass

    def run(self, **kwargs) -> Any:
        """
        Wraps the _run method to provide logging and cost tracking.
        """
        logger.info(f"Executing Tool: {self.name} | Estimated Cost: ${self.cost_estimate}")
        # TODO: In the future, write this cost_estimate to the `cost_records` Supabase table.
        try:
            result = self._run(**kwargs)
            logger.info(f"Completed Tool: {self.name}")
            return result
        except Exception as e:
            logger.error(f"Tool {self.name} failed: {str(e)}")
            raise e

    def to_openai_format(self) -> Dict[str, Any]:
        """
        Exports the tool definition to an OpenAI function calling format.
        """
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.args_schema.model_json_schema()
            }
        }

    def to_mcp_format(self) -> Dict[str, Any]:
        """
        Exports the tool definition to a standard Model Context Protocol (MCP) format.
        """
        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": self.args_schema.model_json_schema()
        }

    def to_langchain_tool(self) -> StructuredTool:
        """
        Converts this BaseTool into a LangChain StructuredTool for use in LangGraph.
        """
        return StructuredTool.from_function(
            func=self.run,
            name=self.name,
            description=self.description,
            args_schema=self.args_schema
        )


class ToolRegistry:
    """
    Registry for organizing and retrieving tools by agent role.
    """
    def __init__(self):
        self._tools: Dict[str, List[BaseTool]] = {}

    def register_tool(self, role: str, tool: BaseTool):
        """Registers a single tool for a specific role."""
        if role not in self._tools:
            self._tools[role] = []
        self._tools[role].append(tool)

    def register_tools(self, role: str, tools: List[BaseTool]):
        """Registers multiple tools for a specific role."""
        if role not in self._tools:
            self._tools[role] = []
        self._tools[role].extend(tools)

    def get_tools(self, role: str) -> List[BaseTool]:
        """Gets all BaseTool instances for a given role."""
        return self._tools.get(role, [])
        
    def get_langchain_tools(self, role: str) -> List[StructuredTool]:
        """Gets all tools for a role, formatted as LangChain StructuredTools."""
        base_tools = self.get_tools(role)
        return [t.to_langchain_tool() for t in base_tools]

# Global registry instance
registry = ToolRegistry()
