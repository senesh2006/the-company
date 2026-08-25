import os
from unittest.mock import patch
import pytest

from app.agents.llm_factory import (
    resolve_model,
    get_llm,
    list_available_models,
    MODEL_REGISTRY,
    NVIDIA_MODEL_MAP,
)

@pytest.fixture(autouse=True)
def clean_llm_env():
    """Ensure tests run with predictable environment settings."""
    with patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", None), \
         patch("app.agents.llm_factory.settings.GEMINI_API_KEY", None), \
         patch("app.agents.llm_factory.settings.GOOGLE_API_KEY", None):
        yield


def test_resolve_model_defaults_to_kimi_k3():
    """When no model is requested and Groq is configured, default to Llama 3.3 70B."""
    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", None):
        with patch("app.agents.llm_factory.settings.GROQ_API_KEY", "gsk-testkey"):
            with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
                model_name, provider = resolve_model(None, role="default")
                assert provider == "groq"
                assert model_name == MODEL_REGISTRY["kimi-k3"][0]


def test_resolve_model_unknown_id_falls_back_to_role_default():
    """Unknown model ids should resolve to the role default."""
    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", None):
        with patch("app.agents.llm_factory.settings.GROQ_API_KEY", "gsk-testkey"):
            with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
                model_name, provider = resolve_model("nonexistent-model", role="Finance Manager")
                assert provider == "groq"


def test_resolve_model_nvidia_when_nvidia_key_is_set():
    """When NVIDIA_API_KEY is configured and Groq is not, resolve to NVIDIA NIM."""
    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", "nvapi-testkey"):
        with patch("app.agents.llm_factory.settings.GROQ_API_KEY", None):
            with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
                model_name, provider = resolve_model("kimi-k3", role="default")
                assert provider == "nvidia"
                assert model_name == "meta/llama-3.3-70b-instruct"


def test_resolve_model_nvidia_custom_override():
    """NVIDIA_CUSTOM_MODEL should override any NVIDIA NIM model name."""
    custom_model = "meta/llama-3.1-405b-instruct"
    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", "nvapi-testkey"):
        with patch("app.agents.llm_factory.settings.NVIDIA_CUSTOM_MODEL", custom_model):
            with patch("app.agents.llm_factory.settings.GROQ_API_KEY", None):
                with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
                    model_name, provider = resolve_model("kimi-k3", role="default")
                    assert provider == "nvidia"
                    assert model_name == custom_model


def test_resolve_model_openai_fallback_when_groq_and_nvidia_unavailable():
    """If Groq, NVIDIA, and Fireworks are not configured but OpenAI is, fall back to OpenAI."""
    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", None):
        with patch("app.agents.llm_factory.settings.GROQ_API_KEY", None):
            with patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", None):
                with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", "sk-testkey"):
                    model_name, provider = resolve_model("llama-v3-8b", role="default")
                    assert provider == "openai"
                    assert model_name == MODEL_REGISTRY["gpt-4o-mini"][0]


def test_resolve_model_custom_groq_override():
    """GROQ_CUSTOM_MODEL should override any Groq model name."""
    custom_model = "llama-3.1-8b-instant"
    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", None):
        with patch("app.agents.llm_factory.settings.GROQ_API_KEY", "gsk-testkey"):
            with patch("app.agents.llm_factory.settings.GROQ_CUSTOM_MODEL", custom_model):
                model_name, _ = resolve_model("llama-v3-8b", role="default")
                assert model_name == custom_model


def test_list_available_models_respects_configured_keys():
    """Only models from configured providers should be listed."""
    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", None):
        with patch("app.agents.llm_factory.settings.GROQ_API_KEY", "gsk-testkey"):
            with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
                models = list_available_models()
                assert all(m["provider"] == "Groq" for m in models)
                assert any(m["id"] == "kimi-k3" for m in models)


def test_list_available_models_with_nvidia():
    """When NVIDIA_API_KEY is configured, models should show NVIDIA NIM provider."""
    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", "nvapi-testkey"):
        with patch("app.agents.llm_factory.settings.GROQ_API_KEY", None):
            with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
                models = list_available_models()
                assert all(m["provider"] == "NVIDIA NIM" for m in models)
                kimi = next(m for m in models if m["id"] == "kimi-k3")
                assert kimi["model_name"] == "meta/llama-3.3-70b-instruct"


def test_get_llm_returns_chat_openai_instance():
    """get_llm should return a usable ChatOpenAI instance with NVIDIA NIM base_url."""
    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", "nvapi-testkey"):
        with patch("app.agents.llm_factory.settings.GROQ_API_KEY", None):
            with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
                llm = get_llm(model_id="kimi-k3", role="default", temperature=0.0)
                assert llm.model_name == "meta/llama-3.3-70b-instruct"
                assert "integrate.api.nvidia.com" in str(llm.openai_api_base or getattr(llm, "base_url", ""))


def test_resolve_model_kimi_k3_resolves_directly():
    """Default kimi-k3 alias should resolve to the Groq Llama 3.3 model when Groq is configured."""
    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", None):
        with patch("app.agents.llm_factory.settings.GROQ_API_KEY", "gsk-testkey"):
            with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
                model_name, provider = resolve_model("kimi-k3", role="default")
                assert provider == "groq"
                assert model_name == "llama-3.3-70b-versatile"


def test_resolve_model_retired_llama31_8b_remaps_to_default():
    """The retired llama-3.1-8b alias should be remapped to the default working model."""
    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", None):
        with patch("app.agents.llm_factory.settings.GROQ_API_KEY", "gsk-testkey"):
            with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
                model_name, provider = resolve_model("llama-3.1-8b", role="default")
                assert provider == "groq"
                assert model_name == MODEL_REGISTRY["kimi-k3"][0]


def test_list_available_models_hides_broken_models():
    """Broken model IDs should not appear in the frontend model list."""
    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", None):
        with patch("app.agents.llm_factory.settings.GROQ_API_KEY", "gsk-testkey"):
            with patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
                models = list_available_models()
                assert all(m["id"] != "llama-3.1-8b" for m in models)
                assert any(m["id"] == "kimi-k3" for m in models)


def test_resolve_model_openrouter_priority():
    """OpenRouter should be priority 1 and resolve to dots-studio/dots-3-note-preview:free."""
    with patch("app.agents.llm_factory.settings.OPENROUTER_API_KEY", "sk-or-v1-testkey1234567890"), \
         patch("app.agents.llm_factory.settings.OPENROUTER_FALLBACK_API_KEY", None), \
         patch("app.agents.llm_factory.settings.GROQ_API_KEY", "gsk-testkey"), \
         patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", "nvapi-testkey"):
        model_name, provider = resolve_model("dots-3-note", role="default")
        assert provider == "openrouter"
        assert model_name == "dots-studio/dots-3-note-preview:free"


def test_get_all_openrouter_keys_multiple():
    """get_all_openrouter_keys should collect distinct primary and fallback keys."""
    from app.agents.llm_factory import get_all_openrouter_keys
    with patch("app.agents.llm_factory.settings.OPENROUTER_API_KEY", "sk-or-primary1, sk-or-primary2"), \
         patch("app.agents.llm_factory.settings.OPENROUTER_FALLBACK_API_KEY", "sk-or-fallback1"), \
         patch("app.agents.llm_factory.settings.OPENROUTER_API_KEY_3", "sk-or-fallback3"), \
         patch("app.agents.llm_factory.settings.OPENROUTER_FALLBACK_API_KEY_2", "sk-or-fallback4"):
        keys = get_all_openrouter_keys()
        assert "sk-or-primary1" in keys
        assert "sk-or-primary2" in keys
        assert "sk-or-fallback1" in keys
        assert "sk-or-fallback3" in keys
        assert "sk-or-fallback4" in keys
        assert len(keys) == 5


def test_get_llm_with_multiple_openrouter_keys():
    """get_llm should instantiate and include fallback candidate models for all keys."""
    with patch("app.agents.llm_factory.settings.OPENROUTER_API_KEY", "sk-or-primary1"), \
         patch("app.agents.llm_factory.settings.OPENROUTER_FALLBACK_API_KEY", "sk-or-fallback2"):
        llm = get_llm(role="default")
        # Should be a runnable with fallbacks or ChatOpenAI
        assert llm is not None


