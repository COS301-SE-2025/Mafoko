from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mavito_common.core.config import settings
from app.api.v1.endpoints import search, suggest

app = FastAPI(title="Marito Search Service", redirect_slashes=False)

if settings.BACKEND_CORS_ORIGINS_LIST:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS_LIST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])
app.include_router(suggest.router, prefix="/api/v1/suggest", tags=["Suggest"])


@app.get("/", tags=["Health Check"])
async def read_root():
    return {"service": "Marito Search Service", "status": "ok"}
