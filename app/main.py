from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.api.routes import health, agents, tasks, costs, metrics, memory, attention, hierarchy, finance, departments, ui_control, whatsapp, onboarding, briefing, connections, assistant, routines, demo
from app.core.logging import logger
from app.services.event_bus import start_event_bus
from app.services.routine_scheduler import routine_scheduler_daemon
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
app.include_router(demo.router, prefix="/demo", tags=["demo"])
app.include_router(demo.router, prefix=f"{settings.API_V1_STR}/demo", tags=["demo"])
app.include_router(assistant.router, prefix=f"{settings.API_V1_STR}/assistant", tags=["assistant"])
app.include_router(assistant.router, prefix=f"{settings.API_V1_STR}/agents/assistant", tags=["assistant"])
app.include_router(agents.router, prefix=f"{settings.API_V1_STR}/agents", tags=["agents"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["tasks"])
app.include_router(costs.router, prefix=f"{settings.API_V1_STR}/costs", tags=["costs"])
app.include_router(metrics.router, prefix=f"{settings.API_V1_STR}/metrics", tags=["metrics"])
app.include_router(memory.router, prefix=f"{settings.API_V1_STR}/memory", tags=["memory"])
app.include_router(attention.router, prefix=f"{settings.API_V1_STR}/attention", tags=["attention"])
app.include_router(hierarchy.router, prefix=f"{settings.API_V1_STR}/hierarchy", tags=["hierarchy"])
app.include_router(finance.router, prefix=f"{settings.API_V1_STR}/finance", tags=["finance"])
app.include_router(departments.router, prefix=f"{settings.API_V1_STR}/departments", tags=["departments"])
app.include_router(ui_control.router, prefix=f"{settings.API_V1_STR}/ui", tags=["ui"])
app.include_router(whatsapp.router, prefix=f"{settings.API_V1_STR}/whatsapp", tags=["whatsapp"])
app.include_router(onboarding.router, prefix=f"{settings.API_V1_STR}/onboarding", tags=["onboarding"])
app.include_router(briefing.router, prefix=f"{settings.API_V1_STR}/briefing", tags=["briefing"])
app.include_router(connections.router, prefix=f"{settings.API_V1_STR}/connections", tags=["connections"])
app.include_router(routines.router, prefix=f"{settings.API_V1_STR}/routines", tags=["routines"])

from fastapi import Depends
from app.api.deps import get_current_user

@app.get("/api/v1/setup")
def setup_test_environment(user = Depends(get_current_user)):
    """Gets or creates a default business for the authenticated user."""
    import os
    try:
        sb_url = settings.SUPABASE_URL or os.getenv("SUPABASE_URL")
        sb_key = settings.SUPABASE_KEY or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SECRET_KEY")

        biz_id = user.business_id or "00000000-0000-0000-0000-000000000001"
        if not sb_url or not sb_key:
            return {"business_id": biz_id, "warning": "Supabase not configured"}

        try:
            client = create_client(sb_url, sb_key)
        except Exception as sb_err:
            logger.warning(f"Setup Supabase client error: {sb_err}")
            return {"business_id": biz_id, "warning": "Supabase connection unavailable"}

        # Ensure the business row exists so agent/task foreign keys are valid.
        try:
            client.table("businesses").insert({"id": biz_id, "name": "My Business"}).execute()
        except Exception:
            pass  # Row likely already exists

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
        return {"business_id": user.business_id or "00000000-0000-0000-0000-000000000001", "error": str(e)}

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

# Resolve static directory (frontend/out if built, otherwise app/static)
STATIC_DIR = "frontend/out" if os.path.exists("frontend/out") and os.path.exists("frontend/out/_next") else "app/static"
os.makedirs(STATIC_DIR, exist_ok=True)
next_dir = os.path.join(STATIC_DIR, "_next")
os.makedirs(next_dir, exist_ok=True)

app.mount("/_next", StaticFiles(directory=next_dir, html=False), name="next-assets")

@app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
async def serve_frontend(full_path: str):
    # Never catch API calls with static file handling
    if full_path.startswith("api/") or full_path == "api":
        return JSONResponse(status_code=404, content={"detail": f"API endpoint /{full_path} not found"})

    if full_path == "":
        full_path = "index"
        
    # Check for direct file match (like favicon.ico, images)
    file_path = os.path.join(STATIC_DIR, full_path)
    if os.path.isfile(file_path):
        headers = {"Cache-Control": "public, max-age=3600"} if not file_path.endswith(".html") else {"Cache-Control": "no-cache"}
        return FileResponse(file_path, headers=headers)
        
    # Next.js maps routes to .html files
    html_path = os.path.join(STATIC_DIR, f"{full_path}.html")
    if os.path.isfile(html_path):
        return FileResponse(html_path, headers={"Cache-Control": "no-cache"})
        
    # Fallback to index.html for SPA client-side routing
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path, headers={"Cache-Control": "no-cache"})
        
    return JSONResponse(status_code=404, content={"detail": "Not Found"})

@app.on_event("startup")
async def startup_event():
    try:
        logger.info(f"Starting up {settings.PROJECT_NAME} API")
        start_event_bus()
        await routine_scheduler_daemon.start()
    except Exception as e:
        logger.error(f"Error during startup_event: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.PROJECT_NAME} API")
    await routine_scheduler_daemon.stop()
