from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mavito_common.core.config import settings
from app.api.v1.endpoints import applications

app = FastAPI(title="Marito Linguist Application Service", redirect_slashes=False)


if settings.BACKEND_CORS_ORIGINS_LIST:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS_LIST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(
    applications.router,
    prefix="/api/v1/linguist-applications",
    tags=["Linguist Applications"],
)


@app.get("/", tags=["Health Check"])
async def read_root():
    """A simple health check endpoint for the service."""
    return {"service": "Marito Linguist Application Service", "status": "ok"}
