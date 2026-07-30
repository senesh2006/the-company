from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.core.config import settings

security = HTTPBearer()

import os
def get_supabase_client() -> Client:
    sb_url = settings.SUPABASE_URL or os.getenv("SUPABASE_URL")
    sb_key = (
        settings.SUPABASE_KEY or 
        os.getenv("SUPABASE_KEY") or 
        os.getenv("SUPABASE_SECRET_KEY") or 
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
        os.getenv("SUPABASE_ANON_KEY")
    )
    if not sb_key:
        raise HTTPException(status_code=500, detail="SUPABASE_KEY is missing from environment")
    return create_client(sb_url, sb_key)

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    supabase = get_supabase_client()
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
