# vote-service/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mavito_common.core.config import settings
from app.api.v1.endpoints import vote

app = FastAPI(title="Marito Vote Service")

if settings.BACKEND_CORS_ORIGINS_LIST:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS_LIST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(vote.router, prefix="/api/v1/votes", tags=["Votes"])


@app.get("/", tags=["Health Check"])
async def read_root():
    return {"service": "Marito Vote Service", "status": "ok"}
