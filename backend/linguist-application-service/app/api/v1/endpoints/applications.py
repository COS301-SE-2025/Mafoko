# In linguist-application-service/app/api/v1/endpoints/applications.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID  # noqa: F401

from app.api import deps
from mavito_common.models.user import User as UserModel
from mavito_common.schemas.linguist_application import LinguistApplicationCreate
from app.crud.crud_linguist_application import crud_linguist_application

router = APIRouter()


@router.post("/", status_code=201)
async def create_linguist_application(
    *,
    db: AsyncSession = Depends(deps.get_db),
    application_in: LinguistApplicationCreate,
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    Create a new linguist application for the currently authenticated user.
    """
    application = await crud_linguist_application.create_application(
        db=db, user_id=current_user.id, obj_in=application_in
    )
    if not application:
        raise HTTPException(status_code=400, detail="Could not create application.")

    return application
