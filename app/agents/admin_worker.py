import logging
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent

from app.agents.llm_factory import get_llm
from app.agents.tool_registry import registry
from app.agents.tools import ReadSharedMemoryTool, WriteSharedMemoryTool
from app.agents.admin_tools import InboxTriageTool, CalendarScheduleTool, HelpdeskTicketTool

logger = logging.getLogger(__name__)

def get_admin_ops_agent(business_id: str, agent_id: str = "admin_agent", name: str = "Alex", trust_tier: str = "observe", model_id: str = None):
    """
    Constructs the Admin / Ops specialist worker (PRD v6.0 §4.1).
    Role: Inbox, calendar, helpdesk, triage, routine replies, scheduling.
    Requires approval for complaints, refund requests, and policy exceptions.
    """
    llm = get_llm(model_id=model_id, role="Admin & Operations Worker", temperature=0.1)

    tools = [
        InboxTriageTool(),
        CalendarScheduleTool(),
        HelpdeskTicketTool(),
        ReadSharedMemoryTool(business_id=business_id),
        WriteSharedMemoryTool(business_id=business_id)
    ]
    langchain_tools = [t.to_langchain_tool() for t in tools]

    system_prompt = f"""You are {name}, the in-house Admin / Operations Worker.
Your scope:
- Triage inbox messages, organize schedule, and resolve standard helpdesk queries.
- Current Trust Tier: {trust_tier.upper()}.
- At 'Observe' tier: You draft replies and propose calendar slots, but do not send emails unattended.
- At 'Assist' tier: You execute routine scheduling and simple inbox archiving unattended.
- For complaints, refund requests, or policy exceptions: Always route to the Governance Gateway for founder approval.
- Always consult Shared Memory for context and company policies.
"""

    return create_react_agent(llm, langchain_tools, state_modifier=system_prompt)
