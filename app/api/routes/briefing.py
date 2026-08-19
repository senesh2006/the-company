import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, Dict, Any

from app.api.deps import get_current_user
from app.services.briefing_service import BriefingService

logger = logging.getLogger(__name__)

router = APIRouter()
briefing_service = BriefingService()

DEFAULT_BUSINESS_ID = "00000000-0000-0000-0000-000000000001"

@router.get("/today")
def get_today_briefing(
    force_refresh: bool = Query(False, description="Force LLM to regenerate briefing"),
    user = Depends(get_current_user)
):
    """
    Returns Today's AI Executive Briefing synthesizing yesterday's operational events,
    completed deliverables, audit trail logs, and financial ledger status.
    """
    try:
        biz_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
        briefing = briefing_service.get_today_briefing(str(biz_id), force_refresh=force_refresh)
        return briefing
    except Exception as e:
        logger.error(f"Failed to generate Today's Briefing: {e}")
        raise HTTPException(status_code=500, detail=f"Briefing generation failed: {str(e)}")

@router.post("/refresh")
def refresh_today_briefing(user = Depends(get_current_user)):
    """
    Forces an on-demand re-synthesis of Today's Briefing using the latest live state.
    """
    try:
        biz_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
        briefing = briefing_service.get_today_briefing(str(biz_id), force_refresh=True)
        return briefing
    except Exception as e:
        logger.error(f"Failed to refresh briefing: {e}")
        raise HTTPException(status_code=500, detail=f"Briefing refresh failed: {str(e)}")
