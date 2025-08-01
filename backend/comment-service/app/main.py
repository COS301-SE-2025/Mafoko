# comment-service/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mavito_common.core.config import settings
from app.api.v1.endpoints import comments

app = FastAPI(title="Marito Comments Service", redirect_slashes=False)

if settings.BACKEND_CORS_ORIGINS_LIST:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS_LIST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


app.include_router(comments.router, prefix="/api/v1/comments", tags=["Comments"])


@app.get("/", tags=["Health Check"])
async def read_root():
    """
    Health check endpoint for the service.
    Returns a simple status to indicate the service is running.
    """
    return {"service": "Marito Comments Service", "status": "ok"}
