from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mavito_common.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title="Feedback Service",
    description="Feedback and complaint management service for Mavito",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "Feedback Service is running", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "feedback-service"}
