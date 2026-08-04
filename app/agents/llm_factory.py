import logging
from typing import Optional
from langchain_openai import ChatOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)


# Model registry: public display id -> (provider_model_id, provider)
MODEL_REGISTRY = {
    "kimi-k3": ("accounts/fireworks/models/kimi-k3", "fireworks"),
    "gpt-4o": ("gpt-4o", "openai"),
    "gpt-4o-mini": ("gpt-4o-mini", "openai"),
    "llama-3.1-70b": ("accounts/fireworks/models/llama-v3p1-70b-instruct", "fireworks"),
    "llama-v3-8b": ("accounts/fireworks/models/llama-v3-8b-instruct", "fireworks"),
    "qwen2.5-72b": ("accounts/fireworks/models/qwen2p5-72b-instruct", "fireworks"),
    "deepseek-r1": ("accounts/fireworks/models/deepseek-r1", "fireworks"),
    "mistral-small-24b": ("accounts/fireworks/models/mistral-small-24b-instruct-2502", "fireworks"),
}

# Default model used when the user does not specify one for a new agent.
DEFAULT_AGENT_MODEL_ID = "kimi-k3"

# Model IDs that are known to be broken or unavailable on the provider.
# They are silently remapped to the default so old agents don't crash the system.
BROKEN_MODEL_IDS = {"llama-3.1-8b"}

# Model display metadata for the frontend and agent defaults.
MODEL_DISPLAY = {
    "kimi-k3": {"name": "Kimi K3", "provider": "Fireworks", "tier": "power"},
    "gpt-4o": {"name": "GPT-4o", "provider": "OpenAI", "tier": "standard"},
    "gpt-4o-mini": {"name": "GPT-4o Mini", "provider": "OpenAI", "tier": "fast"},
    "llama-3.1-70b": {"name": "Llama 3.1 70B", "provider": "Fireworks", "tier": "standard"},
    "llama-v3-8b": {"name": "Llama 3 8B", "provider": "Fireworks", "tier": "fast"},
    "qwen2.5-72b": {"name": "Qwen 2.5 72B", "provider": "Fireworks", "tier": "standard"},
    "deepseek-r1": {"name": "DeepSeek R1", "provider": "Fireworks", "tier": "power"},
    "mistral-small-24b": {"name": "Mistral Small 24B", "provider": "Fireworks", "tier": "fast"},
}

# Recommended defaults by role (worker specialization).
# Kimi K3 is the system-wide default; override per role only when a cheaper or
# more specialized model is genuinely needed.
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


def _fireworks_model_name(model_id: str) -> str:
    """Return the Fireworks provider model ID, supporting a custom override env var."""
    custom = getattr(settings, "FIREWORKS_CUSTOM_MODEL", None)
    if custom:
        return custom
    return MODEL_REGISTRY[model_id][0]


def resolve_model(model_id: Optional[str], role: Optional[str] = None) -> tuple[str, str]:
    """Resolve a requested model id to a known model, falling back to role defaults.

    Broken/deprecated model IDs (e.g. old Fireworks IDs that return 404) are
    remapped to the default so existing agents don't crash after a model is retired.
    """
    has_fireworks = bool(settings.FIREWORKS_API_KEY)
    has_openai = bool(settings.OPENAI_API_KEY)

    if not model_id or model_id not in MODEL_REGISTRY or model_id in BROKEN_MODEL_IDS:
        model_id = DEFAULT_MODEL_BY_ROLE.get(role or "default", DEFAULT_MODEL_BY_ROLE["default"])

    model_name, provider = MODEL_REGISTRY[model_id]

    # If Fireworks is configured, prefer its cheap model ID for any Fireworks model.
    if provider == "fireworks":
        model_name = _fireworks_model_name(model_id)

    # If the requested model provider is not available, pick a sensible fallback
    # from the configured provider.
    if provider == "fireworks" and not has_fireworks:
        provider = "openai"
        model_name = MODEL_REGISTRY["gpt-4o-mini"][0] if has_openai else MODEL_REGISTRY["gpt-4o"][0]
    elif provider == "openai" and not has_openai:
        provider = "fireworks"
        model_name = MODEL_REGISTRY["llama-v3-8b"][0]

    return model_name, provider


def get_llm(model_id: Optional[str] = None, role: Optional[str] = None, temperature: float = 0.0):
    """
    Build a ChatOpenAI instance for the requested model, using the appropriate
    API key and base URL.
    """
    model_name, provider = resolve_model(model_id, role)

    if provider == "fireworks":
        api_key = settings.FIREWORKS_API_KEY
        base_url = "https://api.fireworks.ai/inference/v1"
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
    has_fireworks = bool(settings.FIREWORKS_API_KEY)
    has_openai = bool(settings.OPENAI_API_KEY)

    models = []
    for model_id, meta in MODEL_DISPLAY.items():
        if model_id in BROKEN_MODEL_IDS:
            continue
        model_name, provider = MODEL_REGISTRY[model_id]
        # Hide models whose provider is not configured.
        if provider == "fireworks" and not has_fireworks:
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
