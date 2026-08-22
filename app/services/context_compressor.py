import logging
from typing import Optional, Any
import tiktoken

from app.core.config import settings

logger = logging.getLogger(__name__)


def is_nvidia_provider_active() -> bool:
    """
    Checks if the active resolved LLM provider is NVIDIA NIM.
    Reusable across tools, routers, and compressors.
    """
    try:
        from app.agents.llm_factory import resolve_model
        _, provider = resolve_model(None, role="default")
        return provider == "nvidia"
    except Exception as e:
        logger.debug(f"Error checking active provider: {e}")
        return False


def count_tokens(text: str) -> int:
    """
    Count tokens in a string using tiktoken (cl100k_base).
    """
    if not text:
        return 0
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text))
    except Exception:
        return max(1, len(text) // 4)


class ContextCompressor:
    """
    Singleton wrapper for LLMLingua-2 prompt/output compression.
    Lazy-loads the PromptCompressor model upon first invocation so application
    startup is never slowed down.
    """
    _instance: Optional["ContextCompressor"] = None
    _compressor: Optional[Any] = None
    _load_attempted: bool = False

    def __new__(cls) -> "ContextCompressor":
        if cls._instance is None:
            cls._instance = super(ContextCompressor, cls).__new__(cls)
        return cls._instance

    def _get_compressor(self) -> Optional[Any]:
        if not self._load_attempted:
            self._load_attempted = True
            try:
                from llmlingua import PromptCompressor
                # LLMLingua-2 meetingbank model for fast token-level semantic compression
                self._compressor = PromptCompressor(
                    model_name="microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank",
                    use_llmlingua2=True,
                    device_map="cpu"
                )
                logger.info("LLMLingua-2 PromptCompressor model loaded successfully on CPU.")
            except Exception as e:
                logger.warning(f"Could not load LLMLingua-2 PromptCompressor: {e}. Falling back to token truncation.")
                self._compressor = None
        return self._compressor

    def compress(
        self,
        text: str,
        target_tokens: int = 500,
        rate: Optional[float] = None
    ) -> str:
        """
        Compress text using LLMLingua-2 to fit under target_tokens.
        """
        if not text or not text.strip():
            return text

        orig_tokens = count_tokens(text)
        if orig_tokens <= target_tokens:
            return text

        compressor = self._get_compressor()
        if compressor is not None:
            try:
                computed_rate = rate if rate is not None else max(0.2, min(0.9, target_tokens / max(1, orig_tokens)))
                res = compressor.compress_prompt(
                    [text],
                    rate=computed_rate,
                    target_token=target_tokens if rate is None else -1,
                )
                compressed = res.get("compressed_prompt", text)
                comp_tokens = count_tokens(compressed)
                logger.info(
                    f"[LLMLingua-2] Compressed tool output from {orig_tokens} -> {comp_tokens} tokens "
                    f"(ratio: {comp_tokens/max(1, orig_tokens):.1%})"
                )
                return compressed
            except Exception as e:
                logger.warning(f"LLMLingua compression failed: {e}. Returning original text.")
                return text

        # Deterministic token truncation fallback
        try:
            encoding = tiktoken.get_encoding("cl100k_base")
            tokens = encoding.encode(text)
            if len(tokens) > target_tokens:
                truncated = encoding.decode(tokens[:target_tokens]) + "\n... [Context truncated for NIM context window]"
                return truncated
        except Exception:
            pass

        return text


# Global singleton instance
context_compressor = ContextCompressor()


def compress_tool_output(text: str, target_tokens: int = 500) -> str:
    """
    Compress long tool or MCP output via LLMLingua-2.
    """
    return context_compressor.compress(text, target_tokens=target_tokens)
