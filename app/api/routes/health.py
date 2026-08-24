from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.mcp_client import MCPClient, get_mcp_client

router = APIRouter()

class HealthCheck(BaseModel):
    status: str = "ok"
    version: str = "v1.2.0-fastpath"

class MCPHealthCheck(BaseModel):
    fallback_mode: bool
    servers: Dict[str, Dict[str, Any]]

@router.get("/health", response_model=HealthCheck, status_code=200)
def health_check() -> HealthCheck:
    """
    Health check endpoint for Docker / orchestration checks.
    """
    return HealthCheck(status="ok", version="v1.2.0-fastpath")


@router.get("/health/mcp", response_model=MCPHealthCheck, status_code=200)
def mcp_health_check() -> MCPHealthCheck:
    """
    Health check for configured MCP (Model Context Protocol) servers.
    """
    from app.core.config import settings

    servers = [
        "stripe", "notion", "slack", "brave", "google",
        "supabase", "browser", "email", "calendar", "context7", "collaboration"
    ]

    result: Dict[str, Dict[str, Any]] = {}
    for name in servers:
        client: Optional[MCPClient] = get_mcp_client(name)
        if client is None:
            result[name] = {
                "configured": False,
                "reachable": False,
                "error": "Server not configured or fallback mode enabled",
            }
        else:
            check = client.check()
            result[name] = {
                "configured": True,
                "reachable": check.get("reachable", False),
                "status": check.get("status"),
                "error": check.get("error"),
            }

    return MCPHealthCheck(
        fallback_mode=settings.MCP_FALLBACK_MODE,
        servers=result,
    )


@router.get("/health/llm")
def llm_health_check():
    """
    Live diagnostic endpoint to test each configured LLM provider (Groq, NVIDIA, Fireworks, Gemini, OpenAI)
    with a real test ping and return exact connectivity, latency, and error responses.
    """
    import time
    from app.core.config import settings
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage

    def _mask_key(k: Optional[str]) -> Optional[str]:
        if not k:
            return None
        cleaned = k.strip().strip('"').strip("'")
        if len(cleaned) <= 8:
            return "***"
        return f"{cleaned[:4]}...{cleaned[-4:]}"

    from app.agents.llm_factory import get_all_openrouter_keys
    or_keys = get_all_openrouter_keys()

    providers = []
    if or_keys:
        for idx, k in enumerate(or_keys):
            p_tag = "openrouter" if idx == 0 else f"openrouter_fallback_{idx}"
            p_display = "OpenRouter (Primary)" if idx == 0 else f"OpenRouter (Fallback #{idx})"
            providers.append({
                "name": p_tag,
                "display_name": f"{p_display} ({getattr(settings, 'OPENROUTER_MODEL', 'dots-studio/dots-3-note-preview:free')})",
                "key": k,
                "base_url": getattr(settings, "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
                "models": [
                    getattr(settings, "OPENROUTER_MODEL", "dots-studio/dots-3-note-preview:free") or "dots-studio/dots-3-note-preview:free",
                    "meta-llama/llama-3.3-70b-instruct:free"
                ],
                "headers": {"HTTP-Referer": "https://thecompany.ai", "X-Title": "The Company OS"}
            })
    else:
        providers.append({
            "name": "openrouter",
            "display_name": "OpenRouter (Primary)",
            "key": getattr(settings, "OPENROUTER_API_KEY", None),
            "base_url": getattr(settings, "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            "models": [
                getattr(settings, "OPENROUTER_MODEL", "dots-studio/dots-3-note-preview:free") or "dots-studio/dots-3-note-preview:free",
                "meta-llama/llama-3.3-70b-instruct:free"
            ],
            "headers": {"HTTP-Referer": "https://thecompany.ai", "X-Title": "The Company OS"}
        })

    providers.extend([
        {
            "name": "groq",
            "display_name": "Groq (Llama 3.3 70B & 3.1 8B)",
            "key": settings.GROQ_API_KEY,
            "base_url": "https://api.groq.com/openai/v1",
            "models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
        },
        {
            "name": "nvidia",
            "display_name": "NVIDIA NIM",
            "key": settings.NVIDIA_API_KEY,
            "base_url": settings.NVIDIA_BASE_URL,
            "models": ["meta/llama-3.3-70b-instruct"],
        },
        {
            "name": "fireworks",
            "display_name": "Fireworks AI",
            "key": getattr(settings, "FIREWORKS_API_KEY", None),
            "base_url": "https://api.fireworks.ai/inference/v1",
            "models": ["accounts/fireworks/models/llama-v3p3-70b-instruct"],
        },
        {
            "name": "gemini",
            "display_name": "Google Gemini",
            "key": settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY,
            "base_url": settings.GEMINI_BASE_URL,
            "models": ["gemini-2.0-flash", "gemini-1.5-flash"],
        },
        {
            "name": "openai",
            "display_name": "OpenAI",
            "key": settings.OPENAI_API_KEY,
            "base_url": None,
            "models": ["gpt-4o-mini"],
        }
    ])

    results = {}
    at_least_one_working = False

    for p in providers:
        raw_key = p["key"]
        masked = _mask_key(raw_key)
        if not raw_key or len(raw_key.strip().strip('"').strip("'")) < 6:
            results[p["name"]] = {
                "configured": False,
                "status": "not_configured",
                "key_preview": None,
                "error": "No API key configured in environment variables"
            }
            continue

        clean_key = raw_key.strip().strip('"').strip("'")
        provider_success = False
        tested_models = []

        for m in p["models"]:
            t0 = time.time()
            kwargs = {
                "model": m,
                "api_key": clean_key,
                "base_url": p["base_url"],
                "timeout": 10,
                "max_retries": 0
            }
            if p.get("headers"):
                kwargs["default_headers"] = p["headers"]
            try:
                chat = ChatOpenAI(**kwargs)
                resp = chat.invoke([HumanMessage(content="Ping. Reply with OK.")])
                latency = round((time.time() - t0) * 1000, 1)
                tested_models.append({
                    "model": m,
                    "status": "ok",
                    "latency_ms": latency,
                    "reply": (resp.content or "").strip()[:50]
                })
                provider_success = True
                at_least_one_working = True
                break
            except Exception as e:
                latency = round((time.time() - t0) * 1000, 1)
                tested_models.append({
                    "model": m,
                    "status": "failed",
                    "latency_ms": latency,
                    "error": str(e)
                })

        results[p["name"]] = {
            "configured": True,
            "status": "ok" if provider_success else "error",
            "key_preview": masked,
            "active_model": tested_models[0]["model"] if provider_success else None,
            "tested_models": tested_models,
            "error": None if provider_success else (tested_models[-1].get("error") if tested_models else "Unknown error")
        }

    return {
        "status": "healthy" if at_least_one_working else "unhealthy",
        "active_provider_count": sum(1 for r in results.values() if r.get("status") == "ok"),
        "providers": results,
        "forced_provider": getattr(settings, "LLM_PROVIDER", None),
        "guidance": "If all providers fail, check the 'error' field for each provider to see if it is a 401 Unauthorized (invalid key) or 429 (rate limit / quota)."
    }

