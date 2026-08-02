import pytest
from app.services.governance_service import GovernanceService
from app.models.domain import TrustTier

def test_governance_promotion():
    assert GovernanceService.should_promote_to_assist(clean_cycles_count=3) is True
    assert GovernanceService.should_promote_to_assist(clean_cycles_count=2) is False
    
    assert GovernanceService.get_next_tier(TrustTier.OBSERVE) == TrustTier.ASSIST
    assert GovernanceService.get_next_tier(TrustTier.ASSIST) == TrustTier.OPERATE
    assert GovernanceService.get_next_tier(TrustTier.OPERATE) == TrustTier.OPERATE

def test_governance_demotion():
    assert GovernanceService.get_demoted_tier(TrustTier.OPERATE) == TrustTier.ASSIST
    assert GovernanceService.get_demoted_tier(TrustTier.ASSIST) == TrustTier.OBSERVE
    assert GovernanceService.get_demoted_tier(TrustTier.OBSERVE) == TrustTier.OBSERVE

def test_authority_limits():
    assert GovernanceService.get_authority_limit(TrustTier.OBSERVE) == 0.0
    assert GovernanceService.get_authority_limit(TrustTier.ASSIST) == 100.0
    assert GovernanceService.get_authority_limit(TrustTier.OPERATE) == 1000.0
    
    assert GovernanceService.is_action_authorized(TrustTier.OBSERVE, amount_usd=50.0, is_sensitive=False) is False
    assert GovernanceService.is_action_authorized(TrustTier.ASSIST, amount_usd=50.0, is_sensitive=False) is True
    assert GovernanceService.is_action_authorized(TrustTier.ASSIST, amount_usd=150.0, is_sensitive=False) is False
    assert GovernanceService.is_action_authorized(TrustTier.ASSIST, amount_usd=50.0, is_sensitive=True) is False
    assert GovernanceService.is_action_authorized(TrustTier.OPERATE, amount_usd=500.0, is_sensitive=False) is True
    assert GovernanceService.is_action_authorized(TrustTier.OPERATE, amount_usd=1500.0, is_sensitive=False) is False

def test_retry_limits():
    assert GovernanceService.check_retry_limit(0) is True
    assert GovernanceService.check_retry_limit(1) is True
    assert GovernanceService.check_retry_limit(2) is False
