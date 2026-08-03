from typing import Optional
from langchain_openai import ChatOpenAI
from app.core.config import settings


# Model registry: public display id -> (provider_model_id, provider)
MODEL_REGISTRY = {
    "kimi-k3": ("accounts/fireworks/models/kimi-k3", "fireworks"),
    "gpt-4o": ("gpt-4o", "openai"),
    "gpt-4o-mini": ("gpt-4o-mini", "openai"),
    "llama-3.1-70b": ("accounts/fireworks/models/llama-v3p1-70b-instruct", "fireworks"),
    "llama-3.1-8b": ("accounts/fireworks/models/llama-v3p1-8b-instruct", "fireworks"),
}

# Model display metadata for the frontend and agent defaults.
MODEL_DISPLAY = {
    "kimi-k3": {"name": "Kimi K3", "provider": "Fireworks", "tier": "power"},
    "gpt-4o": {"name": "GPT-4o", "provider": "OpenAI", "tier": "standard"},
    "gpt-4o-mini": {"name": "GPT-4o Mini", "provider": "OpenAI", "tier": "fast"},
    "llama-3.1-70b": {"name": "Llama 3.1 70B", "provider": "Fireworks", "tier": "standard"},
    "llama-3.1-8b": {"name": "Llama 3.1 8B", "provider": "Fireworks", "tier": "fast"},
}

# Recommended defaults by role (worker specialization).
DEFAULT_MODEL_BY_ROLE = {
    "Finance Manager": "gpt-4o",
    "Marketing Manager": "gpt-4o-mini",
    "Admin & Operations Worker": "gpt-4o-mini",
    "Research Specialist": "gpt-4o-mini",
    "EngineeringWorker": "gpt-4o-mini",
    "Coder": "gpt-4o-mini",
    "Engineering Manager": "gpt-4o-mini",
    "Software Engineer": "gpt-4o-mini",
    "default": "gpt-4o-mini",
}


def resolve_model(model_id: Optional[str], role: Optional[str] = None) -> tuple[str, str]:
    """Resolve a requested model id to a known model, falling back to role defaults."""
    if not model_id or model_id not in MODEL_REGISTRY:
        model_id = DEFAULT_MODEL_BY_ROLE.get(role or "default", DEFAULT_MODEL_BY_ROLE["default"])

    model_name, provider = MODEL_REGISTRY[model_id]

    # If the requested model provider is not available, pick a sensible fallback
    # from the configured provider.
    has_fireworks = bool(settings.FIREWORKS_API_KEY)
    has_openai = bool(settings.OPENAI_API_KEY)

    if provider == "fireworks" and not has_fireworks:
        provider = "openai"
        model_name = MODEL_REGISTRY["gpt-4o-mini"][0] if has_openai else MODEL_REGISTRY["gpt-4o"][0]
    elif provider == "openai" and not has_openai:
        provider = "fireworks"
        model_name = MODEL_REGISTRY["llama-3.1-70b"][0] if has_fireworks else MODEL_REGISTRY["kimi-k3"][0]

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

    return ChatOpenAI(
        model=model_name,
        api_key=api_key,
        base_url=base_url,
        temperature=temperature,
    )


def list_available_models() -> list[dict]:
    """Return all models with metadata, suitable for frontend dropdowns."""
    return [
        {
            "id": model_id,
            "name": meta["name"],
            "provider": meta["provider"],
            "tier": meta["tier"],
        }
        for model_id, meta in MODEL_DISPLAY.items()
    ]
