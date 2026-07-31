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

class MockUser:
    def __init__(self):
        # Must be a valid UUID for Supabase owner_id column
        self.id = "00000000-0000-0000-0000-000000000000"
        self.email = "default@accentic.os"

def get_current_user():
    # Auth disabled globally per user request
    return MockUser()
