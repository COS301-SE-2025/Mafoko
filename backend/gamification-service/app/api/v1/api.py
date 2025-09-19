from fastapi import APIRouter

from app.api.v1.endpoints import xp

api_router = APIRouter()
api_router.include_router(xp.router, prefix="/xp", tags=["XP"])
