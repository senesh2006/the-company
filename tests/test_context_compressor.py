import pytest
from unittest.mock import patch, MagicMock

from app.services.context_compressor import (
    compress_tool_output,
    count_tokens,
    is_nvidia_provider_active,
    ContextCompressor,
)
from app.services.mcp_client import maybe_compress_tool_output
from app.core.config import settings


def test_count_tokens_accurate():
    text = "Hello world! This is a simple test sentence for tiktoken."
    tokens = count_tokens(text)
    assert tokens > 0
    assert count_tokens("") == 0


def test_is_nvidia_provider_active_gating():
    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", "nvapi-testkey"), \
         patch("app.agents.llm_factory.settings.GROQ_API_KEY", None), \
         patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", None), \
         patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
        assert is_nvidia_provider_active() is True

    with patch("app.agents.llm_factory.settings.NVIDIA_API_KEY", None), \
         patch("app.agents.llm_factory.settings.GROQ_API_KEY", "gsk-testkey"), \
         patch("app.agents.llm_factory.settings.FIREWORKS_API_KEY", None), \
         patch("app.agents.llm_factory.settings.OPENAI_API_KEY", None):
        assert is_nvidia_provider_active() is False


def test_compress_tool_output_short_text_unchanged():
    short_text = "Status: Healthy. Database latency is 2ms."
    res = compress_tool_output(short_text, target_tokens=500)
    assert res == short_text


def test_compress_tool_output_reduces_large_text_mocked():
    large_block = ("Row item entry log timestamp 2026-08-22 server transaction detail event record. " * 80)
    orig_count = count_tokens(large_block)
    assert orig_count > 600

    mock_compressor = MagicMock()
    mock_compressor.compress_prompt.return_value = {
        "compressed_prompt": "Row item entry log timestamp server transaction detail event record."
    }

    with patch.object(ContextCompressor, "_get_compressor", return_value=mock_compressor):
        compressed = compress_tool_output(large_block, target_tokens=200)
        comp_count = count_tokens(compressed)
        assert comp_count < orig_count
        mock_compressor.compress_prompt.assert_called_once()


def test_maybe_compress_tool_output_bypasses_mock_fallback_mode():
    large_mock = "Mock email data invoice " * 200
    with patch("app.services.mcp_client.settings.MCP_FALLBACK_MODE", True):
        with patch("app.services.mcp_client.is_nvidia_provider_active", return_value=True):
            res = maybe_compress_tool_output(large_mock, tool_name="test_tool")
            assert res == large_mock


def test_maybe_compress_tool_output_bypasses_non_nvidia_providers():
    large_text = "Real tool response data log row " * 200
    with patch("app.services.mcp_client.settings.MCP_FALLBACK_MODE", False):
        with patch("app.services.mcp_client.is_nvidia_provider_active", return_value=False):
            res = maybe_compress_tool_output(large_text, tool_name="test_tool")
            assert res == large_text


def test_maybe_compress_tool_output_executes_on_nvidia():
    large_text = "Audit log ledger transaction entry balance verified amount $500. " * 150
    mock_compressor = MagicMock()
    mock_compressor.compress_prompt.return_value = {
        "compressed_prompt": "Audit log ledger transaction entry balance verified $500."
    }

    with patch.object(ContextCompressor, "_get_compressor", return_value=mock_compressor):
        with patch("app.services.mcp_client.settings.MCP_FALLBACK_MODE", False):
            with patch("app.services.mcp_client.is_nvidia_provider_active", return_value=True):
                with patch("app.services.mcp_client.settings.MCP_COMPRESS_THRESHOLD_TOKENS", 100):
                    res = maybe_compress_tool_output(large_text, tool_name="test_tool")
                    assert count_tokens(res) < count_tokens(large_text)
