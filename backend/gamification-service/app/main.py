# gamification-service/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mavito_common.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(title="Mavito Gamification Service", redirect_slashes=False)

if settings.BACKEND_CORS_ORIGINS_LIST:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS_LIST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health Check"])
async def read_root():
    """
    Health check endpoint for the service.
    Returns a simple status to indicate the service is running.
    """
    return {"service": "Mavito Gamification Service", "status": "ok"}
