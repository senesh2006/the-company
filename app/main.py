from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.api.routes import health, agents, tasks, costs, metrics, memory, attention, hierarchy
from app.core.logging import logger
from app.services.event_bus import start_event_bus
from supabase import create_client

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"^https?://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(health.router, prefix=f"{settings.API_V1_STR}", tags=["health"])
app.include_router(agents.router, prefix=f"{settings.API_V1_STR}/agents", tags=["agents"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["tasks"])
app.include_router(costs.router, prefix=f"{settings.API_V1_STR}/costs", tags=["costs"])
app.include_router(metrics.router, prefix=f"{settings.API_V1_STR}/metrics", tags=["metrics"])
app.include_router(memory.router, prefix=f"{settings.API_V1_STR}/memory", tags=["memory"])
app.include_router(attention.router, prefix=f"{settings.API_V1_STR}/attention", tags=["attention"])
app.include_router(hierarchy.router, prefix=f"{settings.API_V1_STR}/hierarchy", tags=["hierarchy"])

from fastapi import Depends
from app.api.deps import get_current_user

@app.get("/api/v1/setup")
def setup_test_environment(user = Depends(get_current_user)):
    """Gets or creates a default business for the authenticated user."""
    import os
    try:
        sb_url = settings.SUPABASE_URL or os.getenv("SUPABASE_URL")
        sb_key = settings.SUPABASE_KEY or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SECRET_KEY")

        biz_id = user.business_id or "default-business-id"
        if not sb_url or not sb_key:
            return {"business_id": biz_id, "warning": "Supabase not configured"}

        client = create_client(sb_url, sb_key)

        # Ensure default agents exist for this user's business
        agents_resp = client.table("agents").select("id, name, role").eq("business_id", biz_id).execute()
        existing_roles = [a["role"] for a in agents_resp.data] if agents_resp.data else []

        default_agents_to_insert = []
        if "Researcher" not in existing_roles:
            default_agents_to_insert.append({"business_id": biz_id, "name": "Alice (Researcher)", "role": "Researcher", "status": "Idle"})
        if "Coder" not in existing_roles:
            default_agents_to_insert.append({"business_id": biz_id, "name": "Bob (Coder)", "role": "Coder", "status": "Idle"})
        if "Accountant" not in existing_roles:
            default_agents_to_insert.append({"business_id": biz_id, "name": "Charlie (Accountant)", "role": "Accountant", "status": "Idle"})

        if default_agents_to_insert:
            client.table("agents").insert(default_agents_to_insert).execute()

        return {"business_id": biz_id}
    except Exception as e:
        logger.error(f"Setup error: {str(e)}")
        return {"business_id": user.business_id or "default-business-id", "error": str(e)}

@app.get("/api/v1/config")
def get_public_config():
    import os
    sb_url = settings.SUPABASE_URL or os.getenv("SUPABASE_URL")
    sb_key = (
        os.getenv("SUPABASE_ANON_KEY") or 
        os.getenv("SUPABASE_KEY") or 
        settings.SUPABASE_KEY or 
        os.getenv("SUPABASE_SECRET_KEY") or 
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )
    return {
        "supabaseUrl": sb_url,
        "supabaseKey": sb_key
    }

# Mount Static Files
import os
from fastapi.responses import JSONResponse
os.makedirs("app/static", exist_ok=True)
os.makedirs("app/static/_next", exist_ok=True)

app.mount("/_next", StaticFiles(directory="app/static/_next"), name="next-assets")

@app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
async def serve_frontend(full_path: str):
    # Never catch API calls with static file handling
    if full_path.startswith("api/") or full_path == "api":
        return JSONResponse(status_code=404, content={"detail": f"API endpoint /{full_path} not found"})

    if full_path == "":
        full_path = "index"
        
    # Check for direct file match (like favicon.ico)
    file_path = os.path.join("app/static", full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
        
    # Next.js maps routes to .html files
    html_path = os.path.join("app/static", f"{full_path}.html")
    if os.path.isfile(html_path):
        return FileResponse(html_path)
        
    # Fallback to index.html for SPA feeling
    index_path = os.path.join("app/static", "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
        
    return JSONResponse(status_code=404, content={"detail": "Not Found"})

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting up {settings.PROJECT_NAME} API")
    start_event_bus()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.PROJECT_NAME} API")
