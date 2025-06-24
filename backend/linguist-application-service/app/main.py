from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mavito_common.core.config import settings
# This assumes you will create an endpoint file for application logic
from app.api.v1.endpoints import applications

app = FastAPI(title="Mavito Linguist Application Service")

# Set up CORS middleware from your shared settings
if settings.BACKEND_CORS_ORIGINS_LIST:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS_LIST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include the router for handling linguist applications
# All endpoints in linguist_applications.py will be prefixed with this path
app.include_router(
    applications.router, 
    prefix="/api/v1/linguist-applications", 
    tags=["Linguist Applications"]
)

@app.get("/", tags=["Health Check"])
async def read_root():
    """A simple health check endpoint for the service."""
    return {"service": "Mavito Linguist Application Service", "status": "ok"}