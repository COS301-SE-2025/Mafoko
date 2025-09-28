from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from mavito_common.core.config import settings
from mavito_common.core.exceptions import InvalidPasswordError

from app.api.v1.endpoints import auth
from app.api.v1.endpoints import uploads
from app.api.v1.endpoints import admin
from app.api.v1.endpoints import user_preferences

app = FastAPI(title="Marito Auth Service")

if settings.BACKEND_CORS_ORIGINS_LIST:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS_LIST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.exception_handler(InvalidPasswordError)
async def invalid_password_exception_handler(
    request: Request, exc: InvalidPasswordError
):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )


app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["Uploads"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(
    user_preferences.router, prefix="/api/v1/settings", tags=["Settings"]
)


@app.get("/", tags=["Health Check"])
async def read_root():
    return {"service": "Marito Auth Service", "status": "ok"}
