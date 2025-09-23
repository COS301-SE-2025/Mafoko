from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mavito_common.core.config import settings

# 1. Import ALL endpoint routers for the service
from app.api.v1.endpoints import (
    paths,
    dashboard,
    progress,
    glossaries,
    words,
    random,
    word_counts,
    session_progress,
)

# Initialize the FastAPI app
app = FastAPI(title="Mavito Learning Service")

# Apply CORS middleware
if settings.BACKEND_CORS_ORIGINS_LIST:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS_LIST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# 2. Include ALL the routers to make their endpoints live
app.include_router(paths.router, prefix="/api/v1/learning", tags=["Learning Paths"])
app.include_router(
    dashboard.router, prefix="/api/v1/learning", tags=["Learning Dashboard"]
)
app.include_router(
    progress.router, prefix="/api/v1/learning", tags=["Learning Progress"]
)
app.include_router(
    glossaries.router, prefix="/api/v1/learning", tags=["Learning Glossaries"]
)
app.include_router(words.router, prefix="/api/v1/learning", tags=["Study Sessions"])
app.include_router(
    random.router, prefix="/api/v1/learning", tags=["Learning Utilities"]
)
app.include_router(word_counts.router, prefix="/api/v1/learning", tags=["Word Counts"])
app.include_router(
    session_progress.router, prefix="/api/v1/learning", tags=["Session Progress"]
)


@app.get("/", tags=["Health Check"])
async def read_root():
    """
    Health check for the Learning Service.
    """
    return {"service": "Mavito Learning Service", "status": "ok"}
