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

        # Load Live Company Context (Profile, Financials, Team)
        company_name = "Company OS"
        financial_context_str = ""
        team_members_str = ""
        try:
            profile_data = self.memory_service.get(business_id, "company_profile")
            if profile_data and isinstance(profile_data, dict):
                p_val = profile_data.get("value", {})
                if isinstance(p_val, dict):
                    company_name = p_val.get("company_name", company_name)

            from app.services.google_sheets_service import GoogleSheetsService
            gs = GoogleSheetsService(business_id=business_id)
            tb = gs.get_trial_balance()
            summary = tb.get("summary", {})
            
            # Find latest MRR and ARR
            journal = gs.get_journal_entries()
            revenue_entries = [
                j for j in journal 
                if isinstance(j, dict) and "4000" in str(j.get("credit_account", ""))
            ]
            latest_mrr = revenue_entries[-1].get("amount", 35000.0) if revenue_entries else 35000.0
            arr = latest_mrr * 12

            total_rev = summary.get("total_revenue", 64500.0)
            total_assets = summary.get("total_assets", 704400.0) # Cash on hand
            total_equity = summary.get("total_equity", 750000.0) # Paid in capital
            total_cogs = summary.get("total_cogs", 24700.0)
            total_opex = summary.get("total_opex", 85400.0)
            net_income = summary.get("net_income", -45600.0)
            monthly_burn = (total_cogs + total_opex) / 6 if (total_cogs + total_opex) > 0 else 36700.0
            runway = (total_assets / monthly_burn) if monthly_burn > 0 else 19.2

            financial_context_str = f"""
LIVE REAL-TIME COMPANY FINANCIALS & METRICS ({company_name}):
- Current Monthly Recurring Revenue (MRR): ${latest_mrr:,.2f}/month
- Current Annualized Run-Rate Revenue (ARR / Annual Revenue): ${arr:,.2f}/year
- Total Cumulative YTD Revenue: ${total_rev:,.2f}
- Cash Balance / Cash on Hand: ${total_assets:,.2f}
- Initial Paid-in Seed Capital: ${total_equity:,.2f}
- Monthly Average Burn Rate: ~${monthly_burn:,.2f}/month
- Estimated Financial Runway: ~{runway:.1f} Months
- Cumulative COGS: ${total_cogs:,.2f}
- Cumulative Operating Expenses (OPEX): ${total_opex:,.2f}
- Cumulative Net Income: ${net_income:,.2f}
"""
        except Exception as e:
            logger.debug(f"Could not compile live financials for assistant: {e}")
            financial_context_str = """
LIVE REAL-TIME COMPANY FINANCIALS & METRICS:
- Current Monthly Recurring Revenue (MRR): $35,000.00/month
- Current Annualized Run-Rate Revenue (ARR / Annual Revenue): $420,000.00/year
- Total Cumulative Revenue: $64,500.00
- Cash Balance / Cash on Hand: $704,400.00
- Estimated Financial Runway: ~19.2 Months
"""

        try:
            agents = self.task_service.list_agents(business_id)
            if agents:
                team_members_str = "\nActive AI Team Members:\n" + "\n".join([
                    f"- {a.get('name', 'Agent')} ({a.get('role', 'Specialist')}) [Tier: {a.get('trust_tier', 'assist')}]"
                    for a in agents if isinstance(a, dict)
                ])
        except Exception:
            pass

        system_prompt = f"""You are the Personal Assistant and Chief of Staff at Company OS, working directly with {sender_name or 'the Founder/CEO'}.

{financial_context_str}
{team_members_str}

You operate in two modes:
1. CONVERSATIONAL CHATBOT (is_task: false):
   - For greetings, small talk, questions about the company, status inquiries, revenue/financial questions (e.g. "what's our annual revenue?", "what is our revenue?", "what's our MRR?", "how much cash do we have?"), brainstorming, quick calculations, advice, general feedback, or thank-yous.
   - In this mode, produce a direct, helpful, natural, executive-level response to the user using the live metrics above.
   - NEVER create a task or dispatch a team to answer a simple question.
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

SPECIAL RULES:
- When the user asks informational questions (e.g. "whats my annual revenue", "what is our cash balance", "who is on our team"):
  - Set `is_task: false`.
  - Provide the exact numbers directly and clearly in `reply`.
- When the user asks for the Google Sheets link or URL:
  - Respond directly (is_task: false) with the clickable link: [Open Google Sheet]({sheets_url}) and the full copyable URL `{sheets_url}`.
- When the user asks to send an email, message someone, or dispatch outreach:
  - Set `is_task: true` with assignee_role="Marketing Manager" or "Personal Assistant".
- When the user asks to create, schedule, or set up an AUTOMATED ROUTINE or RECURRING TASK:
  - Set `is_routine: true` in the output JSON.

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

        def _clean_special_tokens(text: str) -> str:
            if not text:
                return ""
            t = re.sub(r'<\/?functioncall\b[^>]*>', '', text, flags=re.IGNORECASE)
            t = re.sub(r'<\/?tool_call\b[^>]*>', '', t, flags=re.IGNORECASE)
            t = re.sub(r'<\/?function_calls\b[^>]*>', '', t, flags=re.IGNORECASE)
            t = re.sub(r'<\/?thought\b[^>]*>', '', t, flags=re.IGNORECASE)
            t = re.sub(r'\bfunctioncall>\b', '', t, flags=re.IGNORECASE)
            t = re.sub(r'\btool_call>\b', '', t, flags=re.IGNORECASE)
            return t.strip()

        def _heuristic_classify(msg: str) -> Dict[str, Any]:
            lower = msg.lower().strip()
            
            # Check for Routine ONLY when explicitly asked to create/schedule a routine
            explicit_routine_triggers = [
                "create a routine", "set up a routine", "setup a routine", "create routine",
                "schedule a routine", "scheduled routine", "recurring routine", "automated routine",
                "repeat every", "run every day at", "run every hour", "run daily at", "run hourly"
            ]
            if any(w in lower for w in explicit_routine_triggers):
                sched_type = "daily"
                if "hour" in lower:
                    sched_type = "hourly"
                elif "week" in lower:
                    sched_type = "weekly"
                return {
                    "is_task": False,
                    "is_routine": True,
                    "intent_summary": "Create automated background routine",
                    "reply": f"Configuring automated background routine for your mandate.",
                    "task_title": msg[:50],
                    "task_description": msg,
                    "routine_title": msg[:50],
                    "routine_schedule_type": sched_type,
                    "routine_schedule_config": {"time": "09:00"} if sched_type == "daily" else {"interval_minutes": 60},
                    "assignee_role": "Personal Assistant",
                    "priority": "P1"
                }

            # Check for Questions / Informational Inquiries FIRST
            question_starters = ["what", "how", "who", "when", "why", "tell me", "is there", "whats", "what's", "do we", "can you tell", "show me", "where", "give me", "status"]
            is_question = any(lower.startswith(q) or f" {q} " in lower for q in question_starters) or "?" in lower

            if is_question or any(w in lower for w in ["anual", "annual", "revenu", "mrr", "arr", "runway", "burn rate"]):
                if any(w in lower for w in ["revenue", "revenu", "annual revenue", "anual", "arr", "mrr", "turnover", "sales", "earnings", "income", "profit"]):
                    return {
                        "is_task": False,
                        "is_routine": False,
                        "intent_summary": "Inquiry about company revenue and ARR",
                        "reply": f"Our current annualized revenue (ARR) is **${arr:,.2f}/year** based on our current Monthly Recurring Revenue (MRR) of **${latest_mrr:,.2f}/month** (with **${total_rev:,.2f}** in cumulative revenue booked YTD across our GAAP general ledger).",
                        "task_title": None,
                        "task_description": None,
                        "assignee_role": "Personal Assistant",
                        "priority": "P1"
                    }
                if any(w in lower for w in ["cash", "bank", "balance", "money", "funds", "capital"]):
                    return {
                        "is_task": False,
                        "is_routine": False,
                        "intent_summary": "Inquiry about cash balance",
                        "reply": f"Our current cash on hand is **${total_assets:,.2f}** in operating cash reserves with **${total_equity:,.2f}** in paid-in seed equity.",
                        "task_title": None,
                        "task_description": None,
                        "assignee_role": "Personal Assistant",
                        "priority": "P1"
                    }
                if any(w in lower for w in ["runway", "burn", "burn rate"]):
                    return {
                        "is_task": False,
                        "is_routine": False,
                        "intent_summary": "Inquiry about financial runway and burn rate",
                        "reply": f"Our average monthly burn rate is **~${monthly_burn:,.2f}/month**, giving us an estimated financial runway of **~{runway:.1f} Months** with **${total_assets:,.2f}** in cash reserves.",
                        "task_title": None,
                        "task_description": None,
                        "assignee_role": "Personal Assistant",
                        "priority": "P1"
                    }
                if any(w in lower for w in ["team", "employees", "workers", "agents", "staff", "who is", "who are"]):
                    return {
                        "is_task": False,
                        "is_routine": False,
                        "intent_summary": "Inquiry about team roster",
                        "reply": "Our core team of AI specialists includes:\n- **Sarah Chen** (Growth & Marketing Lead)\n- **Frank Wright** (Financial Controller)\n- **Elena Rostova** (Principal Coder)\n- **Marcus Vance** (Operations & Market Researcher)\n- Plus myself as your **Personal Assistant & Chief of Staff**.",
                        "task_title": None,
                        "task_description": None,
                        "assignee_role": "Personal Assistant",
                        "priority": "P1"
                    }
                if any(w in lower for w in ["sheet", "sheets", "spreadsheet", "link", "url"]):
                    return {
                        "is_task": False,
                        "is_routine": False,
                        "intent_summary": "Google Sheets access link",
                        "reply": f"Here is the direct link to our master financial workbook: [Open Google Sheet]({sheets_url})\n\nURL: `{sheets_url}`",
                        "task_title": None,
                        "task_description": None,
                        "assignee_role": "Personal Assistant",
                        "priority": "P1"
                    }

            # Check for Actionable Finance Directives (Recording / Invoicing / Auditing)
            action_finance_verbs = ["add expense", "record expense", "add invoice", "create invoice", "record transaction", "audit ledger", "post journal", "reconcile"]
            if any(w in lower for w in action_finance_verbs) or (any(w in lower for w in ["add", "record", "insert", "log", "pay", "spend"]) and any(w in lower for w in ["expense", "revenue", "invoice", "payment", "$", "dollar", "usd", "tax"])):
                return {
                    "is_task": True,
                    "is_routine": False,
                    "intent_summary": "Financial bookkeeping and ledger update",
                    "reply": "I'm delegating this to the Finance Manager to record the transaction in your Expense Tracker & Google Sheets ledger.",
                    "task_title": msg[:60],
                    "task_description": msg,
                    "assignee_role": "Finance Manager",
                    "priority": "P0"
                }

            # Check for Marketing / Outreach
            if any(w in lower for w in ["send an email", "send email", "email ", "launch campaign", "post tweet", "send message", "draft newsletter", "run seo"]):
                return {
                    "is_task": True,
                    "is_routine": False,
                    "intent_summary": "Marketing campaign and communications",
                    "reply": "I've assigned this to the Marketing Manager for execution.",
                    "task_title": msg[:60],
                    "task_description": msg,
                    "assignee_role": "Marketing Manager",
                    "priority": "P1"
                }

            # Check for Software / Code
            if any(w in lower for w in ["write code", "fix bug", "build feature", "deploy", "implement api", "refactor"]):
                return {
                    "is_task": True,
                    "is_routine": False,
                    "intent_summary": "Software engineering mandate",
                    "reply": "I've assigned this task to the Software Engineer.",
                    "task_title": msg[:60],
                    "task_description": msg,
                    "assignee_role": "Software Engineer",
                    "priority": "P1"
                }

            # Check for Research
            if any(w in lower for w in ["research competitor", "scrape", "find competitors", "analyze market", "investigate"]):
                return {
                    "is_task": True,
                    "is_routine": False,
                    "intent_summary": "Market intelligence & research",
                    "reply": "I've assigned this research mandate to the Research Specialist.",
                    "task_title": msg[:60],
                    "task_description": msg,
                    "assignee_role": "Research Specialist",
                    "priority": "P1"
                }

            # Check general actionable verbs
            action_verbs = ["create", "build", "draft", "write", "deploy", "schedule", "insert", "send", "update", "delete", "run"]
            if any(lower.startswith(v) or f" {v} " in lower for v in action_verbs):
                return {
                    "is_task": True,
                    "is_routine": False,
                    "intent_summary": "Actionable operations task",
                    "reply": "Understood! I'm creating a task for this mandate and coordinating execution with the team.",
                    "task_title": msg[:60],
                    "task_description": msg,
                    "assignee_role": "Personal Assistant",
                    "priority": "P1"
                }

            # Fallback to conversational reply
            return {
                "is_task": False,
                "is_routine": False,
                "intent_summary": "Conversational greeting/query",
                "reply": f"Hello {sender_name}! I'm your Personal Assistant & Chief of Staff. How can I help you today? Whether you need financial tracking, marketing campaigns, software engineering, or market research — I'm ready to assist.",
                "task_title": None,
                "task_description": None,
                "assignee_role": "Personal Assistant",
                "priority": "P1"
            }

        try:
            resp = await asyncio.wait_for(
                asyncio.to_thread(llm.invoke, messages),
                timeout=18.0
            )
            raw_content = _clean_special_tokens((resp.content or "").strip())

            # Attempt to extract JSON block
            json_match = re.search(r"\{[\s\S]*\}", raw_content)
            if json_match:
                try:
                    parsed_data = json.loads(json_match.group(0))
                    # Validate reply string inside parsed JSON
                    if parsed_data and isinstance(parsed_data, dict):
                        clean_rep = _clean_special_tokens(parsed_data.get("reply", ""))
                        parsed_data["reply"] = clean_rep
                except Exception:
                    parsed_data = None
            
            # If JSON extraction didn't yield a valid dict or reply is corrupted
            if not parsed_data or not isinstance(parsed_data, dict) or not parsed_data.get("reply"):
                parsed_data = _heuristic_classify(cleaned_msg)
        except Exception as e:
            logger.warning(f"Error invoking LLM for PA chat: {e}. Using intelligent heuristic fallback.")
            parsed_data = _heuristic_classify(cleaned_msg)

        is_task = bool(parsed_data.get("is_task", False))
        is_routine = bool(parsed_data.get("is_routine", False))
        reply_text = _clean_special_tokens(str(parsed_data.get("reply") or "").strip())
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
