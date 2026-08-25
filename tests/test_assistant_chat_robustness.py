import asyncio
from app.services.assistant_service import PersonalAssistantService

def test_assistant_processes_expense_mandate():
    async def _run():
        pa = PersonalAssistantService()
        res = await pa.process_chat(
            business_id="00000000-0000-0000-0000-000000000001",
            channel="web_chat",
            message="add $100 of expenses to the expense tracker",
            sender_name="Founder"
        )
        assert res is not None
        assert "functioncall" not in res.get("reply", "").lower()
        if res.get("is_task"):
            assert res.get("assignee_role") == "Finance Manager"
            assert res.get("task_id") is not None
        else:
            assert len(res.get("reply", "")) > 0

    asyncio.run(_run())

def test_assistant_processes_email_mandate():
    async def _run():
        pa = PersonalAssistantService()
        res = await pa.process_chat(
            business_id="00000000-0000-0000-0000-000000000001",
            channel="web_chat",
            message="send an email to imira email address :- imirawelihinda@gmail.com saying hello",
            sender_name="Founder"
        )
        assert res is not None
        assert "functioncall" not in res.get("reply", "").lower()
        if res.get("is_task"):
            assert res.get("assignee_role") in ["Marketing Manager", "Personal Assistant"]

    asyncio.run(_run())
