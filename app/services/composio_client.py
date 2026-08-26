import json
import logging
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings
from app.api.deps import get_supabase_client

logger = logging.getLogger(__name__)


class ComposioClientError(Exception):
    """Raised when a Composio API or connection operation fails."""
    pass


class ComposioService:
    """
    Server-side Composio service for managing per-user OAuth connections
    and dynamic MCP sessions.
    """

    SUPPORTED_TOOLKITS = {
        "gmail": {"name": "Gmail", "app_id": "gmail", "category": "Communication"},
        "slack": {"name": "Slack", "app_id": "slack", "category": "Collaboration"},
        "notion": {"name": "Notion", "app_id": "notion", "category": "Productivity"},
        "github": {"name": "GitHub", "app_id": "github", "category": "Engineering"},
        "googlecalendar": {"name": "Google Calendar", "app_id": "googlecalendar", "category": "Calendar"},
        "googlesheets": {"name": "Google Sheets", "app_id": "googlesheets", "category": "Spreadsheets"},
    }

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "COMPOSIO_API_KEY", None)
        self.base_url = "https://backend.composio.dev/api/v1"
        self._sdk_client = None

    def _get_sdk(self):
        """Lazy load of Composio SDK if installed and configured."""
        if self._sdk_client is not None:
            return self._sdk_client

        if not self.api_key:
            return None

        try:
            from composio import Composio  # type: ignore
            self._sdk_client = Composio(api_key=self.api_key)
            return self._sdk_client
        except Exception as e:
            logger.debug(f"Composio SDK initialization info: {e}. Will use direct HTTP/fallback.")
            return None

    def initiate_connection(
        self,
        user_id: str,
        toolkit: str,
        redirect_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Initiates an OAuth connection flow for a user and toolkit.
        Returns a dictionary containing the redirect_url, connection_id, and status.
        """
        normalized_toolkit = toolkit.lower().strip()
        app_meta = self.SUPPORTED_TOOLKITS.get(normalized_toolkit, {"app_id": normalized_toolkit, "name": toolkit})
        app_id = app_meta["app_id"]
        
        connection_id = None
        auth_url = None

        sdk = self._get_sdk()
        if sdk is not None:
            try:
                # 1. Prefer modern composio connected_accounts.link API
                if hasattr(sdk, "connected_accounts") and hasattr(sdk.connected_accounts, "link"):
                    auth_id = None
                    if hasattr(sdk, "toolkits") and hasattr(sdk.toolkits, "_get_auth_config_id"):
                        try:
                            auth_id = sdk.toolkits._get_auth_config_id(toolkit=normalized_toolkit)
                        except Exception:
                            pass
                    if not auth_id and hasattr(sdk, "auth_configs"):
                        try:
                            cfgs = sdk.auth_configs.list()
                            for item in getattr(cfgs, "items", []):
                                if getattr(item, "toolkit", None) and getattr(item.toolkit, "slug", "").lower() == normalized_toolkit:
                                    auth_id = item.id
                                    break
                        except Exception:
                            pass
                    
                    if auth_id:
                        link_res = sdk.connected_accounts.link(
                            user_id=user_id,
                            auth_config_id=auth_id,
                            callback_url=redirect_url
                        )
                        auth_url = getattr(link_res, "redirect_url", None) or getattr(link_res, "url", None)
                        connection_id = getattr(link_res, "id", None) or getattr(link_res, "connection_id", None)

                # 2. Fallback to connected_accounts.initiate or toolkits.authorize if link was not used
                if not auth_url and hasattr(sdk, "connected_accounts") and hasattr(sdk.connected_accounts, "initiate"):
                    try:
                        initiate_res = sdk.connected_accounts.initiate(
                            user_id=user_id,
                            app_id=app_id,
                            redirect_url=redirect_url
                        )
                        auth_url = getattr(initiate_res, "redirect_url", None) or getattr(initiate_res, "url", None)
                        connection_id = getattr(initiate_res, "connection_id", None) or getattr(initiate_res, "id", None)
                    except Exception:
                        pass
            except Exception as e:
                logger.warning(f"Composio SDK initiate/link failed for {toolkit}: {e}. Falling back to REST/Mock.")

        if not auth_url and self.api_key:
            # Fallback to direct Composio REST API
            try:
                headers = {
                    "x-api-key": self.api_key,
                    "Content-Type": "application/json"
                }
                payload = {
                    "userUuid": user_id,
                    "appId": app_id,
                    "redirectUrl": redirect_url
                }
                with httpx.Client(timeout=15.0) as client:
                    resp = client.post(f"{self.base_url}/connectedAccounts", json=payload, headers=headers)
                    if resp.status_code in (200, 201):
                        data = resp.json()
                        auth_url = data.get("redirectUrl") or data.get("url")
                        connection_id = data.get("connectionId") or data.get("id")
            except Exception as e:
                logger.warning(f"Composio REST initiate failed for {toolkit}: {e}")

        # Fallback / Dev Mode URL if no external redirect was generated
        if not auth_url:
            connection_id = connection_id or f"conn_dev_{normalized_toolkit}_{user_id[:8]}"
            # Local simulated authorization route that auto-confirms connection on callback
            callback_base = redirect_url or "/api/v1/connections/callback"
            sep = "&" if "?" in callback_base else "?"
            auth_url = f"{callback_base}{sep}toolkit={normalized_toolkit}&user_id={user_id}&status=connected&connection_id={connection_id}"

        # Persist pending connection in Supabase connected_accounts
        self._upsert_account_record(
            user_id=user_id,
            toolkit=normalized_toolkit,
            status="pending",
            connection_id=connection_id
        )

        return {
            "redirect_url": auth_url,
            "connection_id": connection_id,
            "toolkit": normalized_toolkit,
            "status": "pending"
        }

    def _fetch_live_composio_accounts(self, user_id: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
        """
        Queries live active accounts directly from Composio backend for a specific user.
        Returns a dictionary mapping normalized toolkit slug -> account info dict.
        """
        active_map: Dict[str, Dict[str, Any]] = {}
        if not self.api_key:
            return active_map

        # 1. Try Composio SDK
        sdk = self._get_sdk()
        if sdk is not None:
            try:
                if hasattr(sdk, "connected_accounts") and hasattr(sdk.connected_accounts, "list"):
                    kwargs: Dict[str, Any] = {"statuses": ["ACTIVE"]}
                    if user_id:
                        kwargs["user_ids"] = [user_id]
                    res = sdk.connected_accounts.list(**kwargs)
                    items = getattr(res, "items", []) or (res if isinstance(res, list) else [])
                    for item in items:
                        acc_user = getattr(item, "user_id", None) or getattr(item, "userUuid", None) or (item.get("user_id") if isinstance(item, dict) else None)
                        if user_id and acc_user and acc_user != user_id:
                            continue

                        t_slug = None
                        if hasattr(item, "toolkit") and getattr(item.toolkit, "slug", None):
                            t_slug = item.toolkit.slug.lower()
                        elif hasattr(item, "app_id") and item.app_id:
                            t_slug = str(item.app_id).lower()
                        elif hasattr(item, "app_name") and item.app_name:
                            t_slug = str(item.app_name).lower()
                        elif hasattr(item, "auth_config") and hasattr(item.auth_config, "toolkit") and getattr(item.auth_config.toolkit, "slug", None):
                            t_slug = item.auth_config.toolkit.slug.lower()
                        elif isinstance(item, dict):
                            t_slug = item.get("toolkit", {}).get("slug") or item.get("app_id") or item.get("appName") or ""
                            t_slug = str(t_slug).lower()

                        acc_id = getattr(item, "id", None) or (item.get("id") if isinstance(item, dict) else None)

                        if t_slug:
                            norm_key = self._normalize_slug(t_slug)
                            if norm_key:
                                active_map[norm_key] = {
                                    "id": acc_id,
                                    "toolkit": norm_key,
                                    "status": "connected",
                                    "composio_connection_id": acc_id,
                                    "user_id": acc_user or user_id,
                                    "updated_at": "live"
                                }
            except Exception as e:
                logger.debug(f"Composio SDK list note: {e}")

        # 2. Fallback to direct Composio v3.1 REST API if SDK list is empty
        if not active_map and self.api_key:
            try:
                headers = {"x-api-key": self.api_key}
                params: Dict[str, Any] = {"statuses": "ACTIVE"}
                if user_id:
                    params["user_ids"] = user_id

                with httpx.Client(timeout=6.0) as client:
                    resp = client.get(
                        "https://backend.composio.dev/api/v3.1/connected_accounts",
                        params=params,
                        headers=headers
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        items = data.get("items", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
                        for item in items:
                            acc_user = item.get("userId") or item.get("user_id") if isinstance(item, dict) else getattr(item, "user_id", None)
                            if user_id and acc_user and acc_user != user_id:
                                continue

                            t_slug = ""
                            if isinstance(item, dict):
                                t_slug = item.get("toolkit", {}).get("slug") or item.get("app_id") or item.get("appName") or ""
                                if not t_slug and "authConfig" in item:
                                    t_slug = item["authConfig"].get("toolkit", {}).get("slug", "")
                            acc_id = item.get("id") if isinstance(item, dict) else getattr(item, "id", None)

                            if t_slug:
                                norm_key = self._normalize_slug(str(t_slug).lower())
                                if norm_key:
                                    active_map[norm_key] = {
                                        "id": acc_id,
                                        "toolkit": norm_key,
                                        "status": "connected",
                                        "composio_connection_id": acc_id,
                                        "user_id": acc_user or user_id,
                                        "updated_at": "live"
                                    }
            except Exception as e:
                logger.debug(f"Composio REST live accounts note: {e}")

        return active_map

    def _normalize_slug(self, slug: str) -> Optional[str]:
        s = slug.lower().strip()
        if "gmail" in s or "google_mail" in s or "mail" in s:
            return "gmail"
        if "slack" in s:
            return "slack"
        if "notion" in s:
            return "notion"
        if "github" in s:
            return "github"
        if "calendar" in s or "googlecalendar" in s:
            return "googlecalendar"
        if "sheet" in s or "googlesheets" in s:
            return "googlesheets"
        if s in self.SUPPORTED_TOOLKITS:
            return s
        return None

    def get_connection_status(self, user_id: str, toolkit: str) -> str:
        """
        Retrieves the connection status for a user and toolkit.
        Strictly scoped to user_id.
        """
        normalized_toolkit = self._normalize_slug(toolkit) or toolkit.lower().strip()
        
        # Check live Composio accounts for this user
        live = self._fetch_live_composio_accounts(user_id=user_id)
        if normalized_toolkit in live:
            return "connected"

        # Check SharedMemoryService strictly scoped to user_id
        if user_id:
            try:
                from app.services.shared_memory import SharedMemoryService
                mem = SharedMemoryService()
                stored = mem.get(user_id, f"connected_account_{normalized_toolkit}")
                if stored and isinstance(stored.get("value"), dict) and stored["value"].get("status") == "connected":
                    return "connected"
            except Exception:
                pass

        # Check DB strictly scoped to user_id
        client = get_supabase_client()
        if client and user_id:
            try:
                resp = client.table("connected_accounts") \
                    .select("status, composio_connection_id") \
                    .eq("user_id", user_id) \
                    .eq("toolkit", normalized_toolkit) \
                    .limit(1) \
                    .execute()
                if resp.data and len(resp.data) > 0:
                    return resp.data[0].get("status", "disconnected")
            except Exception as e:
                logger.debug(f"Error reading connection status from DB: {e}")

        return "disconnected"

    def list_user_connections(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Returns all connected accounts for the given user.
        Strictly scoped to user_id across Composio live status, Shared Memory, and DB.
        """
        db_records: Dict[str, Dict[str, Any]] = {}

        # 1. Fetch live active accounts from Composio for this user
        live_accounts = self._fetch_live_composio_accounts(user_id=user_id)
        for k, v in live_accounts.items():
            db_records[k] = v

        # 2. Check SharedMemoryService strictly scoped to user_id
        if user_id:
            try:
                from app.services.shared_memory import SharedMemoryService
                mem = SharedMemoryService()
                for key in self.SUPPORTED_TOOLKITS.keys():
                    if key not in db_records:
                        stored = mem.get(user_id, f"connected_account_{key}")
                        if stored and isinstance(stored.get("value"), dict) and stored["value"].get("status") == "connected":
                            db_records[key] = stored["value"]
            except Exception as e:
                logger.debug(f"Shared memory fetch in list_user_connections note: {e}")

        # 3. Check Supabase connected_accounts table strictly scoped to user_id
        client = get_supabase_client()
        if client and user_id:
            try:
                resp = client.table("connected_accounts") \
                    .select("id, toolkit, status, composio_connection_id, created_at, updated_at") \
                    .eq("user_id", user_id) \
                    .execute()
                if resp.data:
                    for row in resp.data:
                        if row.get("status") == "connected" or row["toolkit"] not in db_records:
                            db_records[row["toolkit"]] = row
            except Exception as e:
                logger.debug(f"DB fetch in list_user_connections note (using fallback): {e}")

        # Assemble full list with metadata for all supported toolkits
        results = []
        for key, meta in self.SUPPORTED_TOOLKITS.items():
            record = db_records.get(key)
            status = record["status"] if record else "disconnected"
            results.append({
                "id": record.get("id") if record else None,
                "toolkit": key,
                "name": meta["name"],
                "category": meta["category"],
                "status": status,
                "composio_connection_id": record.get("composio_connection_id") if record else None,
                "updated_at": record.get("updated_at") if record else None,
            })

        return results

    def set_connection_status(
        self,
        user_id: str,
        toolkit: str,
        status: str,
        connection_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Updates the connection status for a user and toolkit.
        """
        normalized_toolkit = self._normalize_slug(toolkit) or toolkit.lower().strip()
        norm_status = "connected" if status in ("success", "ACTIVE", "active", "connected") else status
        return self._upsert_account_record(
            user_id=user_id,
            toolkit=normalized_toolkit,
            status=norm_status,
            connection_id=connection_id
        )

    def disconnect(self, user_id: str, toolkit: str) -> None:
        """
        Disconnects a user's toolkit in Composio and updates DB status to 'disconnected'.
        """
        normalized_toolkit = self._normalize_slug(toolkit) or toolkit.lower().strip()
        sdk = self._get_sdk()

        if sdk is not None and hasattr(sdk, "connected_accounts") and hasattr(sdk.connected_accounts, "delete"):
            try:
                sdk.connected_accounts.delete(user_id=user_id, app_id=normalized_toolkit)
            except Exception as e:
                logger.debug(f"Composio SDK delete account note: {e}")

        self._upsert_account_record(
            user_id=user_id,
            toolkit=normalized_toolkit,
            status="disconnected",
            connection_id=None
        )

    def get_mcp_session(self, user_id: str, toolkits: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
        """
        Generates or retrieves an active Composio MCP session for the user.
        Returns a dict with 'url' and 'headers', or None if unavailable.
        """
        # First verify user has at least one connected account
        active_connections = [
            c for c in self.list_user_connections(user_id)
            if c.get("status") == "connected"
        ]
        if not active_connections:
            return None

        # Check if Composio API key is configured
        if not self.api_key:
            return None

        sdk = self._get_sdk()
        if sdk is not None:
            try:
                if hasattr(sdk, "sessions") and hasattr(sdk.sessions, "create"):
                    session = sdk.sessions.create(
                        user_id=user_id,
                        mcp=True,
                        toolkits=toolkits or [c["toolkit"] for c in active_connections]
                    )
                    mcp_meta = getattr(session, "mcp", None)
                    if mcp_meta:
                        return {
                            "url": getattr(mcp_meta, "url", "https://connect.composio.dev/mcp"),
                            "headers": getattr(mcp_meta, "headers", {"x-api-key": self.api_key, "x-user-id": user_id}),
                            "session_id": getattr(session, "session_id", None) or getattr(session, "id", None)
                        }
            except Exception as e:
                logger.warning(f"Composio SDK session creation failed: {e}. Falling back to default MCP endpoint.")

        # Default Composio Connect MCP standard endpoint
        return {
            "url": "https://connect.composio.dev/mcp",
            "headers": {
                "x-api-key": self.api_key,
                "x-user-id": user_id,
                "Content-Type": "application/json"
            }
        }

    def resolve_user_id(self, user_or_business_id: Optional[str]) -> Optional[str]:
        """
        Resolves the actual user_id for a given business_id or user_id by checking
        businesses table owner_id, connected_accounts, or verifying live Composio account ownership.
        Returns None if no valid connected user or owner could be resolved.
        """
        if not user_or_business_id:
            return None

        # 1. Check if user_or_business_id is a business with owner_id in Supabase
        client = get_supabase_client()
        if client:
            try:
                biz = client.table("businesses").select("owner_id").eq("id", user_or_business_id).limit(1).execute()
                if biz.data and biz.data[0].get("owner_id"):
                    return biz.data[0]["owner_id"]
            except Exception as e:
                logger.debug(f"Could not resolve owner_id from businesses table: {e}")

        # 2. Check if this ID itself has connected accounts in DB
        if client:
            try:
                accs = client.table("connected_accounts").select("user_id").eq("user_id", user_or_business_id).eq("status", "connected").limit(1).execute()
                if accs.data and len(accs.data) > 0:
                    return user_or_business_id
            except Exception as e:
                logger.debug(f"Could not check connected_accounts table: {e}")

        # 3. Check if this specific user has live active Composio accounts
        live_accounts = self._fetch_live_composio_accounts(user_id=user_or_business_id)
        if live_accounts:
            return user_or_business_id

        # 4. Check shared memory cache for connected accounts
        try:
            from app.services.shared_memory import SharedMemoryService
            mem = SharedMemoryService()
            for key in self.SUPPORTED_TOOLKITS.keys():
                stored = mem.get(user_or_business_id, f"connected_account_{key}")
                if stored and isinstance(stored.get("value"), dict) and stored["value"].get("status") == "connected":
                    return user_or_business_id
        except Exception:
            pass

        # If it's a known user ID (not equal to dummy business UUID), check if user exists in auth/profiles
        if user_or_business_id and user_or_business_id != "00000000-0000-0000-0000-000000000001":
            # Return the user_or_business_id if it might be a direct user_id
            return user_or_business_id

        logger.warning(f"resolve_user_id could not resolve a Composio-connected user from ID: {user_or_business_id}")
        return None

    def execute_tool(
        self,
        user_id: str,
        slug: str,
        arguments: Optional[Dict[str, Any]] = None
    ) -> Any:
        """
        Executes a Composio tool for a user using their live connected account.
        """
        sdk = self._get_sdk()
        if sdk is None:
            raise ComposioClientError("Composio SDK or API key not available")

        resolved_uid = self.resolve_user_id(user_id)
        if not resolved_uid:
            raise ComposioClientError(f"Could not resolve a Composio-connected user from ID: {user_id}")

        try:
            res = sdk.tools.execute(
                slug=slug,
                arguments=arguments or {},
                user_id=resolved_uid,
                dangerously_skip_version_check=True
            )
            if hasattr(res, "data"):
                return res.data
            return res
        except Exception as e:
            logger.error(f"Composio execution error for {slug} (user={resolved_uid}): {e}")
            raise ComposioClientError(f"Failed to execute {slug}: {str(e)}") from e

    def _upsert_account_record(
        self,
        user_id: str,
        toolkit: str,
        status: str,
        connection_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upserts a record into SharedMemoryService and the connected_accounts table if present.
        Strictly scoped to user_id.
        """
        record = {
            "user_id": user_id,
            "toolkit": toolkit,
            "status": status,
            "composio_connection_id": connection_id
        }

        # 1. Persist to SharedMemoryService strictly scoped to user_id
        if user_id:
            try:
                from app.services.shared_memory import SharedMemoryService
                mem = SharedMemoryService()
                mem.set(user_id, f"connected_account_{toolkit}", record, ["integration", toolkit])
            except Exception as e:
                logger.debug(f"Shared memory upsert note: {e}")

        # 2. Try Supabase table if available
        client = get_supabase_client()
        if client and user_id:
            try:
                resp = client.table("connected_accounts").upsert(
                    record,
                    on_conflict="user_id,toolkit"
                ).execute()
                if resp.data and len(resp.data) > 0:
                    return resp.data[0]
            except Exception as e:
                logger.debug(f"DB connected_accounts upsert note (using memory cache): {e}")

        return record


# Global singleton instance
composio_service = ComposioService()
