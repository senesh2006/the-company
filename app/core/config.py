from typing import Optional, Any
from pydantic import PostgresDsn, RedisDsn, field_validator, ValidationInfo
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "The Company"
    API_V1_STR: str = "/api/v1"
    OPENAI_API_KEY: Optional[str] = None
    FIREWORKS_API_KEY: Optional[str] = None

    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

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

    # Redis
    REDIS_URL: Optional[str] = None

    ENVIRONMENT: str = "local"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

settings = Settings()

import os
# Force overrides if Pydantic misses them due to env_file conflicts in Railway
if not settings.SUPABASE_URL:
    settings.SUPABASE_URL = os.getenv("SUPABASE_URL")
if not settings.SUPABASE_KEY:
    settings.SUPABASE_KEY = (
        os.getenv("SUPABASE_KEY") or 
        os.getenv("SUPABASE_SECRET_KEY") or 
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
        os.getenv("SUPABASE_ANON_KEY")
    )
if not settings.FIREWORKS_API_KEY:
    settings.FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY")
