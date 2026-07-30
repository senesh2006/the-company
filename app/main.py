from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.api.routes import health, agents, tasks, costs, metrics
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
    allow_origins=["*"],  # Allows all origins, change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(agents.router, prefix=f"{settings.API_V1_STR}/agents", tags=["agents"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["tasks"])
app.include_router(costs.router, prefix=f"{settings.API_V1_STR}/costs", tags=["costs"])
app.include_router(metrics.router, prefix=f"{settings.API_V1_STR}/metrics", tags=["metrics"])

@app.get("/api/v1/setup")
def setup_test_environment():
    """Gets or creates a default business for the test UI."""
    import os
    try:
        sb_url = settings.SUPABASE_URL or os.getenv("SUPABASE_URL")
        sb_key = settings.SUPABASE_KEY or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SECRET_KEY")

        if not sb_url or not sb_key:
            safe_keys = [k for k in os.environ.keys() if "KEY" not in k.upper() and "SECRET" not in k.upper() and "TOKEN" not in k.upper()]
            return {
                "error": f"SUPABASE keys missing. Found env vars: {', '.join(safe_keys)}"
            }

        client = create_client(sb_url, sb_key)
        
        # Gets or creates a default business
        response = client.table("businesses").select("*").limit(1).execute()
        if response.data:
            biz_id = response.data[0]["id"]
        else:
            new_biz = client.table("businesses").insert({"name": "Test Business"}).execute()
            biz_id = new_biz.data[0]["id"]
            
        # Ensure default agents exist for this business
        agents = client.table("agents").select("id, name, role").eq("business_id", biz_id).execute()
        existing_roles = [a["role"] for a in agents.data] if agents.data else []
        
        default_agents_to_insert = []
        if "Researcher" not in existing_roles:
            default_agents_to_insert.append({"business_id": biz_id, "name": "Alice (Researcher)", "role": "Researcher"})
        if "Coder" not in existing_roles:
            default_agents_to_insert.append({"business_id": biz_id, "name": "Bob (Coder)", "role": "Coder"})
        if "Accountant" not in existing_roles:
            default_agents_to_insert.append({"business_id": biz_id, "name": "Charlie (Accountant)", "role": "Accountant"})
            
        if default_agents_to_insert:
            client.table("agents").insert(default_agents_to_insert).execute()
            
        return {"business_id": biz_id}
    except Exception as e:
        logger.error(f"Setup error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "type": str(type(e))}

# Mount Static Files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/")
async def root():
    return FileResponse("app/static/index.html")

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting up {settings.PROJECT_NAME} API")
    start_event_bus()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.PROJECT_NAME} API")
