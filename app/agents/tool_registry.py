import json
from abc import ABC, abstractmethod
from typing import Type, Any, Dict, List, Optional
from pydantic import BaseModel
from langchain_core.tools import StructuredTool
from app.core.logging import logger

from app.services.cost_service import CostService

cost_service = CostService()

class BaseTool(ABC):
    """
    Abstract base class for all agent tools.
    """
    name: str
    description: str
    args_schema: Type[BaseModel]
    cost_estimate: float = 0.0
    
    # Metadata for cost tracking
    business_id: Optional[str] = None
    agent_id: Optional[str] = None
    task_id: Optional[str] = None

    @abstractmethod
    def _run(self, **kwargs) -> Any:
        """The actual implementation of the tool logic."""
        pass

    def run(self, **kwargs) -> Any:
        """
        Wraps the _run method to provide logging and cost tracking.
        """
        logger.info(f"Executing Tool: {self.name} | Estimated Cost: ${self.cost_estimate}")
        try:
            result = self._run(**kwargs)
            logger.info(f"Completed Tool: {self.name}")
            
            if self.business_id:
                cost_service.log_cost(
                    business_id=self.business_id,
                    agent_id=self.agent_id,
                    task_id=self.task_id,
                    amount=self.cost_estimate,
                    record_type="tool",
                    description=f"Tool execution: {self.name}"
                )
                
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
    Registry for organizing and retrieving tools by agent role,
    with dynamic tool discovery from connected integrations.
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

    def get_tools(
        self,
        role: str,
        business_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[BaseTool]:
        """
        Gets all BaseTool instances for a given role.
        Auto-populates default tools if role is uninitialized, and dynamically discovers
        all known and connected integration tools.
        """
        norm_role = (role or "assistant").strip()
        effective_biz_id = business_id or "00000000-0000-0000-0000-000000000001"
        effective_user_id = user_id or effective_biz_id

        # 1. Auto-register default tools for this role if not already initialized
        if norm_role not in self._tools or not self._tools[norm_role]:
            try:
                from app.agents.admin_tools import register_admin_tools
                from app.agents.marketing_tools import register_marketing_tools
                from app.agents.finance_tools import register_finance_tools
                from app.agents.tools import register_default_tools

                if any(w in norm_role.lower() for w in ["market", "growth", "social"]):
                    register_marketing_tools(business_id=effective_biz_id)
                elif any(w in norm_role.lower() for w in ["finance", "account", "ledger", "bookkeeper"]):
                    register_finance_tools(business_id=effective_biz_id)
                else:
                    register_admin_tools(business_id=effective_biz_id)
                    register_default_tools(business_id=effective_biz_id, role=norm_role)
            except Exception as reg_err:
                logger.debug(f"Auto-registration of default tools note: {reg_err}")

        base_list = list(self._tools.get(norm_role, []))
        if not base_list:
            base_list = list(self._tools.get("Personal Assistant", []) or self._tools.get("assistant", []) or self._tools.get("default", []))

        # 2. Dynamic Tool Self-Discovery (Google Sheets, Gmail, Slack, GitHub, Notion, Routines, Web Search, Knowledge Base, WhatsApp)
        try:
            from app.services.tool_discovery_service import tool_discovery_service
            discovered = tool_discovery_service.discover_tools_for_user(
                business_id=effective_biz_id,
                user_id=effective_user_id,
                role=norm_role
            )
            existing_names = {t.name for t in base_list}
            for dt in discovered:
                if dt.name not in existing_names:
                    base_list.append(dt)
        except Exception as e:
            logger.debug(f"Dynamic tool discovery note: {e}")

        return base_list
        
    def get_langchain_tools(
        self,
        role: str,
        business_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[StructuredTool]:
        """Gets all tools for a role, formatted as LangChain StructuredTools with dynamic discovery."""
        base_tools = self.get_tools(role, business_id=business_id, user_id=user_id)
        return [t.to_langchain_tool() for t in base_tools]

# Global registry instance
registry = ToolRegistry()
