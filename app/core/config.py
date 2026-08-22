import os
from typing import Optional, Any
from pydantic import PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "The Company"
    API_V1_STR: str = "/api/v1"
    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    NVIDIA_API_KEY: Optional[str] = None
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    FIREWORKS_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    LLM_PROVIDER: Optional[str] = None

    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    SUPABASE_JWT_SECRET: Optional[str] = None

    # Postgres (Optional if using Supabase client)
    POSTGRES_SERVER: Optional[str] = None
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_DB: Optional[str] = None
    POSTGRES_PORT: int = 5432
    SQLALCHEMY_DATABASE_URI: Optional[Any] = None

    # Supabase Client
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None

    # Redis
    REDIS_URL: Optional[str] = None

    # MCP (Model Context Protocol) servers
    MCP_FALLBACK_MODE: bool = True
    STRIPE_MCP_URL: Optional[str] = None
    STRIPE_MCP_API_KEY: Optional[str] = None
    NOTION_MCP_URL: Optional[str] = None
    NOTION_MCP_TOKEN: Optional[str] = None
    SLACK_MCP_URL: Optional[str] = None
    SLACK_MCP_BOT_TOKEN: Optional[str] = None
    BRAVE_MCP_URL: Optional[str] = None
    BRAVE_MCP_API_KEY: Optional[str] = None
    GOOGLE_MCP_URL: Optional[str] = None
    GOOGLE_MCP_CREDENTIALS: Optional[str] = None
    SUPABASE_MCP_URL: Optional[str] = None
    SUPABASE_MCP_KEY: Optional[str] = None
    BROWSER_MCP_URL: Optional[str] = None
    BROWSER_MCP_API_KEY: Optional[str] = None
    EMAIL_MCP_URL: Optional[str] = None
    EMAIL_MCP_API_KEY: Optional[str] = None
    CALENDAR_MCP_URL: Optional[str] = None
    CALENDAR_MCP_API_KEY: Optional[str] = None
    CONTEXT7_MCP_URL: Optional[str] = None
    CONTEXT7_MCP_API_KEY: Optional[str] = None
    COLLABORATION_MCP_URL: Optional[str] = None
    COLLABORATION_MCP_API_KEY: Optional[str] = None

    # Direct API integrations
    STRIPE_API_KEY: Optional[str] = None

    # WhatsApp API (WAHA - WhatsApp HTTP API)
    WAHA_BASE_URL: Optional[str] = None
    WAHA_API_KEY: Optional[str] = None
    WAHA_SESSION: str = "default"
    WAHA_FOUNDER_PHONE: Optional[str] = None
    WAHA_AUTO_DISPATCH_MANDATE: bool = True

    # Fleet and Sub-Worker Autonomy Limits
    MAX_FLEET_SIZE: int = 6
    MAX_SUBTASKS_PER_MANDATE: int = 5
    MAX_SUBWORKERS_PER_AGENT: int = 5
    MAX_SUPERVISOR_ITERATIONS: int = 3
    ALLOW_AUTONOMOUS_HIRING: bool = False
    ALLOW_AUTONOMOUS_SUBWORKERS: bool = False

    # LLM overrides
    GROQ_CUSTOM_MODEL: Optional[str] = None
    NVIDIA_CUSTOM_MODEL: Optional[str] = None

    ENVIRONMENT: str = "local"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")


settings = Settings()

# Force overrides if Pydantic misses them due to env_file conflicts in Railway/deployment
if not settings.SUPABASE_URL:
    settings.SUPABASE_URL = os.getenv("SUPABASE_URL")
if not settings.SUPABASE_KEY:
    settings.SUPABASE_KEY = (
        os.getenv("SUPABASE_KEY") or 
        os.getenv("SUPABASE_SECRET_KEY") or 
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
        os.getenv("SUPABASE_ANON_KEY")
    )
if not settings.SUPABASE_ANON_KEY:
    settings.SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
if not settings.SUPABASE_JWT_SECRET:
    settings.SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
if not settings.GROQ_API_KEY:
    settings.GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not settings.NVIDIA_API_KEY:
    settings.NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
if not settings.OPENAI_API_KEY:
    settings.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not settings.GEMINI_API_KEY:
    settings.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not settings.GOOGLE_API_KEY:
    settings.GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

