import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Sensitive / Money-Movement tool operations that MUST be intercepted
MONEY_MOVEMENT_ACTIONS = {
    "stripe_finance": ["issue_refund", "transfer_funds", "create_payout", "charge_customer"],
    "supabase_database": ["transfer_funds", "execute_wire", "payout"],
    "internal_communication": []
}

class CircuitBreakerConfig(BaseModel):
    max_steps_per_task: int = 10
    max_cost_per_task_usd: float = 2.00
    max_consecutive_failed_tool_calls: int = 3
    max_single_spend_velocity_usd: float = 500.00
    hard_block_money_movement: bool = True
    rate_limit_window_minutes: int = 5
    max_spend_per_window_usd: float = 1500.00

class CircuitBreakerResult(BaseModel):
    tripped: bool = False
    reason: Optional[str] = None
    requires_human_approval: bool = False
    action_blocked: Optional[str] = None
    approval_payload: Optional[Dict[str, Any]] = None

class FinancialCircuitBreaker:
    """
    Hard external circuit breaker running outside of the LLM context.
    Protects against runaway execution loops, unverified financial transactions,
    excessive token/API cost, and velocity spend spikes.
    """

    def __init__(self, config: Optional[CircuitBreakerConfig] = None):
        self.config = config or CircuitBreakerConfig()
        self._recent_spend_events: List[tuple[datetime, float]] = []

    def check_execution_limits(
        self,
        step_count: int,
        current_cost: float,
        consecutive_errors: int
    ) -> CircuitBreakerResult:
        """
        Validates whether loop execution has exceeded maximum safe operating parameters.
        """
        if step_count >= self.config.max_steps_per_task:
            reason = f"Execution step limit exceeded: {step_count} >= {self.config.max_steps_per_task} max allowed steps."
            logger.warning(f"Circuit Breaker TRIPPED: {reason}")
            return CircuitBreakerResult(tripped=True, reason=reason)

        if current_cost >= self.config.max_cost_per_task_usd:
            reason = f"Task budget limit exceeded: ${current_cost:.2f} >= ${self.config.max_cost_per_task_usd:.2f} maximum task cost."
            logger.warning(f"Circuit Breaker TRIPPED: {reason}")
            return CircuitBreakerResult(tripped=True, reason=reason)

        if consecutive_errors >= self.config.max_consecutive_failed_tool_calls:
            reason = f"Consecutive tool failure limit exceeded: {consecutive_errors} failures in a row (Max: {self.config.max_consecutive_failed_tool_calls})."
            logger.warning(f"Circuit Breaker TRIPPED: {reason}")
            return CircuitBreakerResult(tripped=True, reason=reason)

        return CircuitBreakerResult(tripped=False)

    def inspect_tool_call(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        trust_tier: str = "observe",
        authority_limit: float = 0.0
    ) -> CircuitBreakerResult:
        """
        Intercepts tool execution before invocation.
        Enforces hard blocks on real money movement without human approval.
        """
        action = str(tool_args.get("action", "")).lower()
        amount_usd = float(tool_args.get("amount", tool_args.get("amount_usd", 0.0)) or 0.0)

        # Check if the action involves moving funds / Stripe payments / refunds
        is_money_movement = (
            tool_name in MONEY_MOVEMENT_ACTIONS and action in MONEY_MOVEMENT_ACTIONS[tool_name]
        ) or any(k in action for k in ["transfer", "refund", "payout", "send_money", "wire"])

        if is_money_movement:
            reason = (
                f"Financial Circuit Breaker: Real money movement action '{action}' on '{tool_name}' "
                f"for ${amount_usd:.2f} strictly requires human founder approval before execution."
            )
            logger.info(f"Circuit Breaker Intercept: {reason}")
            return CircuitBreakerResult(
                tripped=True,
                reason=reason,
                requires_human_approval=True,
                action_blocked=f"{tool_name}.{action}",
                approval_payload={
                    "tool": tool_name,
                    "action": action,
                    "amount_usd": amount_usd,
                    "arguments": tool_args,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )

        # Check single spend velocity limit
        if amount_usd > self.config.max_single_spend_velocity_usd:
            reason = (
                f"Velocity threshold exceeded: ${amount_usd:.2f} > "
                f"${self.config.max_single_spend_velocity_usd:.2f} single-action threshold."
            )
            return CircuitBreakerResult(
                tripped=True,
                reason=reason,
                requires_human_approval=True,
                action_blocked=f"{tool_name}.{action}",
                approval_payload={"tool": tool_name, "action": action, "amount_usd": amount_usd, "args": tool_args}
            )

        # Check cumulative spend rate within window
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=self.config.rate_limit_window_minutes)
        self._recent_spend_events = [(t, a) for t, a in self._recent_spend_events if t > cutoff]
        window_total = sum(a for _, a in self._recent_spend_events) + amount_usd

        if window_total > self.config.max_spend_per_window_usd:
            reason = (
                f"Spend rate velocity limit exceeded: ${window_total:.2f} in the past "
                f"{self.config.rate_limit_window_minutes} minutes exceeds ${self.config.max_spend_per_window_usd:.2f} ceiling."
            )
            return CircuitBreakerResult(
                tripped=True,
                reason=reason,
                requires_human_approval=True,
                action_blocked=f"{tool_name}.{action}",
                approval_payload={"window_total": window_total, "tool": tool_name, "action": action}
            )

        return CircuitBreakerResult(tripped=False)

    def record_spend_event(self, amount_usd: float):
        """Records an authorized spend event to track velocity."""
        if amount_usd > 0:
            self._recent_spend_events.append((datetime.utcnow(), amount_usd))
