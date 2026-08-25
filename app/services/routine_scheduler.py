import asyncio
import logging
from typing import Optional
from app.services.routine_service import routine_service, DEFAULT_BUSINESS_ID

logger = logging.getLogger(__name__)

class RoutineSchedulerDaemon:
    """
    Background daemon that periodically checks and triggers due routines
    across businesses, ensuring full autonomous execution even when the user
    is not browsing or using the web app.
    """

    def __init__(self, check_interval_seconds: int = 60):
        self.check_interval = check_interval_seconds
        self._running = False
        self._task: Optional[asyncio.Task] = None

    async def start(self):
        """Starts the background scheduler loop."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info(f"Background Routine Scheduler Daemon started (tick: {self.check_interval}s)")

    async def stop(self):
        """Stops the background scheduler loop."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("Background Routine Scheduler Daemon stopped.")

    async def _run_loop(self):
        """Continuous evaluation loop."""
        # Initial sleep to let app startup settle
        await asyncio.sleep(5)
        while self._running:
            try:
                # Check and run due routines for default business
                # If multi-tenant, can iterate through active business IDs
                routine_service.check_and_run_due_routines(DEFAULT_BUSINESS_ID)
            except Exception as e:
                logger.error(f"Error in routine scheduler loop tick: {e}", exc_info=True)

            try:
                await asyncio.sleep(self.check_interval)
            except asyncio.CancelledError:
                break


# Global singleton daemon
routine_scheduler_daemon = RoutineSchedulerDaemon(check_interval_seconds=60)
