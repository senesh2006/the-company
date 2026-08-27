#!/usr/bin/env python3
"""
Company OS — Demo Account Reset & Self-Healing Engine
=====================================================
Restores the demo account to its clean, pristine baseline state:
1. Clears temporary tasks, agent run logs, live thoughts, and audit entries.
2. Clears finance transactions and resets the Chart of Accounts.
3. Resets the demo account's rate-limiting sliding window.
4. Re-seeds baseline GAAP accounts, 4 months of verified journal entries,
   autonomous worker roles, shared memory facts, domain documents, and demo tasks.

Usage:
    # One-shot reset
    python scripts/reset_demo_account.py

    # Self-healing scheduled daemon (e.g. every 60 minutes during event)
    python scripts/reset_demo_account.py --loop --interval 60

Environment Variables:
    API_BASE_URL        Base URL of backend (default: http://localhost:8000)
    DEMO_BUSINESS_ID    Demo Business ID (default: 00000000-0000-0000-0000-000000000001)
    DEMO_EMAIL          Demo account email (default: demo@thecompany.ai)
"""

import os
import sys
import time
import argparse
import logging
from pathlib import Path
from typing import Dict, Any

# Ensure project root is on sys.path for direct script execution
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.seed_demo_account import (
    DemoSeedRunner,
    API_BASE_URL,
    DEMO_EMAIL,
    DEMO_PASSWORD,
    DEMO_FULL_NAME,
    BUSINESS_PROFILE
)

logger = logging.getLogger("demo_reset")

def reset_demo_state(base_url: str = API_BASE_URL, business_id: str = None) -> None:
    """Executes a complete state reset and re-seed of the demo account."""
    demo_biz = business_id or os.getenv("DEMO_BUSINESS_ID", "00000000-0000-0000-0000-000000000001")
    
    print("\n" + "=" * 72)
    print("   COMPANY OS — DEMO ACCOUNT RESET & SELF-HEALING ENGINE")
    print(f"   Target Server: {base_url} | Business ID: {demo_biz}")
    print("=" * 72)

    # 1. Reset in-memory rate limits if running in same process or via TaskService
    try:
        from app.api.routes.tasks import reset_demo_rate_limits
        reset_demo_rate_limits()
        print("  ✓ Cleared demo task rate limiting window.")
    except Exception as e:
        print(f"  → Rate limit reset notice: {e}")

    # 2. Reset Task & Agent data in TaskService
    try:
        from app.services.task_service import TaskService
        ts = TaskService()
        cleared_info = ts.clear_business_data(demo_biz)
        print(f"  ✓ Purged ephemeral demo tasks ({cleared_info.get('deleted_tasks', 0)}) and agents ({cleared_info.get('deleted_agents', 0)}).")
    except Exception as e:
        print(f"  → Task service purge notice: {e}")

    # 2b. Purge any leftover recurring verification routines for demo business
    try:
        from app.services.routine_service import RoutineService
        rs = RoutineService()
        routines = rs.list_routines(demo_biz)
        deleted_count = 0
        for r in routines:
            title_lower = str(r.get("title", "")).lower()
            if "verification" in title_lower or "judge" in title_lower or "demo" in title_lower:
                if rs.delete_routine(demo_biz, r.get("id")):
                    deleted_count += 1
        if deleted_count > 0:
            print(f"  ✓ Purged {deleted_count} recurring demo verification routines.")
    except Exception as e:
        print(f"  → Routine cleanup notice: {e}")

    # 3. Clear Google Sheets / Finance General Ledger
    try:
        from app.services.google_sheets_service import GoogleSheetsService
        gs = GoogleSheetsService(business_id=demo_biz)
        gs.clear_all_data()
        print("  ✓ Cleared finance journal entries and chart of accounts.")
    except Exception as e:
        print(f"  → Finance purge notice: {e}")

    # 4. Clear Shared Memory facts to pristine baseline
    try:
        from app.services.shared_memory import SharedMemoryService
        sm = SharedMemoryService()
        # Delete custom keys
        for key in ["brand_voice", "target_customer", "financial_runway", "top_priorities_q3", "pricing_policy"]:
            try:
                sm.delete(business_id=demo_biz, key=key)
            except Exception:
                pass
        print("  ✓ Reset shared memory knowledge keys.")
    except Exception as e:
        print(f"  → Shared memory purge notice: {e}")

    # 5. Re-run complete baseline seed
    print("\n  → Re-seeding clean baseline demo environment...")
    runner = DemoSeedRunner(base_url=base_url)
    runner.run()
    print("  ✓ Demo account successfully restored to baseline state!\n")


def main():
    parser = argparse.ArgumentParser(description="Company OS Demo Account Reset & Self-Healing Engine")
    parser.add_argument("--url", default=API_BASE_URL, help="Base API URL (default: http://localhost:8000)")
    parser.add_argument("--business-id", default=None, help="Target Demo Business ID")
    parser.add_argument("--loop", action="store_true", help="Run continuously in a scheduled self-healing loop")
    parser.add_argument("--interval", type=int, default=60, help="Interval in minutes between resets (default: 60)")
    args = parser.parse_args()

    if args.loop:
        print(f"🔄 Starting Company OS Self-Healing Demo Service (Interval: {args.interval}m)...")
        while True:
            try:
                reset_demo_state(base_url=args.url, business_id=args.business_id)
            except Exception as e:
                print(f"❌ Error during scheduled demo reset: {e}")
            print(f"⏳ Sleeping for {args.interval} minutes until next self-healing cycle...")
            time.sleep(args.interval * 60)
    else:
        reset_demo_state(base_url=args.url, business_id=args.business_id)


if __name__ == "__main__":
    main()
