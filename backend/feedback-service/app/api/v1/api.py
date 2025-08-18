from fastapi import APIRouter

from app.api.v1.endpoints import feedback

api_router = APIRouter()
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])