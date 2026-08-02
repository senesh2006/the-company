import logging
from typing import Dict, Any, Optional, Tuple, Literal, Union
from app.models.domain import TrustTier

logger = logging.getLogger(__name__)

# Constants for Trust Tier Mechanics (PRD v6.0 §6.1 & §6.3)
CLEAN_CYCLES_FOR_ASSIST_PROMOTION = 3
MAX_REVISE_RETRIES = 2

class GovernanceService:
    """
    Core Governance & Trust Tier Engine as specified in PRD v6.0 §6.1, §6.2, §6.3.
    Enforces earned autonomy, tier-aware review gates, immediate demotion, and promotion tracking.
    """

    @staticmethod
    def get_authority_limit(trust_tier: Union[str, TrustTier]) -> float:
        tier_str = trust_tier.value if isinstance(trust_tier, TrustTier) else str(trust_tier).lower()
        if tier_str == "operate":
            return 1000.0
        elif tier_str == "assist":
            return 100.0
        return 0.0

    @staticmethod
    def get_next_tier(trust_tier: Union[str, TrustTier]) -> TrustTier:
        tier_str = trust_tier.value if isinstance(trust_tier, TrustTier) else str(trust_tier).lower()
        if tier_str == "observe":
            return TrustTier.ASSIST
        elif tier_str == "assist":
            return TrustTier.OPERATE
        return TrustTier.OPERATE

    @staticmethod
    def get_demoted_tier(trust_tier: Union[str, TrustTier]) -> TrustTier:
        tier_str = trust_tier.value if isinstance(trust_tier, TrustTier) else str(trust_tier).lower()
        if tier_str == "operate":
            return TrustTier.ASSIST
        return TrustTier.OBSERVE

    @staticmethod
    def should_promote_to_assist(clean_cycles_count: int) -> bool:
        return clean_cycles_count >= CLEAN_CYCLES_FOR_ASSIST_PROMOTION

    @staticmethod
    def is_action_authorized(
        trust_tier: Union[str, TrustTier],
        amount_usd: float = 0.0,
        is_sensitive: bool = False
    ) -> bool:
        tier_str = trust_tier.value if isinstance(trust_tier, TrustTier) else str(trust_tier).lower()
        if tier_str == "observe":
            return False
        if tier_str == "assist":
            if is_sensitive or amount_usd > 100.0:
                return False
            return True
        if tier_str == "operate":
            if is_sensitive and amount_usd > 1000.0:
                return False
            return amount_usd <= 1000.0
        return False

    @staticmethod
    def evaluate_execution_gating(
        trust_tier: Union[str, TrustTier],
        action_type: str,
        amount_usd: float = 0.0,
        authority_limit_usd: float = 0.0,
        is_sensitive: bool = False,
        is_reversible: bool = True
    ) -> Tuple[bool, str]:
        """
        Evaluates whether a planned action can proceed unattended or must be gated for founder review.
        Returns: (needs_approval: bool, reason: str)
        """
        normalized_tier = trust_tier.value if isinstance(trust_tier, TrustTier) else str(trust_tier or "observe").lower()

        # Tier 1: OBSERVE
        # Read data, draft output, NEVER send or act autonomously.
        if normalized_tier == "observe":
            if action_type in ["read_data", "draft_output", "analyze", "internal_brief"]:
                return False, "Observe tier: internal read/draft permitted unattended."
            return True, "Observe tier: all external actions and final dispatches require founder approval."

        # Tier 2: ASSIST
        # Act on low-risk, reversible tasks; everything else queued for approval.
        if normalized_tier == "assist":
            if is_sensitive or not is_reversible:
                return True, f"Assist tier: sensitive or irreversible action ('{action_type}') queued for approval."
            if amount_usd > 100.0:
                return True, f"Assist tier: financial action (${amount_usd:.2f}) exceeds $100 limit."
            return False, "Assist tier: low-risk reversible task permitted unattended."

        # Tier 3: OPERATE
        # Act within stated authority limit unattended; high-risk actions still gated.
        if normalized_tier == "operate":
            limit = authority_limit_usd if authority_limit_usd > 0 else 1000.0
            if amount_usd > limit and amount_usd > 0:
                return True, f"Operate tier: amount (${amount_usd:.2f}) exceeds authority limit (${limit:.2f})."
            if is_sensitive and action_type in ["wire_transfer", "delete_database", "bulk_refund"]:
                return True, f"Operate tier: critical safeguard triggered for high-risk action '{action_type}'."
            return False, f"Operate tier: execution permitted unattended within ${limit:.2f} limit."

        # Default safe fallback
        return True, "Unknown trust tier: defaulting to founder approval gate."

    @staticmethod
    def evaluate_promotion(agent: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
        """
        Checks if an agent has earned a trust tier promotion based on track record.
        Returns: (new_tier, reason) or (None, None) if not eligible.
        """
        current_tier = (agent.get("trust_tier") or "observe").lower()
        clean_cycles = agent.get("clean_cycles_count", 0)

        if current_tier == "observe" and clean_cycles >= CLEAN_CYCLES_FOR_ASSIST_PROMOTION:
            return "assist", f"Earned promotion to Assist tier after {clean_cycles} consecutive clean, unflagged cycles."

        return None, None

    @staticmethod
    def evaluate_demotion(agent: Dict[str, Any], reason: str = "Founder rejection or execution error") -> Tuple[str, str]:
        """
        Immediately rolls back permissions on error or rejection (PRD v6.0 §6.1).
        """
        current_tier = (agent.get("trust_tier") or "observe").lower()
        
        if current_tier == "operate":
            new_tier = "assist"
        else:
            new_tier = "observe"

        return new_tier, f"Automatic demotion to {new_tier.capitalize()} tier: {reason}"

    @staticmethod
    def check_retry_limit(current_retries: int) -> bool:
        """
        PRD v6.0 §07: One review gate, capped at 2 revise retries, tier-aware.
        Returns True if more retries allowed, False if exceeded.
        """
        return current_retries < MAX_REVISE_RETRIES
