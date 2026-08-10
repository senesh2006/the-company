import os
import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel
import jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Any

try:
    from supabase._sync.client import create_client, Client
except ImportError:
    try:
        from supabase import create_client, Client
    except Exception:
        create_client = None
        Client = Any

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
    business_id: Optional[str] = None
    user_metadata: Optional[Dict[str, Any]] = None
    app_metadata: Optional[Dict[str, Any]] = None


def _get_or_create_business_for_user(user_id: str, email: Optional[str]) -> str:
    """
    Resolve a business_id for this user.
    - Prefer an existing business row where owner_id == user_id.
    - Otherwise use the user_id itself as the business_id. This is robust even when
      the owner_id migration has not been applied.
    - Try to create/upsert the business row so the businesses table stays consistent.
    """
    try:
        client = get_supabase_client()
        # 1. If the owner_id migration is present, use the existing business.
        try:
            resp = client.table("businesses").select("id").eq("owner_id", user_id).limit(1).execute()
            if resp.data:
                return str(resp.data[0]["id"])
        except Exception as e:
            logger.debug(f"owner_id lookup failed (migration may be missing): {e}")

        # 2. Use the user's auth id as the stable business_id. This guarantees each
        #    account is isolated even when the businesses table lacks an owner_id column.
        business_id = user_id
        name = email.split("@")[0] if email else "My Business"
        try:
            client.table("businesses").insert({"id": business_id, "name": name, "owner_id": user_id}).execute()
        except Exception as e:
            logger.debug(f"Could not insert business row with owner_id (may already exist or owner_id missing): {e}")
            # Try without owner_id in case the migration has not been applied.
            try:
                client.table("businesses").insert({"id": business_id, "name": name}).execute()
            except Exception as e2:
                logger.debug(f"Could not insert business row without owner_id (may already exist): {e2}")

        return business_id
    except Exception as e:
        logger.warning(f"Failed to resolve business for user {user_id}: {e}")

    return "00000000-0000-0000-0000-000000000001"


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> User:
    """
    Authenticates requests using Supabase JWT tokens.
    Validates token either through the Supabase client or by decoding the JWT.
    Attaches the user's own business_id so data is isolated per account.
    """
    token = credentials.credentials if credentials else None

    if token:
        # 1. Try validating through Supabase Auth client
        try:
            client = get_supabase_client()
            user_response = client.auth.get_user(token)
            if user_response and user_response.user:
                sb_user = user_response.user
                business_id = _get_or_create_business_for_user(str(sb_user.id), sb_user.email)
                return User(
                    id=str(sb_user.id),
                    email=sb_user.email,
                    role=sb_user.role or "founder",
                    business_id=business_id,
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
                business_id = _get_or_create_business_for_user(user_id, email)
                return User(
                    id=user_id,
                    email=email,
                    role=role,
                    business_id=business_id,
                    user_metadata=payload.get("user_metadata", {}),
                    app_metadata=payload.get("app_metadata", {})
                )
            except jwt.ExpiredSignatureError:
                raise HTTPException(status_code=401, detail="Authentication token has expired")
            except jwt.InvalidTokenError as e:
                logger.warning(f"Invalid JWT token: {e}")
                raise HTTPException(status_code=401, detail="Invalid authentication token")

    # 3. Development / Local Fallback when no token is supplied
    dev_user_id = "00000000-0000-0000-0000-000000000000"
    return User(
        id=dev_user_id,
        email="founder@companyos.ai",
        role="founder",
        business_id=_get_or_create_business_for_user(dev_user_id, "founder@companyos.ai"),
        user_metadata={"full_name": "Executive Founder"},
        app_metadata={"provider": "dev_session"}
    )
