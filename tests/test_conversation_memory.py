import pytest
from unittest.mock import patch
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.language_models.fake_chat_models import FakeListChatModel

from app.services.conversation_memory import (
    get_conversation_memory,
    prune_and_summarize_messages,
    get_summary_key,
)
from app.services.shared_memory import SharedMemoryService
from app.services.context_compressor import count_tokens


@pytest.fixture(autouse=True)
def clean_test_env():
    with patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", None), \
         patch("app.agents.llm_factory.settings.GEMINI_API_KEY", None), \
         patch("app.agents.llm_factory.settings.GOOGLE_API_KEY", None):
        yield


def test_prune_and_summarize_short_history_unchanged():
    messages = [
        HumanMessage(content="What are our sales today?"),
        AIMessage(content="Sales today are $1,250 across 12 orders.")
    ]
    with patch("app.services.conversation_memory.is_nvidia_provider_active", return_value=True):
        res = prune_and_summarize_messages(messages, business_id="b-1", task_id="t-1")
        assert len(res) == 2
        assert res[0].content == messages[0].content
        assert res[1].content == messages[1].content


def test_prune_and_summarize_preserves_active_turn():
    long_history = []
    for i in range(25):
        long_history.append(HumanMessage(content=f"Historical Question #{i}: details about operation {i} with extensive descriptions and metrics to increase token length."))
        long_history.append(AIMessage(content=f"Historical Answer #{i}: operational report for task {i} executed with detailed breakdown."))

    active_turn_content = "ACTIVE MANDATE: Send the finalized quarterly board report immediately."
    active_turn = HumanMessage(content=active_turn_content)
    all_messages = long_history + [active_turn]

    b_id = "test-business-uuid"
    t_id = "test-task-uuid"

    fake_llm = FakeListChatModel(responses=["Summary of 25 historical questions and reports." for _ in range(50)])

    with patch("app.services.conversation_memory.is_nvidia_provider_active", return_value=True), \
         patch("app.services.conversation_memory.get_llm", return_value=fake_llm), \
         patch("app.services.conversation_memory.settings.CONVERSATION_MEMORY_MAX_TOKENS", 200):
        
        pruned = prune_and_summarize_messages(all_messages, business_id=b_id, task_id=t_id)

        # 1. Active turn MUST be the final message and verbatim intact
        assert len(pruned) >= 1
        assert pruned[-1].content == active_turn_content

        # 2. Total token count of pruned history must be substantially smaller
        orig_tokens = count_tokens("\n".join([m.content for m in all_messages]))
        new_tokens = count_tokens("\n".join([m.content for m in pruned]))
        assert new_tokens < orig_tokens


def test_prune_and_summarize_persists_to_shared_memory():
    long_history = [
        HumanMessage(content="Audit check step 1: check ledger accounts for discrepancies."),
        AIMessage(content="Ledger accounts 101-105 verified with 0 errors."),
        HumanMessage(content="Audit check step 2: reconcile invoice payments for vendors."),
        AIMessage(content="Vendor invoices matched with bank statements."),
        HumanMessage(content="Active Final Step: Output final trial balance summary.")
    ]
    b_id = "persisted-biz-uuid"
    t_id = "persisted-task-uuid"

    memory_service = SharedMemoryService()
    fake_llm = FakeListChatModel(responses=["Prior audit verified ledger accounts and matched vendor invoices." for _ in range(50)])

    with patch("app.services.conversation_memory.is_nvidia_provider_active", return_value=True), \
         patch("app.services.conversation_memory.get_llm", return_value=fake_llm), \
         patch("app.services.conversation_memory.settings.CONVERSATION_MEMORY_MAX_TOKENS", 30):
        
        pruned = prune_and_summarize_messages(long_history, business_id=b_id, task_id=t_id)
        assert pruned[-1].content == "Active Final Step: Output final trial balance summary."

        # Verify saved state in SharedMemory
        key = get_summary_key(b_id, t_id)
        saved = memory_service.get(b_id, key)
        assert saved is not None
