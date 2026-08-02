import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.services.shared_memory import SharedMemoryService
from app.services.document_processor import DocumentProcessor

logger = logging.getLogger(__name__)

router = APIRouter()
memory_service = SharedMemoryService()

DEFAULT_BUSINESS_ID = "00000000-0000-0000-0000-000000000001"

class SetMemoryRequest(BaseModel):
    key: str
    value: Any
    tags: Optional[List[str]] = []

class SearchRequest(BaseModel):
    query: str
    category: Optional[str] = None

# --- Key-Value Memory Endpoints ---

@router.get("")
@router.get("/")
def get_memory(user = Depends(get_current_user)):
    """Fetches all shared key-value memory entries."""
    try:
        business_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
        return memory_service.list_all(str(business_id))
    except Exception as e:
        logger.error(f"Error fetching memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
@router.post("/")
def set_memory(request: SetMemoryRequest, user = Depends(get_current_user)):
    """Sets or updates a shared memory key-value entry."""
    try:
        business_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
        author = getattr(user, "name", "Founder") or "Founder"
        return memory_service.set(
            business_id=str(business_id),
            key=request.key,
            value=request.value,
            tags=request.tags or [],
            updated_by=author
        )
    except Exception as e:
        logger.error(f"Error setting memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Document & Knowledge Base Endpoints ---

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    user = Depends(get_current_user)
):
    """
    Uploads and processes a document (PDF, CSV, Markdown/Notion export, Text, JSON).
    Extracts text, metadata, generates summaries, and indexes in Shared Memory.
    """
    try:
        business_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
        author = getattr(user, "name", "Founder") or "Founder"

        # Read file contents
        content_bytes = await file.read()
        filename = file.filename or "uploaded_document"

        # Process document
        processed_data = DocumentProcessor.process_file(
            filename=filename,
            file_bytes=content_bytes,
            category=category
        )

        if title:
            processed_data["title"] = title

        # Save to knowledge base
        saved_doc = memory_service.save_document(
            business_id=str(business_id),
            doc_data=processed_data,
            author=author
        )

        return {
            "status": "success",
            "message": f"Document '{filename}' successfully processed and stored in knowledge base.",
            "document": saved_doc
        }
    except Exception as e:
        logger.error(f"Error uploading and processing document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@router.get("/documents")
def list_documents(
    category: Optional[str] = None,
    user = Depends(get_current_user)
):
    """Lists all processed knowledge documents."""
    try:
        business_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
        return memory_service.list_documents(str(business_id), category=category)
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents/{doc_id}")
def get_document(
    doc_id: str,
    user = Depends(get_current_user)
):
    """Retrieves full content and metadata for a specific knowledge document."""
    try:
        business_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
        doc = memory_service.get_document(str(business_id), doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        return doc
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving document {doc_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: str,
    user = Depends(get_current_user)
):
    """Deletes a document from the knowledge base."""
    try:
        business_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
        success = memory_service.delete_document(str(business_id), doc_id)
        if not success:
            raise HTTPException(status_code=404, detail="Document not found or already removed.")
        return {"status": "success", "message": f"Document {doc_id} removed."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {doc_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search")
def search_knowledge(
    request: SearchRequest,
    user = Depends(get_current_user)
):
    """Searches across both processed documents and shared memory keys."""
    try:
        business_id = getattr(user, "business_id", DEFAULT_BUSINESS_ID) or DEFAULT_BUSINESS_ID
        results = memory_service.search_knowledge(
            business_id=str(business_id),
            query=request.query,
            category=request.category
        )
        return {"query": request.query, "results": results}
    except Exception as e:
        logger.error(f"Error searching knowledge base: {e}")
        raise HTTPException(status_code=500, detail=str(e))
