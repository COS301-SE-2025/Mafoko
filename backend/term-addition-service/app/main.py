# term-addition-service/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mavito_common.core.config import settings

# Import new endpoint routers from their respective files
from app.api.v1.endpoints import terms, term_applications, admin_terms, linguist_terms

# Initialize FastAPI
app = FastAPI(title="Marito Term Addition Service")

# Apply CORS middleware based on settings
if settings.BACKEND_CORS_ORIGINS_LIST:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS_LIST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API routers with their specific prefixes and tags
app.include_router(
    terms.router, prefix="/api/v1/terms", tags=["Term Submission & Edits"]
)
app.include_router(
    term_applications.router,
    prefix="/api/v1/term-applications",
    tags=["Term Applications & Verification"],
)
app.include_router(
    linguist_terms.router,
    prefix="/api/v1/linguist/terms",
    tags=["Linguist Term Management"],
)
app.include_router(
    admin_terms.router, prefix="/api/v1/admin/terms", tags=["Admin Term Management"]
)


@app.get("/", tags=["Health Check"])
async def read_root():
    """
    Health check for the Term Addition Service.
    """
    return {"service": "Marito Term Addition Service", "status": "ok"}
