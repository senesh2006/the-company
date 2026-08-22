import logging
from typing import Optional, List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.language_models.chat_models import SimpleChatModel
from langchain_core.messages import BaseMessage, AIMessage
from langchain_core.runnables import RunnableLambda
from app.core.config import settings

logger = logging.getLogger(__name__)

def _is_valid_key(key: Optional[str]) -> bool:
    """Check if an API key is non-empty, not None, not a URL, and not a placeholder string."""
    if not key or not isinstance(key, str):
        return False
    k = key.strip()
    if not k or len(k) < 6:
        return False
    if k.startswith("http://") or k.startswith("https://") or "/" in k:
        return False
    placeholders = (
        "sk-...", "gsk_...", "nvapi-...", "your-", "replace-",
        "sk-dummy", "gsk-dummy", "nvapi-dummy", "AIzaSy...",
        "sk-no-key-configured"
    )
    if any(k.startswith(p) for p in placeholders) or k in {"sk-...", "gsk_...", "nvapi-...", "AIzaSy...", "sk-no-key-configured"}:
        return False
    return True


class MissingApiKeyFallbackLLM(SimpleChatModel):
    """Fallback LLM returned when no valid API key is present or when all API keys fail authentication."""
    
    def _call(self, messages: List[BaseMessage], stop: Optional[List[str]] = None, **kwargs) -> str:
        return (
            "⚠️ Configuration Required: No valid LLM API Key was found in your deployment environment variables. "
            "Please configure GROQ_API_KEY, OPENAI_API_KEY, NVIDIA_API_KEY, FIREWORKS_API_KEY, or GEMINI_API_KEY."
        )

    @property
    def _llm_type(self) -> str:
        return "missing_key_fallback"

    def bind_tools(self, tools: Any, **kwargs: Any) -> Any:
        """Mock bind_tools so that create_react_agent does not crash on initialization."""
        return self

    def with_structured_output(self, schema: Any, **kwargs):
        """Allow structured output calls (e.g. SupervisorDecision) to return a safe fallback object."""
        def _mock_structured(input_data, config=None):
            try:
                if hasattr(schema, "model_construct"):
                    return schema.model_construct(
                        thoughts="⚠️ Invalid or Missing LLM API Key. Please add GROQ_API_KEY, OPENAI_API_KEY, NVIDIA_API_KEY, or GEMINI_API_KEY to your environment variables.",
                        action="finish",
                        new_tasks=[],
                        executive_brief="Operational Warning: No valid LLM API key configured in environment variables."
                    )
            except Exception:
                pass
            try:
                return schema()
            except Exception:
                return None
        return RunnableLambda(_mock_structured)


# Model registry: public display id -> (provider_model_id, provider)
MODEL_REGISTRY = {
    "kimi-k3": ("llama-3.3-70b-versatile", "groq"),
    "gpt-4o": ("gpt-4o", "openai"),
    "gpt-4o-mini": ("gpt-4o-mini", "openai"),
    "llama-3.1-70b": ("llama-3.3-70b-versatile", "groq"),
    "llama-v3-8b": ("llama-3.1-8b-instant", "groq"),
    "qwen2.5-72b": ("qwen-qwq-32b", "groq"),
    "deepseek-r1": ("deepseek-r1-distill-llama-70b", "groq"),
    "mistral-small-24b": ("mixtral-8x7b-32768", "groq"),
}

NVIDIA_MODEL_MAP = {
    "kimi-k3": "meta/llama-3.3-70b-instruct",
    "llama-3.1-70b": "meta/llama-3.3-70b-instruct",
    "llama-v3-8b": "meta/llama-3.1-8b-instruct",
    "qwen2.5-72b": "qwen/qwen2.5-72b-instruct",
    "deepseek-r1": "deepseek-ai/deepseek-r1",
    "mistral-small-24b": "mistralai/mixtral-8x7b-instruct-v0.1",
}

DEFAULT_AGENT_MODEL_ID = "kimi-k3"
BROKEN_MODEL_IDS = {"llama-3.1-8b"}

MODEL_DISPLAY = {
    "kimi-k3": {"name": "Llama 3.3 70B", "provider": "Groq", "tier": "power"},
    "gpt-4o": {"name": "GPT-4o", "provider": "OpenAI", "tier": "standard"},
    "gpt-4o-mini": {"name": "GPT-4o Mini", "provider": "OpenAI", "tier": "fast"},
    "llama-3.1-70b": {"name": "Llama 3.3 70B", "provider": "Groq", "tier": "standard"},
    "llama-v3-8b": {"name": "Llama 3.1 8B", "provider": "Groq", "tier": "fast"},
    "qwen2.5-72b": {"name": "Qwen QwQ 32B", "provider": "Groq", "tier": "standard"},
    "deepseek-r1": {"name": "DeepSeek R1 Distill 70B", "provider": "Groq", "tier": "power"},
    "mistral-small-24b": {"name": "Mixtral 8x7B", "provider": "Groq", "tier": "fast"},
}

DEFAULT_MODEL_BY_ROLE = {
    "Finance Manager": "kimi-k3",
    "Marketing Manager": "kimi-k3",
    "Admin & Operations Worker": "kimi-k3",
    "Research Specialist": "kimi-k3",
    "EngineeringWorker": "kimi-k3",
    "Coder": "kimi-k3",
    "Engineering Manager": "kimi-k3",
    "Software Engineer": "kimi-k3",
    "default": "kimi-k3",
}


def _groq_model_name(model_id: str) -> str:
    custom = getattr(settings, "GROQ_CUSTOM_MODEL", None)
    if custom:
        return custom
    return MODEL_REGISTRY.get(model_id, ("llama-3.3-70b-versatile", "groq"))[0]


def _nvidia_model_name(model_id: str) -> str:
    custom = getattr(settings, "NVIDIA_CUSTOM_MODEL", None)
    if custom:
        return custom
    return NVIDIA_MODEL_MAP.get(model_id, "meta/llama-3.3-70b-instruct")


def resolve_model(model_id: Optional[str], role: Optional[str] = None) -> tuple[str, Optional[str]]:
    """
    Resolve requested model to known provider with valid API keys.
    Returns (model_name, provider_name). If no valid key is found for any provider, provider is None.
    """
    has_groq = _is_valid_key(settings.GROQ_API_KEY)
    has_openai = _is_valid_key(settings.OPENAI_API_KEY)
    has_nvidia = _is_valid_key(settings.NVIDIA_API_KEY)
    has_gemini = _is_valid_key(settings.GEMINI_API_KEY) or _is_valid_key(settings.GOOGLE_API_KEY)
    has_fireworks = _is_valid_key(getattr(settings, "FIREWORKS_API_KEY", None))

    logger.info(f"[LLM Resolve] Keys available: NVIDIA={has_nvidia}, Groq={has_groq}, Fireworks={has_fireworks}, OpenAI={has_openai}, Gemini={has_gemini}")

    # Forced provider override (only if that provider's key is valid)
    forced = (getattr(settings, "LLM_PROVIDER", None) or "").strip().lower()
    if forced:
        logger.info(f"[LLM Resolve] LLM_PROVIDER forced to: '{forced}'")
        if forced == "groq" and has_groq:
            return _groq_model_name(model_id or "kimi-k3"), "groq"
        elif forced == "openai" and has_openai:
            return "gpt-4o-mini", "openai"
        elif forced == "nvidia" and has_nvidia:
            return _nvidia_model_name(model_id or "kimi-k3"), "nvidia"
        elif forced == "fireworks" and has_fireworks:
            return "accounts/fireworks/models/llama-v3p3-70b-instruct", "fireworks"
        elif forced == "gemini" and has_gemini:
            return "gemini-2.0-flash", "gemini"
        else:
            logger.warning(f"[LLM Resolve] Forced provider '{forced}' has no valid key! Falling through to auto-detection...")

    if not model_id or model_id not in MODEL_REGISTRY or model_id in BROKEN_MODEL_IDS:
        model_id = DEFAULT_MODEL_BY_ROLE.get(role or "default", DEFAULT_MODEL_BY_ROLE["default"])

    model_name, default_provider = MODEL_REGISTRY[model_id]

    # Priority 1: NVIDIA NIM
    if has_nvidia:
        chosen = _nvidia_model_name(model_id), "nvidia"
        logger.info(f"[LLM Resolve] Selected NVIDIA: {chosen[0]}")
        return chosen

    # Priority 2: Groq
    if has_groq:
        chosen = _groq_model_name(model_id), "groq"
        logger.info(f"[LLM Resolve] Selected Groq: {chosen[0]}")
        return chosen

    # Priority 3: Fireworks AI
    if has_fireworks:
        logger.info("[LLM Resolve] Selected Fireworks AI")
        return "accounts/fireworks/models/llama-v3p3-70b-instruct", "fireworks"

    # Priority 4: OpenAI
    if has_openai:
        fallback_model = MODEL_REGISTRY["gpt-4o-mini"][0] if "gpt-4o-mini" in MODEL_REGISTRY else "gpt-4o"
        logger.info(f"[LLM Resolve] Selected OpenAI: {fallback_model}")
        return fallback_model, "openai"

    # Priority 5: Gemini
    if has_gemini:
        logger.info("[LLM Resolve] Selected Gemini")
        return "gemini-2.0-flash", "gemini"

    # No valid API keys found in environment
    logger.warning("[LLM Resolve] No valid API keys found!")
    return model_name, None


def get_llm(model_id: Optional[str] = None, role: Optional[str] = None, temperature: float = 0.0):
    """
    Build a resilient ChatOpenAI model instance with automated fallback across available API providers.
    If no valid API keys are configured, returns MissingApiKeyFallbackLLM to prevent crash.
    """
    model_name, provider = resolve_model(model_id, role)
    logger.info(f"[LLM Factory] Building LLM: model={model_name}, provider={provider}, role={role}")

    candidates = []

    # Helper to append candidate ChatOpenAI instance
    def add_candidate(m_name, p_name, key, base):
        if _is_valid_key(key):
            try:
                candidates.append(ChatOpenAI(
                    model=m_name,
                    api_key=key,
                    base_url=base,
                    temperature=temperature,
                    timeout=60,
                    max_retries=2,
                ))
                logger.info(f"[LLM Factory] Added candidate: {p_name} ({m_name})")
            except Exception as e:
                logger.warning(f"Failed to create ChatOpenAI for provider {p_name}: {e}")

    if provider == "nvidia":
        add_candidate(model_name, "nvidia", settings.NVIDIA_API_KEY, settings.NVIDIA_BASE_URL)
    elif provider == "groq":
        add_candidate(model_name, "groq", settings.GROQ_API_KEY, "https://api.groq.com/openai/v1")
    elif provider == "fireworks":
        add_candidate(model_name, "fireworks", getattr(settings, "FIREWORKS_API_KEY", None), "https://api.fireworks.ai/inference/v1")
    elif provider == "openai":
        add_candidate(model_name, "openai", settings.OPENAI_API_KEY, None)
    elif provider == "gemini":
        add_candidate("gemini-2.0-flash", "gemini", settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY, settings.GEMINI_BASE_URL)

    # Add remaining valid API keys as secondary fallbacks
    if provider != "nvidia" and _is_valid_key(settings.NVIDIA_API_KEY):
        add_candidate(_nvidia_model_name(model_id or "kimi-k3"), "nvidia", settings.NVIDIA_API_KEY, settings.NVIDIA_BASE_URL)
    if provider != "groq" and _is_valid_key(settings.GROQ_API_KEY):
        add_candidate(_groq_model_name(model_id or "kimi-k3"), "groq", settings.GROQ_API_KEY, "https://api.groq.com/openai/v1")
    if provider != "fireworks" and _is_valid_key(getattr(settings, "FIREWORKS_API_KEY", None)):
        add_candidate("accounts/fireworks/models/llama-v3p3-70b-instruct", "fireworks", getattr(settings, "FIREWORKS_API_KEY", None), "https://api.fireworks.ai/inference/v1")
    if provider != "openai" and _is_valid_key(settings.OPENAI_API_KEY):
        add_candidate("gpt-4o-mini", "openai", settings.OPENAI_API_KEY, None)
    if provider != "gemini" and (_is_valid_key(settings.GEMINI_API_KEY) or _is_valid_key(settings.GOOGLE_API_KEY)):
        add_candidate("gemini-2.0-flash", "gemini", settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY, settings.GEMINI_BASE_URL)

    fallback_msg_llm = MissingApiKeyFallbackLLM()

    if not candidates:
        logger.warning("No valid LLM API keys found in environment. Using MissingApiKeyFallbackLLM.")
        return fallback_msg_llm

    primary = candidates[0]
    fallbacks = candidates[1:] + [fallback_msg_llm]

    return primary.with_fallbacks(fallbacks, exceptions_to_handle=(Exception,))


def get_fast_llm(temperature: float = 0.0) -> Any:
    """
    Returns an ultra-fast, low-latency LLM optimized for auxiliary orchestration
    steps (routing, complexity analysis, structured JSON planning, and reflection).
    Prefers active providers like NVIDIA NIM, Fireworks, Groq, OpenAI, or Gemini.
    """
    has_nvidia = _is_valid_key(settings.NVIDIA_API_KEY)
    has_fireworks = _is_valid_key(getattr(settings, "FIREWORKS_API_KEY", None))
    has_groq = _is_valid_key(settings.GROQ_API_KEY)
    has_openai = _is_valid_key(settings.OPENAI_API_KEY)
    has_gemini = _is_valid_key(settings.GEMINI_API_KEY) or _is_valid_key(settings.GOOGLE_API_KEY)

    candidates = []

    def add_candidate(m_name, p_name, key, base):
        if _is_valid_key(key):
            try:
                candidates.append(ChatOpenAI(
                    model=m_name,
                    api_key=key,
                    base_url=base,
                    temperature=temperature,
                    timeout=60,
                    max_retries=2,
                ))
            except Exception:
                pass

    # 1. NVIDIA NIM (meta/llama-3.3-70b-instruct)
    if has_nvidia:
        add_candidate("meta/llama-3.3-70b-instruct", "nvidia", settings.NVIDIA_API_KEY, settings.NVIDIA_BASE_URL)
    # 2. Fireworks AI Llama 70B
    if has_fireworks:
        add_candidate("accounts/fireworks/models/llama-v3p3-70b-instruct", "fireworks", getattr(settings, "FIREWORKS_API_KEY", None), "https://api.fireworks.ai/inference/v1")
    # 3. Groq instant
    if has_groq:
        add_candidate("llama-3.3-70b-versatile", "groq", settings.GROQ_API_KEY, "https://api.groq.com/openai/v1")
    # 4. OpenAI mini
    if has_openai:
        add_candidate("gpt-4o-mini", "openai", settings.OPENAI_API_KEY, None)
    # 5. Gemini Flash
    if has_gemini:
        add_candidate("gemini-2.0-flash", "gemini", settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY, settings.GEMINI_BASE_URL)

    if not candidates:
        return get_llm(temperature=temperature)

    fallback_msg_llm = MissingApiKeyFallbackLLM()
    primary = candidates[0]
    fallbacks = candidates[1:] + [fallback_msg_llm]
    return primary.with_fallbacks(fallbacks, exceptions_to_handle=(Exception,))


def list_available_models() -> list[dict]:
    """Return all models with metadata, suitable for frontend dropdowns."""
    has_nvidia = _is_valid_key(settings.NVIDIA_API_KEY)
    has_groq = _is_valid_key(settings.GROQ_API_KEY)
    has_openai = _is_valid_key(settings.OPENAI_API_KEY)

    models = []
    for model_id, meta in MODEL_DISPLAY.items():
        if model_id in BROKEN_MODEL_IDS:
            continue
        model_name, default_provider = MODEL_REGISTRY[model_id]

        if has_nvidia:
            provider_display = "NVIDIA NIM"
            actual_model = _nvidia_model_name(model_id)
        elif has_groq:
            provider_display = "Groq"
            actual_model = _groq_model_name(model_id)
        elif has_openai:
            provider_display = "OpenAI"
            actual_model = model_name
        else:
            continue

        models.append({
            "id": model_id,
            "name": meta["name"],
            "provider": provider_display,
            "tier": meta["tier"],
            "model_name": actual_model,
        })
    return models
