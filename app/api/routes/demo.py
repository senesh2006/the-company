import os
import time
import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
import jwt

from app.core.config import settings
from app.api.deps import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/login")
@router.get("/login")
def demo_login() -> Dict[str, Any]:
    """
    Public endpoint for 1-click Demo / Judge access.
    Returns a verified JWT session token scoped to the pre-seeded demo business_id
    without requiring any user credentials or signup forms.
    """
    try:
        demo_biz_id = settings.DEMO_BUSINESS_ID or os.getenv("DEMO_BUSINESS_ID") or "00000000-0000-0000-0000-000000000001"
        demo_email = settings.DEMO_EMAIL or os.getenv("DEMO_EMAIL") or "demo@thecompany.ai"
        
        jwt_secret = (
            settings.SUPABASE_JWT_SECRET or 
            settings.SECRET_KEY or 
            os.getenv("SUPABASE_JWT_SECRET") or 
            os.getenv("SECRET_KEY") or 
            "your-super-secret-key-change-in-production"
        )

        now = int(time.time())
        expires_at = now + (7 * 86400)  # 7 days session

        payload = {
            "sub": demo_biz_id,
            "id": demo_biz_id,
            "email": demo_email,
            "role": "authenticated",
            "business_id": demo_biz_id,
            "user_metadata": {
                "full_name": "Demo Evaluator / Judge",
                "is_demo": True,
                "role": "founder"
            },
            "app_metadata": {
                "provider": "demo_1click_access",
                "role": "authenticated"
            },
            "iat": now,
            "exp": expires_at
        }

        token = jwt.encode(payload, jwt_secret, algorithm="HS256")

        # Ensure demo business row exists in Supabase if connected
        try:
            client = get_supabase_client()
            if client:
                try:
                    client.table("businesses").upsert({
                        "id": demo_biz_id,
                        "name": "Aperture Analytics",
                        "owner_id": demo_biz_id
                    }).execute()
                except Exception:
                    pass
        except Exception as e:
            logger.debug(f"Demo business Supabase check skipped: {e}")

        logger.info(f"Generated 1-click demo access token for business_id: {demo_biz_id}")

        return {
            "status": "success",
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 7 * 86400,
            "business_id": demo_biz_id,
            "user": {
                "id": demo_biz_id,
                "email": demo_email,
                "role": "founder",
                "business_id": demo_biz_id,
                "user_metadata": {
                    "full_name": "Demo Evaluator / Judge",
                    "is_demo": True
                }
            },
            "message": "Demo session initialized. Welcome to Company OS!"
        }
    except Exception as e:
        logger.error(f"Failed to generate demo session token: {e}")
        raise HTTPException(status_code=500, detail=f"Could not initialize demo session: {str(e)}")
