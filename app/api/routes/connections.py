import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from app.api.deps import User, get_current_user
from app.services.composio_client import composio_service, ComposioClientError

logger = logging.getLogger(__name__)

router = APIRouter()


class InitiateConnectionRequest(BaseModel):
    toolkit: str = Field(..., description="The toolkit / app identifier to connect, e.g. 'gmail', 'slack', 'notion', 'github'")
    redirect_url: Optional[str] = Field(None, description="Optional custom frontend callback URL")


class InitiateConnectionResponse(BaseModel):
    redirect_url: str
    connection_id: Optional[str] = None
    toolkit: str
    status: str


class ConnectionItem(BaseModel):
    id: Optional[str] = None
    toolkit: str
    name: str
    category: str
    status: str
    composio_connection_id: Optional[str] = None
    updated_at: Optional[str] = None


class ConnectionsListResponse(BaseModel):
    connections: List[ConnectionItem]
    total_count: int


@router.post("/initiate", response_model=InitiateConnectionResponse)
def initiate_connection(
    req: InitiateConnectionRequest,
    user: User = Depends(get_current_user)
) -> InitiateConnectionResponse:
    """
    Initiate an OAuth connection flow for the authenticated user and specified toolkit.
    Returns the authorization redirect URL.
    """
    try:
        result = composio_service.initiate_connection(
            user_id=user.id,
            toolkit=req.toolkit,
            redirect_url=req.redirect_url
        )
        return InitiateConnectionResponse(**result)
    except Exception as e:
        logger.error(f"Failed to initiate connection for {req.toolkit}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initiate connection: {str(e)}")


@router.get("/callback")
def connection_callback(
    toolkit: str = Query("gmail", description="Toolkit connected"),
    status: str = Query("connected", description="Connection status"),
    connection_id: Optional[str] = Query(None, description="Composio connection ID"),
    user_id: Optional[str] = Query(None, description="User ID for callback verification")
) -> Any:
    """
    OAuth return callback endpoint. Updates the connection status in the database
    and redirects the user back to the frontend integrations dashboard.
    """
    try:
        target_user = user_id or "00000000-0000-0000-0000-000000000000"
        composio_service.set_connection_status(
            user_id=target_user,
            toolkit=toolkit,
            status=status if status in ("connected", "pending", "disconnected") else "connected",
            connection_id=connection_id
        )
        logger.info(f"Connection callback processed for user {target_user}, toolkit {toolkit}: {status}")
    except Exception as e:
        logger.error(f"Error handling connection callback: {e}")

    # Redirect to frontend integrations page with notification parameter
    return RedirectResponse(url=f"/integrations?connected={toolkit}&status={status}", status_code=302)


@router.get("", response_model=ConnectionsListResponse)
def list_connections(
    user: User = Depends(get_current_user)
) -> ConnectionsListResponse:
    """
    List all available toolkits and their connection status for the authenticated user.
    """
    try:
        items = composio_service.list_user_connections(user_id=user.id)
        connection_items = [ConnectionItem(**item) for item in items]
        return ConnectionsListResponse(
            connections=connection_items,
            total_count=len(connection_items)
        )
    except Exception as e:
        logger.error(f"Failed to list connections for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list connections: {str(e)}")


@router.delete("/{toolkit}")
def disconnect_connection(
    toolkit: str,
    user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Disconnect a specific toolkit for the authenticated user.
    """
    try:
        composio_service.disconnect(user_id=user.id, toolkit=toolkit)
        return {"status": "disconnected", "toolkit": toolkit, "message": f"Successfully disconnected {toolkit}."}
    except Exception as e:
        logger.error(f"Failed to disconnect {toolkit} for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to disconnect {toolkit}: {str(e)}")
