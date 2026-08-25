import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Optional, List, Dict

try:
    from supabase._sync.client import create_client, Client
except ImportError:
    try:
        from supabase import create_client, Client
    except Exception:
        create_client = None
        Client = Any

from app.core.config import settings

logger = logging.getLogger(__name__)

def _normalize_business_id(business_id: Optional[str]) -> str:
    """Ensure business_id is a valid UUID string to prevent Postgres 22P02 errors."""
    if not business_id:
        return "00000000-0000-0000-0000-000000000001"
    try:
        uuid.UUID(str(business_id))
        return str(business_id)
    except (ValueError, TypeError, AttributeError):
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(business_id)))


class SharedMemoryService:
    """
    Central Shared Memory & Knowledge Base Service for Company OS.
    Provides persistence for both key-value runtime state and parsed knowledge documents
    (Brand Guidelines, Financial Reports, Product Docs, Customer Personas).
    """

    # In-memory storage cache as fallback/local dev buffer (shared across instances)
    _local_kv: Dict[str, Dict[str, Any]] = {}
    _local_docs: Dict[str, Dict[str, Any]] = {}

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
                logger.warning(f"Could not connect to Supabase client: {e}. Operating in memory-backed mode.")
        return None

    def _sanitize_value(self, val: Any) -> Any:
        """Safely trims excessively large strings or collections to avoid Postgres 22023 payload limits."""
        if isinstance(val, str):
            if len(val) > 40000:
                return val[:40000] + "... [truncated for storage limits]"
            return val
        if isinstance(val, list):
            return [self._sanitize_value(x) for x in val[-20:]]
        if isinstance(val, dict):
            return {k: self._sanitize_value(v) for k, v in val.items()}
        return val

    def get(self, business_id: str, key: str) -> Optional[dict[str, Any]]:
        """
        Fetch a specific key from shared memory for a business.
        """
        norm_biz_id = _normalize_business_id(business_id)
        try:
            if self.client:
                response = self.client.table("shared_memory")\
                    .select("*")\
                    .eq("business_id", norm_biz_id)\
                    .eq("key", key)\
                    .execute()
                    
                if response.data and isinstance(response.data, list) and len(response.data) > 0 and isinstance(response.data[0], dict):
                    return response.data[0]
        except Exception as e:
            logger.warning(f"Supabase read fallback for key '{key}': {e}")

        # Local fallback (check normalized and raw keys)
        local_key = f"{norm_biz_id}:{key}"
        raw_key = f"{business_id}:{key}"
        return self._local_kv.get(local_key) or self._local_kv.get(raw_key)

    def set(self, business_id: str, key: str, value: Any, tags: List[str] = [], updated_by: Optional[str] = None) -> dict[str, Any]:
        """
        Insert or update a key in shared memory.
        """
        norm_biz_id = _normalize_business_id(business_id)
        clean_value = self._sanitize_value(value)
        now_iso = datetime.now(timezone.utc).isoformat()
        record = {
            "id": str(uuid.uuid4()),
            "business_id": norm_biz_id,
            "key": key,
            "value": clean_value,
            "tags": tags,
            "updated_by": updated_by or "System",
            "created_at": now_iso,
            "updated_at": now_iso
        }

        try:
            if self.client:
                existing = self.get(norm_biz_id, key)
                data = {
                    "business_id": norm_biz_id,
                    "key": key,
                    "value": clean_value,
                    "tags": tags
                }
                if existing and isinstance(existing, dict) and "id" in existing:
                    response = self.client.table("shared_memory")\
                        .update(data)\
                        .eq("id", existing["id"])\
                        .execute()
                else:
                    response = self.client.table("shared_memory")\
                        .insert(data)\
                        .execute()
                if response.data and isinstance(response.data, list) and len(response.data) > 0 and isinstance(response.data[0], dict):
                    record = response.data[0]
        except Exception as e:
            logger.warning(f"Supabase write fallback for key '{key}': {e}")

        # Cache locally
        local_key = f"{norm_biz_id}:{key}"
        self._local_kv[local_key] = record

        # Emit Memory Updated audit event for the Company Feed
        try:
            from app.services.task_service import TaskService
            ts = TaskService()
            
            trigger_msgs = []
            if isinstance(value, dict):
                if "messages" in value and isinstance(value["messages"], list):
                    trigger_msgs = [str(m) for m in value["messages"][:3]]
                elif "context" in value:
                    trigger_msgs = [str(value["context"])[:160]]
                elif "summary" in value:
                    trigger_msgs = [str(value["summary"])[:160]]
                elif "thought" in value or "text" in value:
                    trigger_msgs = [str(value.get("thought") or value.get("text"))[:160]]
                elif "brand_voice" in value:
                    trigger_msgs = [str(value.get("brand_voice"))[:160]]
                else:
                    trigger_msgs = [f"Context stored for key: {key}"]
            elif isinstance(value, list):
                trigger_msgs = [str(item)[:120] for item in value[:2]]
            elif isinstance(value, str):
                trigger_msgs = [value[:160]]
            else:
                trigger_msgs = [f"Updated memory state for {key}"]
                
            agent_label = updated_by or "Personal Assistant"
            ts.log_audit_event(
                business_id=business_id,
                role=agent_label,
                agent_name=agent_label,
                trust_tier="operate",
                mandate=f"Updated shared memory key: {key}",
                action="Memory Updated",
                details={
                    "agent_id": business_id,
                    "agent_name": agent_label,
                    "role": agent_label,
                    "memory_key": key,
                    "trigger_messages": trigger_msgs,
                    "summary": f"Context updated for {key}"
                },
                shared_memory_refs=[key]
            )
        except Exception as audit_err:
            logger.debug(f"Memory update audit event skipped: {audit_err}")

        return record

    def delete(self, business_id: str, key: str) -> bool:
        """
        Delete a key from shared memory.
        """
        norm_biz_id = _normalize_business_id(business_id)
        deleted = False
        try:
            if self.client:
                response = self.client.table("shared_memory")\
                    .delete()\
                    .eq("business_id", norm_biz_id)\
                    .eq("key", key)\
                    .execute()
                deleted = len(response.data) > 0
        except Exception as e:
            logger.warning(f"Supabase delete fallback for key '{key}': {e}")

        local_key = f"{norm_biz_id}:{key}"
        raw_key = f"{business_id}:{key}"
        if local_key in self._local_kv or raw_key in self._local_kv:
            self._local_kv.pop(local_key, None)
            self._local_kv.pop(raw_key, None)
            deleted = True
            
        return deleted

    def list_all(self, business_id: str) -> List[dict[str, Any]]:
        """
        List all key-value shared memory items for a business.
        """
        norm_biz_id = _normalize_business_id(business_id)
        results: List[dict[str, Any]] = []
        try:
            if self.client:
                response = self.client.table("shared_memory")\
                    .select("*")\
                    .eq("business_id", norm_biz_id)\
                    .execute()
                if response.data and isinstance(response.data, list) and all(isinstance(item, dict) for item in response.data):
                    results = response.data
        except Exception as e:
            logger.warning(f"Supabase list fallback: {e}")

        # Merge local entries
        local_items = [v for k, v in self._local_kv.items() if (k.startswith(f"{norm_biz_id}:") or k.startswith(f"{business_id}:")) and isinstance(v, dict)]
        seen_keys = {item.get("key") for item in results if isinstance(item, dict)}
        for item in local_items:
            if isinstance(item, dict) and item.get("key") not in seen_keys:
                results.append(item)

        # Default foundational memory seed if empty
        if not results:
            defaults = [
                {
                    "id": "mem-1",
                    "business_id": business_id,
                    "key": "company_mission",
                    "value": "Autonomous AI workforce platform delivering 10x leverage with earned trust governance.",
                    "tags": ["strategy", "mission"],
                    "updated_by": "Founder",
                    "created_at": datetime.now(timezone.utc).isoformat()
                },
                {
                    "id": "mem-2",
                    "business_id": business_id,
                    "key": "brand_voice_tone",
                    "value": "Sophisticated, authoritative, concise, data-driven, and forward-leaning.",
                    "tags": ["brand", "marketing"],
                    "updated_by": "Growth Marketer",
                    "created_at": datetime.now(timezone.utc).isoformat()
                },
                {
                    "id": "mem-3",
                    "business_id": business_id,
                    "key": "brand guidelines",
                    "value": "We are a fun, professional, and slightly sarcastic tech company. We use emojis and keep things brief. Brand Guidelines 2026: Always prioritize clarity over jargon. Target audience: Founders and Builders.",
                    "tags": ["brand", "marketing", "guidelines"],
                    "updated_by": "System",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            ]
            results.extend(defaults)
            for d in defaults:
                self._local_kv[f"{business_id}:{d['key']}"] = d

        return results

    def list_by_business(self, business_id: str) -> List[dict[str, Any]]:
        """List all key-value shared memory items for a specific business."""
        return self.list_all(business_id=business_id)

    def list_by_tags(self, business_id: str, tags: List[str]) -> List[dict[str, Any]]:
        """
        List shared memory items containing the specified tags.
        """
        all_items = self.list_all(business_id)
        tag_set = set(tags)
        return [
            item for item in all_items 
            if any(t in (item.get("tags") or []) for t in tag_set)
        ]

    # --- Knowledge Base & Document Storage Methods ---

    def save_document(
        self,
        business_id: str,
        doc_data: Dict[str, Any],
        author: str = "Founder"
    ) -> Dict[str, Any]:
        """
        Stores a processed knowledge document and updates the global knowledge index.
        """
        doc_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        document_record = {
            "id": doc_id,
            "business_id": business_id,
            "title": doc_data.get("title") or doc_data.get("filename") or "Untitled Knowledge Document",
            "category": doc_data.get("category", "General Knowledge"),
            "filename": doc_data.get("filename", "document.txt"),
            "file_type": doc_data.get("file_type", "txt"),
            "file_size_bytes": doc_data.get("file_size_bytes", 0),
            "summary": doc_data.get("summary", ""),
            "content": doc_data.get("content", ""),
            "chunks": doc_data.get("chunks", []),
            "metadata": doc_data.get("metadata", {}),
            "created_at": now_iso,
            "updated_at": now_iso,
            "author": author
        }

        # 1. Save in document store
        local_doc_key = f"{business_id}:{doc_id}"
        self._local_docs[local_doc_key] = document_record

        # 2. Store summary in key-value shared memory for quick agent awareness
        kv_key = f"knowledge:{document_record['category'].lower().replace(' ', '_')}:{doc_id[:8]}"
        self.set(
            business_id=business_id,
            key=kv_key,
            value={
                "doc_id": doc_id,
                "title": document_record["title"],
                "category": document_record["category"],
                "filename": document_record["filename"],
                "summary": document_record["summary"],
                "file_type": document_record["file_type"]
            },
            tags=["knowledge_base", document_record["category"].lower().replace(" ", "_"), document_record["file_type"]],
            updated_by=author
        )

        # 3. Update global catalog index
        catalog = self.get(business_id, "knowledge_catalog")
        catalog_items = catalog.get("value", []) if catalog and isinstance(catalog.get("value"), list) else []
        catalog_items.append({
            "id": doc_id,
            "title": document_record["title"],
            "category": document_record["category"],
            "filename": document_record["filename"],
            "summary": document_record["summary"],
            "created_at": now_iso
        })
        self.set(
            business_id=business_id,
            key="knowledge_catalog",
            value=catalog_items,
            tags=["catalog", "system"],
            updated_by="System"
        )

        return document_record

    def get_document(self, business_id: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a document by its ID.
        """
        local_doc_key = f"{business_id}:{doc_id}"
        return self._local_docs.get(local_doc_key)

    def list_documents(self, business_id: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Lists all processed knowledge documents for a business, optionally filtered by category.
        """
        docs = [v for k, v in self._local_docs.items() if k.startswith(f"{business_id}:")]
        
        # Sort by creation date descending
        docs.sort(key=lambda x: x.get("created_at", ""), reverse=True)

        if category and category != "all":
            docs = [d for d in docs if d.get("category", "").lower() == category.lower()]
            
        return docs

    def delete_document(self, business_id: str, doc_id: str) -> bool:
        """
        Removes a document and updates the knowledge index.
        """
        local_doc_key = f"{business_id}:{doc_id}"
        if local_doc_key in self._local_docs:
            del self._local_docs[local_doc_key]
            
            # Remove from catalog
            catalog = self.get(business_id, "knowledge_catalog")
            if catalog and isinstance(catalog.get("value"), list):
                updated_items = [item for item in catalog["value"] if item.get("id") != doc_id]
                self.set(
                    business_id=business_id,
                    key="knowledge_catalog",
                    value=updated_items,
                    tags=["catalog", "system"],
                    updated_by="System"
                )
            return True
        return False

    def search_knowledge(
        self,
        business_id: str,
        query: str,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Keyword and content search across knowledge documents and memory records.
        """
        query_terms = query.lower().split()
        results: List[Dict[str, Any]] = []

        # 1. Search Knowledge Documents
        docs = self.list_documents(business_id, category=category)
        for doc in docs:
            match_score = 0
            text_to_search = f"{doc.get('title', '')} {doc.get('category', '')} {doc.get('summary', '')} {doc.get('content', '')}".lower()
            
            for term in query_terms:
                if term in text_to_search:
                    match_score += text_to_search.count(term)
            
            if match_score > 0:
                results.append({
                    "type": "document",
                    "id": doc["id"],
                    "title": doc["title"],
                    "category": doc["category"],
                    "filename": doc["filename"],
                    "summary": doc["summary"],
                    "match_score": match_score,
                    "snippet": doc["summary"]
                })

        # 2. Search Shared Memory Key-Values
        memories = self.list_all(business_id)
        for mem in memories:
            if mem.get("key") == "knowledge_catalog":
                continue
            key_str = str(mem.get("key", "")).lower()
            val_str = str(mem.get("value", "")).lower()
            combined = f"{key_str} {val_str}"
            
            match_score = sum(combined.count(term) for term in query_terms if term in combined)
            if match_score > 0:
                results.append({
                    "type": "memory",
                    "id": mem.get("id"),
                    "key": mem.get("key"),
                    "category": "Shared Memory",
                    "match_score": match_score,
                    "snippet": str(mem.get("value"))[:200]
                })

        # Sort by relevance score
        results.sort(key=lambda x: x.get("match_score", 0), reverse=True)
        return results

    def clear(self, business_id: str) -> bool:
        """Delete all key-value shared memory entries for a business."""
        keys_to_remove = [k for k in self._local_kv if k.startswith(f"{business_id}:")]
        for k in keys_to_remove:
            self._local_kv.pop(k, None)

        client = self.client
        if client:
            try:
                client.table("shared_memory").delete().eq("business_id", business_id).execute()
            except Exception as e:
                logger.warning(f"Error clearing shared memory in Supabase for business {business_id}: {e}")
        return True

    def get_context(self, business_id: str) -> Dict[str, Any]:
        """Retrieve all key-value context entries as a dictionary for a business."""
        items = self.list_all(business_id=business_id)
        context = {}
        for item in items:
            context[item.get("key", "")] = item.get("value")
        return context


def shared_memory_service():
    """Dependency injection helper for FastAPI."""
    return SharedMemoryService()
