import logging
from typing import List, Optional, Any
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage
from langchain.memory import ConversationSummaryBufferMemory

from app.core.config import settings
from app.services.shared_memory import SharedMemoryService
from app.services.context_compressor import count_tokens, is_nvidia_provider_active
from app.agents.llm_factory import get_llm

logger = logging.getLogger(__name__)
memory_service = SharedMemoryService()


def get_summary_key(business_id: str, task_id: str) -> str:
    return f"chat_summary:{task_id}"


def get_conversation_memory(
    business_id: str,
    task_id: str,
    max_token_limit: Optional[int] = None
) -> ConversationSummaryBufferMemory:
    """
    Constructs a ConversationSummaryBufferMemory instance backed by the NIM-resolved LLM.
    Restores existing running summary from SharedMemoryService if available.
    """
    token_limit = max_token_limit or getattr(settings, "CONVERSATION_MEMORY_MAX_TOKENS", 2048)
    llm = get_llm(role="default", temperature=0.0)

    memory = ConversationSummaryBufferMemory(
        llm=llm,
        max_token_limit=token_limit,
        return_messages=True,
        memory_key="history"
    )

    # Restore existing summary from persistent shared memory
    try:
        key = get_summary_key(business_id, task_id)
        saved = memory_service.get(business_id, key)
        if saved and isinstance(saved, dict) and saved.get("value"):
            memory.moving_summary_buffer = str(saved["value"])
    except Exception as e:
        logger.debug(f"Could not load conversation summary for task {task_id}: {e}")

    return memory


def prune_and_summarize_messages(
    messages: List[BaseMessage],
    business_id: str,
    task_id: str
) -> List[BaseMessage]:
    """
    Prunes and summarizes older turns in the message history when running under NVIDIA NIM.
    Guarantees that the active turn (messages[-1]) is NEVER summarized away.
    """
    if not messages:
        return messages

    # Only apply memory compression for NVIDIA NIM provider
    if not is_nvidia_provider_active():
        return messages

    token_limit = getattr(settings, "CONVERSATION_MEMORY_MAX_TOKENS", 2048)
    
    # Calculate current token load across all messages
    full_text = "\n".join([f"{getattr(m, 'type', 'message')}: {m.content}" for m in messages if hasattr(m, "content")])
    total_tokens = count_tokens(full_text)

    if total_tokens <= token_limit or len(messages) <= 1:
        return messages

    # Strictly separate older turns from the latest active turn
    older_messages = messages[:-1]
    active_turn = messages[-1]

    memory = get_conversation_memory(business_id, task_id, max_token_limit=token_limit)

    try:
        memory.chat_memory.messages = list(older_messages)

        buffer_tokens = count_tokens("\n".join([str(getattr(m, "content", "")) for m in memory.chat_memory.messages]))
        target_buffer = max(10, token_limit // 2)

        if buffer_tokens > target_buffer:
            excess_messages: List[BaseMessage] = []
            while memory.chat_memory.messages and count_tokens("\n".join([str(getattr(m, "content", "")) for m in memory.chat_memory.messages])) > target_buffer:
                excess_messages.append(memory.chat_memory.messages.pop(0))

            if excess_messages:
                new_summary = memory.predict_new_summary(
                    excess_messages,
                    memory.moving_summary_buffer
                )
                memory.moving_summary_buffer = new_summary

        # Persist summary back to SharedMemoryService
        if memory.moving_summary_buffer:
            memory_service.set(
                business_id=business_id,
                key=get_summary_key(business_id, task_id),
                value=memory.moving_summary_buffer,
                tags=["conversation_memory", "summary", task_id],
                updated_by="ConversationMemoryService"
            )

        pruned_messages: List[BaseMessage] = []
        if memory.moving_summary_buffer:
            pruned_messages.append(
                SystemMessage(content=f"[Context Summary of Prior Dialog & Operations]: {memory.moving_summary_buffer}")
            )
        for msg in memory.chat_memory.messages:
            pruned_messages.append(msg)
            
        pruned_messages.append(active_turn)

        new_text = "\n".join([f"{getattr(m, 'type', 'message')}: {m.content}" for m in pruned_messages if hasattr(m, "content")])
        new_tokens = count_tokens(new_text)

        logger.info(
            f"[Conversation Memory] Summarized older turns for task '{task_id}'. "
            f"History pruned from {total_tokens} -> {new_tokens} tokens (NVIDIA NIM ceiling: {token_limit}). "
            f"Active turn preserved intact."
        )
        return pruned_messages

    except Exception as e:
        logger.warning(f"Error during conversation summary pruning: {e}. Preserving original messages.")
        return messages
