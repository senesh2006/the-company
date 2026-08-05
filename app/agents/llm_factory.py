import logging
from typing import Optional
from langchain_openai import ChatOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)


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
    return MODEL_REGISTRY[model_id][0]


def resolve_model(model_id: Optional[str], role: Optional[str] = None) -> tuple[str, str]:
    """Resolve a requested model id to a known model, falling back to role defaults.

    Broken/deprecated model IDs are remapped to the default so existing agents
    don't crash after a model is retired.
    """
    has_groq = bool(settings.GROQ_API_KEY)
    has_openai = bool(settings.OPENAI_API_KEY)

    if not model_id or model_id not in MODEL_REGISTRY or model_id in BROKEN_MODEL_IDS:
        model_id = DEFAULT_MODEL_BY_ROLE.get(role or "default", DEFAULT_MODEL_BY_ROLE["default"])

    model_name, provider = MODEL_REGISTRY[model_id]

    if provider == "groq":
        model_name = _groq_model_name(model_id)

    if provider == "groq" and not has_groq:
        provider = "openai"
        model_name = MODEL_REGISTRY["gpt-4o-mini"][0] if has_openai else MODEL_REGISTRY["gpt-4o"][0]
    elif provider == "openai" and not has_openai:
        provider = "groq"
        model_name = MODEL_REGISTRY["llama-v3-8b"][0]

    return model_name, provider


def get_llm(model_id: Optional[str] = None, role: Optional[str] = None, temperature: float = 0.0):
    """
    Build a ChatOpenAI instance for the requested model, using the appropriate
    API key and base URL.
    """
    model_name, provider = resolve_model(model_id, role)

    if provider == "groq":
        api_key = settings.GROQ_API_KEY
        base_url = "https://api.groq.com/openai/v1"
    else:
        api_key = settings.OPENAI_API_KEY
        base_url = None

    logger.info(f"Initializing LLM: requested={model_id!r}, role={role!r}, resolved_provider={provider}, resolved_model={model_name}")

    return ChatOpenAI(
        model=model_name,
        api_key=api_key,
        base_url=base_url,
        temperature=temperature,
    )


def list_available_models() -> list[dict]:
    """Return all models with metadata, suitable for frontend dropdowns."""
    has_groq = bool(settings.GROQ_API_KEY)
    has_openai = bool(settings.OPENAI_API_KEY)

    models = []
    for model_id, meta in MODEL_DISPLAY.items():
        if model_id in BROKEN_MODEL_IDS:
            continue
        model_name, provider = MODEL_REGISTRY[model_id]
        if provider == "groq" and not has_groq:
            continue
        if provider == "openai" and not has_openai:
            continue
        models.append({
            "id": model_id,
            "name": meta["name"],
            "provider": meta["provider"],
            "tier": meta["tier"],
            "model_name": model_name,
        })
    return models
