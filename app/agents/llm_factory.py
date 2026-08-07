import logging
from typing import Optional, List, Dict, Any
from langchain_openai import ChatOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)


def _is_valid_key(key: Optional[str]) -> bool:
    """Check if an API key is non-empty and not a placeholder."""
    if not key or not isinstance(key, str):
        return False
    k = key.strip()
    if not k or len(k) < 8:
        return False
    placeholders = (
        "sk-...", "gsk_...", "nvapi-...", "your-", "replace-",
        "sk-dummy", "gsk-dummy", "nvapi-dummy", "AIzaSy..."
    )
    if any(k.startswith(p) for p in placeholders) or k in {"sk-...", "gsk_...", "nvapi-...", "AIzaSy..."}:
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


def resolve_model(model_id: Optional[str], role: Optional[str] = None) -> tuple[str, str]:
    """
    Resolve a requested model id to a known model and provider, prioritizing high-reliability providers (Groq -> OpenAI -> NVIDIA -> Gemini).
    """
    has_groq = _is_valid_key(settings.GROQ_API_KEY)
    has_openai = _is_valid_key(settings.OPENAI_API_KEY)
    has_nvidia = _is_valid_key(settings.NVIDIA_API_KEY)
    has_gemini = _is_valid_key(settings.GEMINI_API_KEY) or _is_valid_key(settings.GOOGLE_API_KEY)

    # Allow explicit provider override via LLM_PROVIDER env var
    forced_provider = (getattr(settings, "LLM_PROVIDER", None) or "").strip().lower()
    if forced_provider == "groq" and has_groq:
        return _groq_model_name(model_id or "kimi-k3"), "groq"
    elif forced_provider == "openai" and has_openai:
        return "gpt-4o-mini", "openai"
    elif forced_provider == "nvidia" and has_nvidia:
        return _nvidia_model_name(model_id or "kimi-k3"), "nvidia"
    elif forced_provider == "gemini" and has_gemini:
        return "gemini-2.0-flash", "gemini"

    if not model_id or model_id not in MODEL_REGISTRY or model_id in BROKEN_MODEL_IDS:
        model_id = DEFAULT_MODEL_BY_ROLE.get(role or "default", DEFAULT_MODEL_BY_ROLE["default"])

    model_name, default_provider = MODEL_REGISTRY[model_id]

    # Priority 1: Groq (Primary high-velocity provider)
    if has_groq:
        return _groq_model_name(model_id), "groq"

    # Priority 2: OpenAI
    if has_openai:
        fallback_model = MODEL_REGISTRY["gpt-4o-mini"][0] if "gpt-4o-mini" in MODEL_REGISTRY else "gpt-4o"
        return fallback_model, "openai"

    # Priority 3: NVIDIA NIM
    if has_nvidia:
        return _nvidia_model_name(model_id), "nvidia"

    # Priority 4: Gemini (Fallback if explicitly configured)
    if has_gemini:
        return "gemini-2.0-flash", "gemini"

    # Default fallback if no keys configured
    return model_name, default_provider


def get_llm(model_id: Optional[str] = None, role: Optional[str] = None, temperature: float = 0.0):
    """
    Build a ChatOpenAI instance for the requested model with automatic fallback.
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
            "Please configure GROQ_API_KEY, OPENAI_API_KEY, NVIDIA_API_KEY, or GEMINI_API_KEY in your environment."
        )

    effective_api_key = api_key if _is_valid_key(api_key) else "sk-no-key-configured"

    logger.info(f"Initializing LLM: requested={model_id!r}, role={role!r}, resolved_provider={provider}, resolved_model={model_name}")

    llm = ChatOpenAI(
        model=model_name,
        api_key=effective_api_key,
        base_url=base_url,
        temperature=temperature,
    )

    # Build fallbacks if secondary valid keys exist
    fallbacks = []
    if provider != "groq" and _is_valid_key(settings.GROQ_API_KEY):
        fallbacks.append(ChatOpenAI(
            model=_groq_model_name(model_id or "kimi-k3"),
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
            temperature=temperature
        ))
    if provider != "openai" and _is_valid_key(settings.OPENAI_API_KEY):
        fallbacks.append(ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.OPENAI_API_KEY,
            temperature=temperature
        ))
    if provider != "nvidia" and _is_valid_key(settings.NVIDIA_API_KEY):
        fallbacks.append(ChatOpenAI(
            model=_nvidia_model_name(model_id or "kimi-k3"),
            api_key=settings.NVIDIA_API_KEY,
            base_url=settings.NVIDIA_BASE_URL,
            temperature=temperature
        ))

    if fallbacks:
        return llm.with_fallbacks(fallbacks)
    return llm


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
            if has_groq:
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
