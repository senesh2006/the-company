import pytest
from app.agents.tools import SendEmailTool
from app.agents.admin_tools import register_admin_tools
from app.agents.marketing_tools import register_marketing_tools
from app.agents.tool_registry import registry

def test_send_email_tool_structure():
    tool = SendEmailTool()
    assert tool.name == "send_email"
    res = tool._run(to_email="test@example.com", subject="Hello", body="Test email content")
    assert "test@example.com" in res
    assert "Hello" in res

def test_email_tool_registered_in_roles():
    biz_id = "00000000-0000-0000-0000-000000000001"
    admin_tools = register_admin_tools(business_id=biz_id)
    marketing_tools = register_marketing_tools(business_id=biz_id)

    admin_tool_names = [t.name for t in admin_tools]
    marketing_tool_names = [t.name for t in marketing_tools]

    assert "send_email" in admin_tool_names
    assert "send_email" in marketing_tool_names
