import json
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.services.shared_memory import SharedMemoryService
from app.services.task_service import TaskService
from app.agents.workers import dispatch_worker_direct

logger = logging.getLogger(__name__)

DEFAULT_BUSINESS_ID = "00000000-0000-0000-0000-000000000001"


class RoutineCreateInput(BaseModel):
    title: str = Field(..., description="Name of the automated routine e.g. 'Daily 9 AM Financial Audit'")
    description: str = Field(..., description="Actionable mandate instructions to be executed autonomously by the specialist")
    assignee_role: str = Field("Personal Assistant", description="Target specialist role e.g. 'Finance Manager', 'Marketing Manager', 'Software Engineer', 'Research Specialist', 'Personal Assistant'")
    schedule_type: str = Field("daily", description="'daily', 'hourly', 'weekly', 'interval_minutes', 'cron'")
    schedule_config: Dict[str, Any] = Field(default_factory=lambda: {"time": "09:00"}, description="Schedule details e.g. {'time': '09:00'}, {'interval_minutes': 60}")
    priority: str = Field("medium", description="'low', 'medium', 'high', 'critical'")
    is_active: bool = Field(True, description="Whether routine is enabled")


class RoutineService:
    """
    Manages autonomous scheduled routines that execute in the background
    regardless of whether the user is actively using the web app.
    """

    def __init__(self, memory_service: Optional[SharedMemoryService] = None):
        self.memory = memory_service or SharedMemoryService()
        self.tasks = TaskService()

    def _get_routines_key(self, business_id: str) -> str:
        return f"company_routines"

    def _calculate_next_run(self, schedule_type: str, schedule_config: Dict[str, Any], from_time: Optional[datetime] = None) -> datetime:
        """Calculates the next execution datetime based on schedule configuration."""
        base = from_time or datetime.now(timezone.utc)

        if schedule_type == "hourly":
            return base + timedelta(hours=1)
        elif schedule_type == "interval_minutes":
            mins = int(schedule_config.get("interval_minutes", 60) or 60)
            return base + timedelta(minutes=max(1, mins))
        elif schedule_type == "weekly":
            days_ahead = 7
            target_time_str = schedule_config.get("time", "09:00")
            try:
                hour, minute = map(int, target_time_str.split(":"))
            except Exception:
                hour, minute = 9, 0
            next_date = (base + timedelta(days=days_ahead)).replace(hour=hour, minute=minute, second=0, microsecond=0)
            return next_date
        else: # "daily" default
            target_time_str = schedule_config.get("time", "09:00")
            try:
                hour, minute = map(int, target_time_str.split(":"))
            except Exception:
                hour, minute = 9, 0

            candidate = base.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if candidate <= base:
                candidate += timedelta(days=1)
            return candidate

    def list_routines(self, business_id: str = DEFAULT_BUSINESS_ID) -> List[Dict[str, Any]]:
        """Lists all registered automated routines for a business."""
        try:
            rec = self.memory.get(business_id, self._get_routines_key(business_id))
            if rec and isinstance(rec.get("value"), list):
                return rec["value"]
            elif rec and isinstance(rec.get("value"), str):
                try:
                    return json.loads(rec["value"])
                except Exception:
                    pass
        except Exception as e:
            logger.error(f"Error listing routines: {e}")
        return []

    def get_routine(self, business_id: str, routine_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a specific routine by ID."""
        routines = self.list_routines(business_id)
        for r in routines:
            if r.get("id") == routine_id:
                return r
        return None

    def create_routine(
        self,
        business_id: str = DEFAULT_BUSINESS_ID,
        title: str = "Automated Operational Routine",
        description: str = "",
        assignee_role: str = "Personal Assistant",
        schedule_type: str = "daily",
        schedule_config: Optional[Dict[str, Any]] = None,
        priority: str = "medium",
        is_active: bool = True,
        created_by: str = "User"
    ) -> Dict[str, Any]:
        """
        Creates and persists a new background routine.
        """
        routines = self.list_routines(business_id)
        routine_id = f"routine_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        cfg = schedule_config or {"time": "09:00"}
        next_run = self._calculate_next_run(schedule_type, cfg, from_time=now)

        new_routine = {
            "id": routine_id,
            "business_id": business_id,
            "title": title,
            "description": description,
            "assignee_role": assignee_role,
            "schedule_type": schedule_type,
            "schedule_config": cfg,
            "priority": priority,
            "is_active": is_active,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "last_run_at": None,
            "next_run_at": next_run.isoformat(),
            "run_count": 0,
            "last_status": "pending",
            "last_result": None,
            "created_by": created_by
        }

        routines.append(new_routine)
        self.memory.set(
            business_id=business_id,
            key=self._get_routines_key(business_id),
            value=routines,
            tags=["routines", "automation", "scheduled"],
            updated_by=created_by
        )
        logger.info(f"Created automated routine '{title}' ({routine_id}) scheduled for {next_run.isoformat()}")
        return new_routine

    def update_routine(
        self,
        business_id: str,
        routine_id: str,
        updates: Dict[str, Any],
        updated_by: str = "User"
    ) -> Optional[Dict[str, Any]]:
        """Updates routine settings, prompt, or schedule."""
        routines = self.list_routines(business_id)
        found = None
        for i, r in enumerate(routines):
            if r.get("id") == routine_id:
                for k, v in updates.items():
                    if k not in ("id", "business_id", "created_at"):
                        r[k] = v
                r["updated_at"] = datetime.now(timezone.utc).isoformat()
                if "schedule_type" in updates or "schedule_config" in updates:
                    r["next_run_at"] = self._calculate_next_run(
                        r.get("schedule_type", "daily"),
                        r.get("schedule_config", {}),
                        from_time=datetime.now(timezone.utc)
                    ).isoformat()
                routines[i] = r
                found = r
                break

        if found:
            self.memory.set(
                business_id=business_id,
                key=self._get_routines_key(business_id),
                value=routines,
                tags=["routines", "automation"],
                updated_by=updated_by
            )
        return found

    def toggle_routine(self, business_id: str, routine_id: str, is_active: bool) -> Optional[Dict[str, Any]]:
        """Pauses or resumes a routine."""
        return self.update_routine(business_id, routine_id, {"is_active": is_active})

    def delete_routine(self, business_id: str, routine_id: str) -> bool:
        """Deletes a routine."""
        routines = self.list_routines(business_id)
        initial_len = len(routines)
        routines = [r for r in routines if r.get("id") != routine_id]
        if len(routines) < initial_len:
            self.memory.set(
                business_id=business_id,
                key=self._get_routines_key(business_id),
                value=routines,
                tags=["routines", "automation"],
                updated_by="User"
            )
            return True
        return False

    def execute_routine(self, business_id: str, routine_id: str) -> Dict[str, Any]:
        """
        Executes a routine immediately in the background via autonomous worker dispatch.
        """
        routine = self.get_routine(business_id, routine_id)
        if not routine:
            raise ValueError(f"Routine {routine_id} not found.")

        now = datetime.now(timezone.utc)
        logger.info(f"Executing automated background routine '{routine['title']}' for {routine['assignee_role']}...")

        # 1. Create a task in TaskService for transparency and audit trails
        task_record = self.tasks.create_task(
            business_id=business_id,
            description=f"[Automated Routine: {routine['title']}] {routine['description']}",
            assignee_role=routine.get("assignee_role", "Personal Assistant"),
            priority=routine.get("priority", "medium")
        )

        task_id = task_record.get("id")

        # 2. Dispatch autonomous worker execution
        try:
            worker_result = dispatch_worker_direct(
                business_id=business_id,
                role=routine.get("assignee_role", "Personal Assistant"),
                description=routine.get("description", "")
            )

            res_text = worker_result.get("output") or worker_result.get("final_output") or worker_result.get("result") or "Routine executed successfully."
            status = "completed"
            
            # Update task in database
            if task_id:
                self.tasks.complete_task(task_id, result=res_text)

        except Exception as e:
            logger.error(f"Error during routine execution: {e}")
            res_text = f"Routine execution error: {str(e)}"
            status = "failed"
            if task_id:
                self.tasks.fail_task(task_id, error=str(e))

        # 3. Compute next scheduled run time
        next_run = self._calculate_next_run(
            routine.get("schedule_type", "daily"),
            routine.get("schedule_config", {}),
            from_time=now
        )

        # 4. Update routine state
        updated_state = {
            "last_run_at": now.isoformat(),
            "next_run_at": next_run.isoformat(),
            "run_count": int(routine.get("run_count", 0) or 0) + 1,
            "last_status": status,
            "last_result": res_text[:500]
        }
        self.update_routine(business_id, routine_id, updated_state, updated_by="Routine Daemon")

        return {
            "routine_id": routine_id,
            "title": routine["title"],
            "status": status,
            "task_id": task_id,
            "executed_at": now.isoformat(),
            "next_run_at": next_run.isoformat(),
            "result_summary": res_text[:300]
        }

    def check_and_run_due_routines(self, business_id: str = DEFAULT_BUSINESS_ID) -> List[Dict[str, Any]]:
        """
        Scans all routines for the business and executes any that are active and due.
        """
        now = datetime.now(timezone.utc)
        routines = self.list_routines(business_id)
        executed = []

        for r in routines:
            if not r.get("is_active"):
                continue

            next_run_str = r.get("next_run_at")
            if not next_run_str:
                continue

            try:
                next_run = datetime.fromisoformat(next_run_str)
                if next_run.tzinfo is None:
                    next_run = next_run.replace(tzinfo=timezone.utc)

                if now >= next_run:
                    logger.info(f"Triggering due automated routine: {r.get('title')} ({r.get('id')})")
                    res = self.execute_routine(business_id, r["id"])
                    executed.append(res)
            except Exception as e:
                logger.error(f"Error evaluating routine {r.get('id')} schedule: {e}")

        return executed


# Global singleton instance
routine_service = RoutineService()
