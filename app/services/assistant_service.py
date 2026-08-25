import os
import json
import logging
import re
import asyncio
from typing import Optional, Dict, Any, List
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from app.core.config import settings
from app.agents.llm_factory import get_llm, get_fast_llm
from app.services.shared_memory import SharedMemoryService
from app.services.task_service import TaskService
from app.agents.runner import TeamRunner

logger = logging.getLogger(__name__)


class PersonalAssistantService:
    """
    Personal Assistant Service for Company OS.
    Acts as an intelligent conversational chatbot and executive dispatcher:
    - If user input is conversational, informational, a query, or brainstorming:
      Replies directly as a friendly, sharp Chief of Staff / PA.
    - If user input is an actionable company mandate worthy of execution:
      Creates a task in Company OS, dispatches to the right specialist team,
      logs audit trail, and returns a clear confirmation.
    """

    def __init__(self):
        self.memory_service = SharedMemoryService()
        self.task_service = TaskService()

    def _get_history_key(self, business_id: str, channel: str, user_id: str) -> str:
        return f"pa_chat_history:{channel}:{user_id}"

    def get_recent_history(self, business_id: str, channel: str, user_id: str, limit: int = 6) -> List[Dict[str, str]]:
        """Retrieve recent conversation history from shared memory."""
        try:
            key = self._get_history_key(business_id, channel, user_id)
            res = self.memory_service.get(business_id, key)
            if res and isinstance(res, dict) and isinstance(res.get("value"), list):
                return res["value"][-limit:]
        except Exception as e:
            logger.debug(f"Could not load PA chat history: {e}")
        return []

    def save_chat_turn(self, business_id: str, channel: str, user_id: str, user_msg: str, assistant_msg: str):
        """Append a chat turn to shared memory history."""
        try:
            key = self._get_history_key(business_id, channel, user_id)
            history = self.get_recent_history(business_id, channel, user_id, limit=12)
            history.append({"role": "user", "content": user_msg})
            history.append({"role": "assistant", "content": assistant_msg})
            self.memory_service.set(
                business_id=business_id,
                key=key,
                value=history[-12:],
                tags=["pa_chat", channel, user_id],
                updated_by="PersonalAssistantService"
            )
        except Exception as e:
            logger.debug(f"Could not save PA chat turn: {e}")

    async def process_chat(
        self,
        message: str,
        business_id: str = "00000000-0000-0000-0000-000000000001",
        sender_name: Optional[str] = "Founder",
        channel: str = "web",
        chat_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Processes a user chat message:
        1. Classifies intent (conversational chat vs. actionable task).
        2. If chat: returns conversational response directly.
        3. If task: creates task, triggers TeamRunner in background, returns task details + acknowledgment.
        """
        cleaned_msg = (message or "").strip()
        if not cleaned_msg:
            return {
                "type": "chat_reply",
                "reply": "Hey there! How can I help you and your team today?",
                "is_task": False
            }

        effective_chat_id = chat_id or sender_name or "default_user"
        prior_history = history or self.get_recent_history(business_id, channel, effective_chat_id, limit=6)

        # Dynamic Tool Discovery across active integrations
        try:
            from app.services.tool_discovery_service import tool_discovery_service
            manifest = tool_discovery_service.get_discovered_tool_manifest(business_id=business_id, user_id=effective_chat_id)
            connected_toolkits = manifest.get("connected_toolkits", [])
            discovered_tools = manifest.get("discovered_tools", [])
            
            toolkits_desc = ", ".join([c["name"] for c in connected_toolkits]) or "Google Sheets"
            tools_bullet_points = "\n".join([f"- `{t['name']}` ({t['toolkit']}): {t['description']}" for t in discovered_tools])

            # Sheets config details
            gs_item = next((c for c in connected_toolkits if c["toolkit"] == "googlesheets"), None)
            sheets_url = gs_item.get("spreadsheet_url", "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit") if gs_item else "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
        except Exception as e:
            logger.debug(f"Dynamic tool discovery in assistant_service note: {e}")
            toolkits_desc = "Google Sheets"
            tools_bullet_points = "- `google_sheets` (googlesheets): Manage Chart of Accounts, General Ledger, and multi-entity models."
            sheets_url = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"

        system_prompt = f"""You are the Personal Assistant and Chief of Staff at Company OS, working directly with {sender_name or 'the Founder/CEO'}.

You operate in two modes:
1. CONVERSATIONAL CHATBOT (is_task: false):
   - For greetings, small talk, questions about the company, status inquiries, brainstorming, quick calculations, advice, general feedback, or thank-yous.
   - In this mode, produce a direct, helpful, natural, executive-level response to the user.
2. ACTIONABLE TASK DISPATCHER (is_task: true):
   - For actionable business mandates, project tasks, deliverables, or operational directives that need autonomous specialist execution (e.g. drafting invoices/reports, market research, code generation, auditing finances, launching campaigns, scheduling complex operations, creating Google Sheets financial models).
   - In this mode, summarize the task, pick the best specialist role, set priority, and formulate a crisp confirmation acknowledgment.

Company OS Specialist Roles:
- Finance Manager: Invoicing, financial modeling, Stripe audits, budget planning, expense reviews, Google Sheets financial tracking, multi-entity group accounting (SSS Group of Companies), Chart of Accounts, and General Ledger reconciliation.
- Marketing Manager: Marketing campaigns, copywriting, content calendars, social outreach, SEO.
- Software Engineer: Code implementation, architecture, bug fixes, software features, repository tasks.
- Research Specialist: Competitor intelligence, market analysis, deep web research, data aggregation.
- Admin & Operations Worker: Document processing, operational syncs, administrative triage.
- Personal Assistant: Multi-department coordination, general mandates, and automated scheduled routines.

DYNAMICALLY DISCOVERED CONNECTED INTEGRATIONS & TOOLS:
- Active Connected Services: {toolkits_desc}
{tools_bullet_points}

SPECIAL RULES FOR CONNECTED TOOLS & ROUTINES:
- All tools listed above are LIVE, CONNECTED, and ready for autonomous execution.
- NEVER state that connected tools (like Google Sheets, Gmail, Slack, etc.) are inactive or missing.
- When the user asks for the Google Sheets link or URL:
  - Respond directly (is_task: false) with the clickable link: [Open Google Sheet]({sheets_url}) and the full copyable URL `{sheets_url}`.
- When the user asks to create, schedule, or set up an AUTOMATED ROUTINE or RECURRING TASK (e.g. "create a routine to audit finances daily", "set up a routine for competitor tracking every hour", "schedule a routine to sync Google Sheets"):
  - Set `is_routine: true` in the output JSON.
  - Formulate routine_title, routine_schedule_type ('daily', 'hourly', 'weekly', 'interval_minutes'), routine_schedule_config (e.g. {{"time": "09:00"}} or {{"interval_minutes": 60}}), and routine_mandate.
  - Explain in your reply that the automated routine has been configured to execute autonomously in the background even if they are not logged in or using the web app.

CRITICAL: Return ONLY a valid JSON object with the exact keys:
{{
  "is_task": boolean,
  "is_routine": boolean,
  "intent_summary": "one sentence explaining what the user wants",
  "reply": "string (If is_task=false and is_routine=false: your direct conversational answer. If is_task=true or is_routine=true: a brief friendly acknowledgment explaining how you are handling/delegating it)",
  "task_title": "concise title (string or null if is_task=false)",
  "task_description": "refined actionable mandate (string or null if is_task=false)",
  "routine_title": "concise routine title (string or null if is_routine=false)",
  "routine_schedule_type": "daily | hourly | weekly | interval_minutes (or null)",
  "routine_schedule_config": {{"time": "09:00"}} (or null),
  "assignee_role": "Finance Manager | Marketing Manager | Software Engineer | Research Specialist | Admin & Operations Worker | Personal Assistant",
  "priority": "P0 | P1 | P2"
}}"""

        messages = [SystemMessage(content=system_prompt)]
        for turn in prior_history:
            role = turn.get("role")
            content = turn.get("content", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

        messages.append(HumanMessage(content=f"User ({sender_name}): {cleaned_msg}"))

        llm = get_fast_llm(temperature=0.2)
        parsed_data = None

        try:
            resp = await asyncio.to_thread(llm.invoke, messages)
            raw_content = (resp.content or "").strip()

            # Attempt to extract JSON block
            json_match = re.search(r"\{[\s\S]*\}", raw_content)
            if json_match:
                parsed_data = json.loads(json_match.group(0))
            else:
                parsed_data = {
                    "is_task": False,
                    "intent_summary": "General conversation",
                    "reply": raw_content,
                    "task_title": None,
                    "task_description": None,
                    "assignee_role": "Personal Assistant",
                    "priority": "P1"
                }
        except Exception as e:
            logger.warning(f"Error invoking LLM for PA chat: {e}. Using intelligent fallback.")
            # Fallback heuristic
            is_task_heuristic = any(
                cleaned_msg.lower().startswith(kw) for kw in ["create", "build", "draft", "research", "audit", "write", "analyze", "deploy", "schedule"]
            )
            if is_task_heuristic:
                parsed_data = {
                    "is_task": True,
                    "intent_summary": "Actionable task request",
                    "reply": f"Understood! I'm creating a task for this mandate and coordinating with the team.",
                    "task_title": cleaned_msg[:60],
                    "task_description": cleaned_msg,
                    "assignee_role": "Personal Assistant",
                    "priority": "P1"
                }
            else:
                parsed_data = {
                    "is_task": False,
                    "intent_summary": "Conversational greeting/query",
                    "reply": f"Hey {sender_name}! I'm here and ready to help. What would you like to work on or discuss?",
                    "task_title": None,
                    "task_description": None,
                    "assignee_role": "Personal Assistant",
                    "priority": "P1"
                }

        is_task = bool(parsed_data.get("is_task", False))
        is_routine = bool(parsed_data.get("is_routine", False))
        reply_text = str(parsed_data.get("reply") or "").strip()
        if not reply_text:
            reply_text = "I'm on it! Let me know if you need anything else."

        # Case 0: Automated Routine Request
        if is_routine:
            from app.services.routine_service import routine_service
            routine_title = parsed_data.get("routine_title") or cleaned_msg[:50]
            routine_desc = parsed_data.get("task_description") or cleaned_msg
            routine_role = parsed_data.get("assignee_role") or "Personal Assistant"
            schedule_type = parsed_data.get("routine_schedule_type") or "daily"
            schedule_cfg = parsed_data.get("routine_schedule_config") or {"time": "09:00"}
            
            created_routine = routine_service.create_routine(
                business_id=business_id,
                title=routine_title,
                description=routine_desc,
                assignee_role=routine_role,
                schedule_type=schedule_type,
                schedule_config=schedule_cfg,
                created_by=sender_name or "Founder"
            )

            confirm_msg = (
                f"✅ **Automated Routine Configured!**\n\n"
                f"**Routine:** {created_routine['title']}\n"
                f"**Assigned Specialist:** {created_routine['assignee_role']}\n"
                f"**Schedule:** {created_routine['schedule_type'].capitalize()} ({json.dumps(created_routine['schedule_config'])})\n"
                f"**Next Autonomous Execution:** {created_routine['next_run_at']}\n\n"
                f"*This routine is active and will execute automatically in the background even if you're not using the web app.*"
            )

            self.save_chat_turn(business_id, channel, effective_chat_id, cleaned_msg, confirm_msg)
            return {
                "type": "routine_created",
                "reply": confirm_msg,
                "is_task": False,
                "is_routine": True,
                "routine": created_routine,
                "intent_summary": "Automated routine created"
            }

        # Case 1: Pure conversation / query (Do NOT create task)
        if not is_task:
            self.save_chat_turn(business_id, channel, effective_chat_id, cleaned_msg, reply_text)
            return {
                "type": "chat_reply",
                "reply": reply_text,
                "is_task": False,
                "intent_summary": parsed_data.get("intent_summary", "Chat response")
            }

        # Case 2: Actionable Task worthy of dispatching
        task_title = parsed_data.get("task_title") or cleaned_msg[:60]
        task_desc = parsed_data.get("task_description") or cleaned_msg
        assignee_role = parsed_data.get("assignee_role") or "Personal Assistant"
        priority = parsed_data.get("priority") or "P1"

        try:
            full_mandate = f"[{channel.upper()} from {sender_name}]: {task_desc}"
            
            created_task = self.task_service.create_task(
                business_id=business_id,
                description=task_title,
                mandate=full_mandate,
                status="queued",
                priority=priority,
                assignee_role=assignee_role
            )

            task_id = created_task.get("id") if isinstance(created_task, dict) else str(created_task)

            # Log to Company Feed
            self.task_service.log_audit_event(
                business_id=business_id,
                role="Personal Assistant",
                agent_name="Personal Assistant",
                trust_tier="operate",
                action=f"Mandate Dispatched to {assignee_role}",
                details={
                    "from": sender_name,
                    "channel": channel,
                    "chat_id": effective_chat_id,
                    "task_id": task_id,
                    "mandate": task_desc,
                    "assignee_role": assignee_role,
                    "priority": priority
                }
            )

            # Trigger TeamRunner in background
            runner = TeamRunner(business_id=business_id, task_id=task_id)
            asyncio.create_task(asyncio.to_thread(runner.start, full_mandate))

            self.save_chat_turn(business_id, channel, effective_chat_id, cleaned_msg, reply_text)

            return {
                "type": "task_dispatched",
                "reply": reply_text,
                "is_task": True,
                "task_id": task_id,
                "task": created_task,
                "assignee_role": assignee_role,
                "priority": priority,
                "intent_summary": parsed_data.get("intent_summary", "Task created")
            }

        except Exception as err:
            logger.error(f"Failed to create and dispatch task from PA chat: {err}")
            fallback_reply = f"I noted your request ('{task_title}'), but encountered an error dispatching the autonomous fleet: {err}. How else can I assist?"
            self.save_chat_turn(business_id, channel, effective_chat_id, cleaned_msg, fallback_reply)
            return {
                "type": "chat_reply",
                "reply": fallback_reply,
                "is_task": False,
                "error": str(err)
            }


# Global singleton instance
assistant_service = PersonalAssistantService()
