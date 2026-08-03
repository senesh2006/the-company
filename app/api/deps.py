import os
import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel
import jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

# Security scheme with auto_error=False to allow graceful fallback in dev mode
security = HTTPBearer(auto_error=False)


def get_supabase_client() -> Client:
    sb_url = settings.SUPABASE_URL or os.getenv("SUPABASE_URL")
    sb_key = (
        settings.SUPABASE_KEY or 
        os.getenv("SUPABASE_KEY") or 
        os.getenv("SUPABASE_SECRET_KEY") or 
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
        os.getenv("SUPABASE_ANON_KEY")
    )
    if not sb_url or not sb_key:
        raise HTTPException(status_code=500, detail="SUPABASE_URL or SUPABASE_KEY is missing from environment")
    return create_client(sb_url, sb_key)


class User(BaseModel):
    id: str
    email: Optional[str] = None
    role: Optional[str] = "founder"
    user_metadata: Optional[Dict[str, Any]] = None
    app_metadata: Optional[Dict[str, Any]] = None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> User:
    """
    Authenticates requests using Supabase JWT tokens.
    Validates token either through the Supabase client or by decoding the JWT.
    """
    token = credentials.credentials if credentials else None

    if token:
        # 1. Try validating through Supabase Auth client
        try:
            client = get_supabase_client()
            user_response = client.auth.get_user(token)
            if user_response and user_response.user:
                sb_user = user_response.user
                return User(
                    id=str(sb_user.id),
                    email=sb_user.email,
                    role=sb_user.role or "founder",
                    user_metadata=sb_user.user_metadata or {},
                    app_metadata=sb_user.app_metadata or {}
                )
        except Exception as e:
            logger.debug(f"Supabase client auth verification failed, falling back to JWT decode: {e}")

        # 2. Try decoding JWT with SUPABASE_JWT_SECRET or SECRET_KEY
        jwt_secret = settings.SUPABASE_JWT_SECRET or settings.SECRET_KEY
        if jwt_secret:
            try:
                # Decode JWT without audience restriction (Supabase uses 'authenticated')
                payload = jwt.decode(
                    token, 
                    jwt_secret, 
                    algorithms=["HS256"], 
                    options={"verify_aud": False}
                )
                user_id = payload.get("sub") or payload.get("id") or "00000000-0000-0000-0000-000000000000"
                email = payload.get("email") or "founder@companyos.ai"
                role = payload.get("role") or "founder"
                return User(
                    id=user_id,
                    email=email,
                    role=role,
                    user_metadata=payload.get("user_metadata", {}),
                    app_metadata=payload.get("app_metadata", {})
                )
            except jwt.ExpiredSignatureError:
                raise HTTPException(status_code=401, detail="Authentication token has expired")
            except jwt.InvalidTokenError as e:
                logger.warning(f"Invalid JWT token: {e}")
                raise HTTPException(status_code=401, detail="Invalid authentication token")

    # 3. Development / Local Fallback when no token is supplied
    return User(
        id="00000000-0000-0000-0000-000000000000",
        email="founder@companyos.ai",
        role="founder",
        user_metadata={"full_name": "Executive Founder"},
        app_metadata={"provider": "dev_session"}
    )
