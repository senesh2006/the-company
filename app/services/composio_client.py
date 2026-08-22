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

    def get_connection_status(self, user_id: str, toolkit: str) -> str:
        """
        Retrieves the connection status for a user and toolkit.
        """
        normalized_toolkit = toolkit.lower().strip()
        client = get_supabase_client()
        if client:
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
        """
        client = get_supabase_client()
        db_records: Dict[str, Dict[str, Any]] = {}

        if client:
            try:
                resp = client.table("connected_accounts") \
                    .select("id, toolkit, status, composio_connection_id, created_at, updated_at") \
                    .eq("user_id", user_id) \
                    .execute()
                if resp.data:
                    for row in resp.data:
                        db_records[row["toolkit"]] = row
            except Exception as e:
                logger.warning(f"Error fetching connected accounts from DB: {e}")

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
        normalized_toolkit = toolkit.lower().strip()
        return self._upsert_account_record(
            user_id=user_id,
            toolkit=normalized_toolkit,
            status=status,
            connection_id=connection_id
        )

    def disconnect(self, user_id: str, toolkit: str) -> None:
        """
        Disconnects a user's toolkit in Composio and updates DB status to 'disconnected'.
        """
        normalized_toolkit = toolkit.lower().strip()
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

    def resolve_user_id(self, user_or_business_id: Optional[str]) -> str:
        """
        Resolves the actual user_id for a given business_id or user_id by checking
        connected_accounts and businesses tables in Supabase.
        """
        if not user_or_business_id:
            return "00000000-0000-0000-0000-000000000000"
            
        client = get_supabase_client()
        if not client:
            return user_or_business_id

        try:
            # 1. Check if user_or_business_id already has connected_accounts directly
            resp = client.table("connected_accounts").select("user_id").eq("user_id", user_or_business_id).limit(1).execute()
            if resp.data and len(resp.data) > 0:
                return user_or_business_id

            # 2. Check if it's a business ID with an owner_id
            biz = client.table("businesses").select("owner_id").eq("id", user_or_business_id).limit(1).execute()
            if biz.data and biz.data[0].get("owner_id"):
                return biz.data[0]["owner_id"]

            # 3. Fallback: find any connected user in this environment
            any_acc = client.table("connected_accounts").select("user_id").eq("status", "connected").limit(1).execute()
            if any_acc.data and any_acc.data[0].get("user_id"):
                return any_acc.data[0]["user_id"]
        except Exception as e:
            logger.debug(f"Could not resolve user_id for {user_or_business_id}: {e}")

        return user_or_business_id

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
        """Upserts a record into the connected_accounts Supabase table."""
        client = get_supabase_client()
        record = {
            "user_id": user_id,
            "toolkit": toolkit,
            "status": status,
            "composio_connection_id": connection_id
        }

        if client:
            try:
                # Upsert using unique (user_id, toolkit)
                resp = client.table("connected_accounts").upsert(
                    record,
                    on_conflict="user_id,toolkit"
                ).execute()
                if resp.data and len(resp.data) > 0:
                    return resp.data[0]
            except Exception as e:
                logger.warning(f"Could not upsert connected_accounts record in DB: {e}")

        return record


# Global singleton instance
composio_service = ComposioService()
