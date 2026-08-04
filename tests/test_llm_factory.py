import os
from unittest.mock import patch

from app.agents.llm_factory import (
    resolve_model,
    get_llm,
    list_available_models,
    MODEL_REGISTRY,
)


def test_resolve_model_defaults_to_cheap_fireworks_model():
    """When no model is requested and Fireworks is configured, default to the cheapest model."""
    with patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", "fw-key"):
        with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
            model_name, provider = resolve_model(None, role="default")
            assert provider == "fireworks"
            assert "llama" in model_name.lower()


def test_resolve_model_unknown_id_falls_back_to_role_default():
    """Unknown model ids should resolve to the role default."""
    with patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", "fw-key"):
        with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
            model_name, provider = resolve_model("nonexistent-model", role="Finance Manager")
            assert provider == "fireworks"


def test_resolve_model_openai_fallback_when_fireworks_unavailable():
    """If Fireworks is not configured but OpenAI is, fall back to OpenAI."""
    with patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", None):
        with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", "sk-key"):
            model_name, provider = resolve_model("llama-v3-8b", role="default")
            assert provider == "openai"
            assert model_name == MODEL_REGISTRY["gpt-4o-mini"][0]


def test_resolve_model_custom_fireworks_override():
    """FIREWORKS_CUSTOM_MODEL should override any Fireworks model name."""
    custom_model = "accounts/fireworks/models/custom-override"
    with patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", "fw-key"):
        with patch("app.agents.llm_factory.settings.FIREWORKS_CUSTOM_MODEL", custom_model):
            model_name, _ = resolve_model("llama-v3-8b", role="default")
            assert model_name == custom_model


def test_list_available_models_respects_configured_keys():
    """Only models from configured providers should be listed."""
    with patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", "fw-key"):
        with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
            models = list_available_models()
            assert all(m["provider"] == "Fireworks" for m in models)
            assert any(m["id"] == "llama-v3-8b" for m in models)


def test_get_llm_returns_chat_openai_instance():
    """get_llm should return a usable ChatOpenAI-like instance."""
    with patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", "fw-key"):
        with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
            llm = get_llm(model_id="llama-v3-8b", role="default", temperature=0.0)
            assert llm.model_name is not None or llm.model is not None


def test_resolve_model_broken_id_remaps_to_default():
    """Broken model IDs should be remapped to the default working model."""
    with patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", "fw-key"):
        with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
            model_name, provider = resolve_model("kimi-k3", role="default")
            assert provider == "fireworks"
            assert "llama" in model_name.lower()
            assert "kimi" not in model_name.lower()


def test_resolve_model_retired_llama31_8b_remaps_to_default():
    """The retired llama-3.1-8b alias should be remapped to the default working model."""
    with patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", "fw-key"):
        with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
            model_name, provider = resolve_model("llama-3.1-8b", role="default")
            assert provider == "fireworks"
            assert "llama-v3-8b-instruct" in model_name


def test_list_available_models_hides_broken_models():
    """Broken model IDs should not appear in the frontend model list."""
    with patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", "fw-key"):
        with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
            models = list_available_models()
            assert all(m["id"] not in {"kimi-k3", "llama-3.1-8b"} for m in models)
