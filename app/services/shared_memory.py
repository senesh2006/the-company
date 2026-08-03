import logging
from typing import Any, Optional, List
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

class SharedMemoryService:
    _local_store: dict = {}

    def __init__(self, supabase_client: Optional[Client] = None):
        self._client = supabase_client

    @property
    def client(self) -> Optional[Client]:
        if self._client:
            return self._client
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                return self._client
            except Exception as e:
                logger.warning(f"Could not connect to Supabase: {e}")
                return None
        return None
            
    def get(self, business_id: str, key: str) -> Optional[dict[str, Any]]:
        """Fetch a specific key from shared memory for a business."""
        client = self.client
        if client:
            try:
                response = client.table("shared_memory")\
                    .select("*")\
                    .eq("business_id", business_id)\
                    .eq("key", key)\
                    .execute()
                if response.data:
                    return response.data[0]
            except Exception as e:
                logger.warning(f"Error fetching shared memory from Supabase for business {business_id}, key {key}: {e}")
        return self._local_store.get(f"{business_id}:{key}")

    def set(self, business_id: str, key: str, value: Any, tags: List[str] = []) -> dict[str, Any]:
        """Insert or update a key in shared memory."""
        entry = {
            "business_id": business_id,
            "key": key,
            "value": value,
            "tags": tags
        }
        self._local_store[f"{business_id}:{key}"] = entry
        client = self.client
        if client:
            try:
                existing = self.get(business_id, key)
                if existing and "id" in existing:
                    response = client.table("shared_memory")\
                        .update(entry)\
                        .eq("id", existing["id"])\
                        .execute()
                else:
                    response = client.table("shared_memory")\
                        .insert(entry)\
                        .execute()
                if response.data:
                    return response.data[0]
            except Exception as e:
                logger.warning(f"Error setting shared memory in Supabase for business {business_id}, key {key}: {e}")
        return entry

    def delete(self, business_id: str, key: str) -> bool:
        """Delete a key from shared memory."""
        self._local_store.pop(f"{business_id}:{key}", None)
        client = self.client
        if client:
            try:
                response = client.table("shared_memory")\
                    .delete()\
                    .eq("business_id", business_id)\
                    .eq("key", key)\
                    .execute()
                return len(response.data) > 0
            except Exception as e:
                logger.warning(f"Error deleting shared memory in Supabase for business {business_id}, key {key}: {e}")
        return True

    def list_by_tags(self, business_id: str, tags: List[str]) -> List[dict[str, Any]]:
        """List shared memory items containing the specified tags."""
        client = self.client
        if client:
            try:
                response = client.table("shared_memory")\
                    .select("*")\
                    .eq("business_id", business_id)\
                    .contains("tags", tags)\
                    .execute()
                if response.data is not None:
                    return response.data
            except Exception as e:
                logger.warning(f"Error listing shared memory by tags in Supabase for business {business_id}: {e}")
        items = []
        for k, v in self._local_store.items():
            if k.startswith(f"{business_id}:") and any(t in v.get("tags", []) for t in tags):
                items.append(v)
        return items

    def set_flag(self, business_id: str, flag_name: str, value: bool) -> dict[str, Any]:
        """Sets a boolean flag in shared memory."""
        key = f"flag:{flag_name}"
        return self.set(business_id=business_id, key=key, value=value, tags=["flag"])

    def get_flags(self, business_id: str) -> List[dict[str, Any]]:
        """Returns all flags set for a business."""
        return self.list_by_tags(business_id, ["flag"])

    def list_all(self, business_id: Optional[str] = None) -> List[dict[str, Any]]:
        """List all shared memory entries, optionally filtered by business_id."""
        client = self.client
        if client:
            try:
                query = client.table("shared_memory").select("*")
                if business_id:
                    query = query.eq("business_id", business_id)
                response = query.execute()
                if response.data is not None:
                    return response.data
            except Exception as e:
                logger.warning(f"Error listing shared memory in Supabase: {e}")
        items = []
        for k, v in self._local_store.items():
            if not business_id or k.startswith(f"{business_id}:"):
                items.append(v)
        return items

    def list_by_business(self, business_id: str) -> List[dict[str, Any]]:
        """List all shared memory entries for a specific business."""
        return self.list_all(business_id=business_id)

    def clear(self, business_id: str) -> bool:
        """Delete all shared memory entries for a business."""
        keys_to_remove = [k for k in self._local_store if k.startswith(f"{business_id}:")]
        for k in keys_to_remove:
            self._local_store.pop(k, None)
        client = self.client
        if client:
            try:
                client.table("shared_memory")\
                    .delete()\
                    .eq("business_id", business_id)\
                    .execute()
            except Exception as e:
                logger.warning(f"Error clearing shared memory in Supabase for business {business_id}: {e}")
        return True

    def get_context(self, business_id: str) -> dict[str, Any]:
        """Retrieve all key-value context entries as a dictionary for a business."""
        items = self.list_all(business_id=business_id)
        context = {}
        for item in items:
            context[item["key"]] = item.get("value")
        return context
