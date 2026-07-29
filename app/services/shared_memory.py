import logging
from typing import Any, Optional, List
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

class SharedMemoryService:
    def __init__(self, supabase_client: Optional[Client] = None):
        if supabase_client:
            self.client = supabase_client
        else:
            if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set to use SharedMemoryService")
            self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            
    def get(self, business_id: str, key: str) -> Optional[dict[str, Any]]:
        """
        Fetch a specific key from shared memory for a business.
        """
        try:
            response = self.client.table("shared_memory")\
                .select("*")\
                .eq("business_id", business_id)\
                .eq("key", key)\
                .execute()
                
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching shared memory for business {business_id}, key {key}: {e}")
            raise e

    def set(self, business_id: str, key: str, value: Any, tags: List[str] = []) -> dict[str, Any]:
        """
        Insert or update a key in shared memory. 
        Note: Supabase standard `upsert` requires a unique constraint on (business_id, key). 
        Since we didn't define a unique constraint, we will do a manual check or rely on the primary key.
        We'll do a get-then-update/insert.
        """
        try:
            existing = self.get(business_id, key)
            
            data = {
                "business_id": business_id,
                "key": key,
                "value": value,
                "tags": tags
            }
            
            if existing:
                # Update existing record
                response = self.client.table("shared_memory")\
                    .update(data)\
                    .eq("id", existing["id"])\
                    .execute()
            else:
                # Insert new record
                response = self.client.table("shared_memory")\
                    .insert(data)\
                    .execute()
                    
            return response.data[0] if response.data else {}
        except Exception as e:
            logger.error(f"Error setting shared memory for business {business_id}, key {key}: {e}")
            raise e

    def delete(self, business_id: str, key: str) -> bool:
        """
        Delete a key from shared memory.
        """
        try:
            response = self.client.table("shared_memory")\
                .delete()\
                .eq("business_id", business_id)\
                .eq("key", key)\
                .execute()
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"Error deleting shared memory for business {business_id}, key {key}: {e}")
            raise e

    def list_by_tags(self, business_id: str, tags: List[str]) -> List[dict[str, Any]]:
        """
        List shared memory items containing the specified tags.
        """
        try:
            response = self.client.table("shared_memory")\
                .select("*")\
                .eq("business_id", business_id)\
                .contains("tags", tags)\
                .execute()
            return response.data
        except Exception as e:
            logger.error(f"Error listing shared memory by tags for business {business_id}: {e}")
            raise e

    def set_flag(self, business_id: str, flag_name: str, value: bool) -> dict[str, Any]:
        """
        Sets a boolean flag in shared memory.
        """
        key = f"flag:{flag_name}"
        return self.set(business_id=business_id, key=key, value=value, tags=["flag"])

    def get_flags(self, business_id: str) -> List[dict[str, Any]]:
        """
        Returns all flags set for a business.
        """
        return self.list_by_tags(business_id, ["flag"])

# Example Usage
if __name__ == "__main__":
    # Ensure env variables are loaded (e.g., via dotenv)
    # import os
    # os.environ["SUPABASE_URL"] = "http://localhost:8000"
    # os.environ["SUPABASE_KEY"] = "your_service_role_key"
    
    # Initialize the service
    try:
        memory_service = SharedMemoryService()
        
        # Test business_id
        test_business_id = "11111111-1111-1111-1111-111111111111"
        
        # 1. Set a standard value
        print("Setting 'agent_context'...")
        memory_service.set(
            business_id=test_business_id,
            key="agent_context",
            value={"theme": "dark", "instructions": "Be polite"},
            tags=["context", "ui"]
        )
        
        # 2. Get a standard value
        print("Getting 'agent_context'...")
        val = memory_service.get(test_business_id, "agent_context")
        print(f"Value: {val}")
        
        # 3. Set a flag
        print("Setting 'maintenance_mode' flag to True...")
        memory_service.set_flag(test_business_id, "maintenance_mode", True)
        
        # 4. Get flags (Detect changes via polling)
        print("Getting all flags...")
        flags = memory_service.get_flags(test_business_id)
        print(f"Flags: {flags}")
        
        # 5. List by tags
        print("Listing by tag 'ui'...")
        ui_elements = memory_service.list_by_tags(test_business_id, ["ui"])
        print(f"UI Elements: {ui_elements}")
        
        # 6. Delete
        print("Deleting 'agent_context'...")
        memory_service.delete(test_business_id, "agent_context")
        
    except Exception as e:
        print(f"Example execution failed. Note: A valid Supabase instance must be running. Error: {e}")
