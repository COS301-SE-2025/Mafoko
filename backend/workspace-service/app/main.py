from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mavito_common.core.config import settings
from app.api.v1.endpoints import bookmarks, groups, notes

app = FastAPI(title="Marito Workspace Service")

if settings.BACKEND_CORS_ORIGINS_LIST:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS_LIST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(
    bookmarks.router, prefix="/api/v1/workspace/bookmarks", tags=["Bookmarks"]
)
app.include_router(groups.router, prefix="/api/v1/workspace/groups", tags=["Groups"])
app.include_router(notes.router, prefix="/api/v1/workspace/notes", tags=["Notes"])


@app.get("/", tags=["Health Check"])
async def read_root():
    return {"service": "Marito Workspace Service", "status": "ok"}
