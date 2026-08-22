import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Set, AsyncGenerator, Optional, Any

logger = logging.getLogger(__name__)


class TaskStreamBroadcaster:
    """
    In-memory Pub/Sub event bus for live LangGraph execution streaming.
    Matches the MemorySaver / Postgres fallback architecture of the repository.
    
    Features:
    - Buffers historical events so late-attaching SSE clients receive full context.
    - Broadcasts node completion events (supervisor, workers, synthesis) to active subscribers.
    - Handles client disconnects and memory cleanup.
    """
    def __init__(self):
        # task_id -> list of buffered event dicts
        self._history: Dict[str, List[Dict[str, Any]]] = {}
        # task_id -> set of subscriber asyncio.Queue instances
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        # task_id -> final completion event
        self._completed_tasks: Dict[str, Dict[str, Any]] = {}

    async def publish(self, task_id: str, event: Dict[str, Any]):
        """Publish a normalized node event to all active subscribers of task_id and buffer it in history."""
        if "timestamp" not in event:
            event["timestamp"] = datetime.now(timezone.utc).isoformat()

        # Buffer in history
        if task_id not in self._history:
            self._history[task_id] = []
        self._history[task_id].append(event)

        if event.get("node") == "end" or event.get("status") in ("completed", "failed"):
            self._completed_tasks[task_id] = event

        # Distribute to active subscriber queues
        queues = self._subscribers.get(task_id, set())
        for q in list(queues):
            try:
                q.put_nowait(event)
            except Exception as e:
                logger.debug(f"Failed to deliver event to queue for task {task_id}: {e}")

    def publish_sync(self, task_id: str, event: Dict[str, Any]):
        """Synchronous wrapper to publish from sync threads or runner callbacks."""
        if "timestamp" not in event:
            event["timestamp"] = datetime.now(timezone.utc).isoformat()
        if task_id not in self._history:
            self._history[task_id] = []
        self._history[task_id].append(event)
        if event.get("node") == "end" or event.get("status") in ("completed", "failed"):
            self._completed_tasks[task_id] = event

        for q in list(self._subscribers.get(task_id, set())):
            try:
                q.put_nowait(event)
            except Exception:
                pass

    async def subscribe(self, task_id: str, timeout: float = 180.0) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Subscribes to a task's event stream.
        1. Replays previously emitted historical events.
        2. Streams new incoming events as nodes complete.
        3. Cleans up upon task end or client disconnect.
        """
        queue: asyncio.Queue = asyncio.Queue()

        # 1. Snapshot history BEFORE registering subscriber queue to avoid race conditions
        history_snapshot = list(self._history.get(task_id, []))

        if task_id not in self._subscribers:
            self._subscribers[task_id] = set()
        self._subscribers[task_id].add(queue)

        try:
            for event in history_snapshot:
                yield event
                if event.get("node") == "end":
                    return

            # If task was already completed before client subscription and history was empty
            if not history_snapshot and task_id in self._completed_tasks:
                yield self._completed_tasks[task_id]
                return

            # 2. Stream new live events
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=timeout)
                    yield event
                    if event.get("node") == "end":
                        break
                except asyncio.TimeoutError:
                    logger.info(f"SSE stream timed out waiting for events on task {task_id}")
                    break
        finally:
            if task_id in self._subscribers:
                self._subscribers[task_id].discard(queue)
                if not self._subscribers[task_id]:
                    del self._subscribers[task_id]

    def clear(self, task_id: str):
        """Clean up memory buffer for a task."""
        self._history.pop(task_id, None)
        self._subscribers.pop(task_id, None)
        self._completed_tasks.pop(task_id, None)


task_broadcaster = TaskStreamBroadcaster()
