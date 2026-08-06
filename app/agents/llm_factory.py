import logging
from typing import Optional
from langchain_openai import ChatOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)


def _is_valid_key(key: Optional[str]) -> bool:
    """Check if an API key is non-empty and not a placeholder."""
    if not key or not isinstance(key, str):
        return False
    k = key.strip()
    if not k:
        return False
    placeholders = (
        "sk-...", "gsk_...", "nvapi-...", "your-", "replace-",
        "sk-dummy", "gsk-dummy", "nvapi-dummy"
    )
    if any(k.startswith(p) for p in placeholders) or k in {"sk-...", "gsk_...", "nvapi-..."}:
        return False
    return True


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

# NVIDIA NIM model mappings for open-weights models
NVIDIA_MODEL_MAP = {
    "kimi-k3": "meta/llama-3.3-70b-instruct",
    "llama-3.1-70b": "meta/llama-3.3-70b-instruct",
    "llama-v3-8b": "meta/llama-3.1-8b-instruct",
    "qwen2.5-72b": "qwen/qwen2.5-72b-instruct",
    "deepseek-r1": "deepseek-ai/deepseek-r1",
    "mistral-small-24b": "mistralai/mixtral-8x7b-instruct-v0.1",
}

# Default model used when the user does not specify one for a new agent.
DEFAULT_AGENT_MODEL_ID = "kimi-k3"

# Model IDs that are known to be broken or unavailable on the provider.
# They are silently remapped to the default so old agents don't crash the system.
BROKEN_MODEL_IDS = {"llama-3.1-8b"}

# Model display metadata for the frontend and agent defaults.
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

# Recommended defaults by role (worker specialization).
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
    """Return the Groq provider model ID, supporting a custom override env var."""
    custom = getattr(settings, "GROQ_CUSTOM_MODEL", None)
    if custom:
        return custom
    return MODEL_REGISTRY.get(model_id, ("llama-3.3-70b-versatile", "groq"))[0]


def _nvidia_model_name(model_id: str) -> str:
    """Return the NVIDIA NIM provider model ID, supporting a custom override env var."""
    custom = getattr(settings, "NVIDIA_CUSTOM_MODEL", None)
    if custom:
        return custom
    return NVIDIA_MODEL_MAP.get(model_id, "meta/llama-3.3-70b-instruct")


def resolve_model(model_id: Optional[str], role: Optional[str] = None) -> tuple[str, str]:
    """Resolve a requested model id to a known model and provider, falling back based on configured keys.

    Supported providers in order of preference:
    NVIDIA NIM -> Groq -> Gemini/Google -> OpenAI (fallback).
    """
    has_nvidia = _is_valid_key(settings.NVIDIA_API_KEY)
    has_groq = _is_valid_key(settings.GROQ_API_KEY)
    has_gemini = _is_valid_key(settings.GEMINI_API_KEY) or _is_valid_key(settings.GOOGLE_API_KEY)
    has_openai = _is_valid_key(settings.OPENAI_API_KEY)

    if not model_id or model_id not in MODEL_REGISTRY or model_id in BROKEN_MODEL_IDS:
        model_id = DEFAULT_MODEL_BY_ROLE.get(role or "default", DEFAULT_MODEL_BY_ROLE["default"])

    model_name, default_provider = MODEL_REGISTRY[model_id]

    # Handle OpenAI-native models (e.g. gpt-4o, gpt-4o-mini)
    if default_provider == "openai":
        if has_openai:
            return model_name, "openai"
        if has_gemini:
            return "gemini-2.0-flash", "gemini"
        if has_nvidia:
            return _nvidia_model_name(model_id), "nvidia"
        if has_groq:
            return _groq_model_name(model_id), "groq"
        return model_name, "openai"

    # Handle open-weights models (kimi-k3, llama, qwen, deepseek, mistral)
    if has_nvidia and not has_groq:
        return _nvidia_model_name(model_id), "nvidia"
    elif has_groq:
        return _groq_model_name(model_id), "groq"
    elif has_gemini:
        return "gemini-2.0-flash", "gemini"
    elif has_nvidia:
        return _nvidia_model_name(model_id), "nvidia"
    elif has_openai:
        fallback_model = MODEL_REGISTRY["gpt-4o-mini"][0] if "gpt-4o-mini" in MODEL_REGISTRY else "gpt-4o"
        return fallback_model, "openai"

    # Default fallback when no keys are configured yet
    return model_name, default_provider


def get_llm(model_id: Optional[str] = None, role: Optional[str] = None, temperature: float = 0.0):
    """
    Build a ChatOpenAI instance for the requested model, using the appropriate
    API key and base URL (NVIDIA NIM, Groq, Gemini, or OpenAI).
    """
    model_name, provider = resolve_model(model_id, role)

    if provider == "nvidia":
        api_key = settings.NVIDIA_API_KEY
        base_url = settings.NVIDIA_BASE_URL
    elif provider == "groq":
        api_key = settings.GROQ_API_KEY
        base_url = "https://api.groq.com/openai/v1"
    elif provider == "gemini":
        api_key = settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY
        base_url = settings.GEMINI_BASE_URL
    else:
        api_key = settings.OPENAI_API_KEY
        base_url = None

    if not _is_valid_key(api_key):
        logger.warning(
            f"No valid API key configured for provider '{provider}'. "
            "Please configure NVIDIA_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in your .env file."
        )

    logger.info(f"Initializing LLM: requested={model_id!r}, role={role!r}, resolved_provider={provider}, resolved_model={model_name}")

    return ChatOpenAI(
        model=model_name,
        api_key=api_key,
        base_url=base_url,
        temperature=temperature,
    )


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

        if default_provider == "openai":
            if not has_openai:
                continue
            provider_display = "OpenAI"
            actual_model = model_name
        else:
            if has_nvidia and not has_groq:
                provider_display = "NVIDIA NIM"
                actual_model = _nvidia_model_name(model_id)
            elif has_groq:
                provider_display = "Groq"
                actual_model = _groq_model_name(model_id)
            elif has_nvidia:
                provider_display = "NVIDIA NIM"
                actual_model = _nvidia_model_name(model_id)
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
