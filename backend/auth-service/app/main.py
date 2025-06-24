from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mavito_common.core.config import settings
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import uploads

app = FastAPI(title="Mavito Auth Service")

if settings.BACKEND_CORS_ORIGINS_LIST:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS_LIST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["Uploads"])


@app.get("/", tags=["Health Check"])
async def read_root():
    return {"service": "Mavito Auth Service", "status": "ok"}
