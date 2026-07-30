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
    try:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            return {"error": "SUPABASE_URL or SUPABASE_KEY is missing from environment variables."}

        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        response = client.table("businesses").select("*").limit(1).execute()
        if response.data:
            return {"business_id": response.data[0]["id"]}
        
        # Create one if none exists
        new_biz = client.table("businesses").insert({"name": "Test Business"}).execute()
        return {"business_id": new_biz.data[0]["id"]}
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
