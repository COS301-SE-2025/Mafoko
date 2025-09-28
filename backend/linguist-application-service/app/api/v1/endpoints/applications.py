from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID  # noqa: F401

from app.api import deps
from mavito_common.models.linguist_application import ApplicationStatus  # noqa: F401
from mavito_common.models.user import User as UserModel, UserRole  # noqa: F401
from mavito_common.schemas.linguist_application import (
    LinguistApplicationCreate,
    LinguistApplicationRead,
    LinguistApplicationWithUserRead,
)
from app.crud.crud_linguist_application import crud_linguist_application
from app.crud.crud_user import crud_user  # noqa: F401

router = APIRouter(redirect_slashes=False)


@router.get("/me_application", response_model=Optional[LinguistApplicationRead])
async def get_current_user_application(
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_user),
):
    """
    Get the linguist application for the currently authenticated user.
    """
    application = await crud_linguist_application.get_by_user_id(
        db, user_id=current_user.id
    )
    return application


@router.post(
    "", response_model=LinguistApplicationRead, status_code=status.HTTP_201_CREATED
)
async def create_linguist_application(
    *,
    db: AsyncSession = Depends(deps.get_db),
    application_in: LinguistApplicationCreate,
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    Create a new linguist application for the currently authenticated user.
    """
    existing_application = await crud_linguist_application.get_by_user_id(
        db, user_id=current_user.id
    )

    # First, check if an application exists.
    if existing_application:
        # If it exists, THEN get its status.
        application_status = await crud_linguist_application.get_application_status(
            db, application_id=existing_application.id
        )
        if application_status in ["pending"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A linguist application for this user already exists. You can only have one application.",
            )

    # If the 'if' block was skipped (no existing application) or passed, create a new one.
    application = await crud_linguist_application.create_application(
        db=db, user_id=current_user.id, obj_in=application_in
    )
    if not application:
        raise HTTPException(status_code=400, detail="Could not create application.")

    return application


@router.get(
    "/all",
    response_model=List[LinguistApplicationWithUserRead],
    summary="Get all linguist applications for admin view",
    description="Retrieve a list of all linguist applications, including user details. This endpoint is for administrators only.",
)
async def get_all_linguist_applications(
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_admin),
):
    """
    Admin-only endpoint to fetch all linguist applications.
    """
    applications = await crud_linguist_application.get_all_with_users(db)
    return applications


@router.put("/{applicationId}/approve")
async def approve_linguist_application(
    applicationId: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_admin),
):
    """
    Admin-only endpoint to approve a linguist application.
    """
    application = await crud_linguist_application.get_by_id(
        db, application_id=applicationId
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application = await crud_linguist_application.update_status(
        db, application_id=applicationId, new_status="approved"
    )
    if not application:
        raise HTTPException(status_code=400, detail="Could not approve application")

    return application


@router.put("/{applicationId}/reject")
async def reject_linguist_application(
    applicationId: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_admin),
):
    """
    Admin-only endpoint to reject a linguist application.
    """
    application = await crud_linguist_application.get_by_id(
        db, application_id=applicationId
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application = await crud_linguist_application.update_status(
        db, application_id=applicationId, new_status="rejected"
    )
    if not application:
        raise HTTPException(status_code=400, detail="Could not reject application")

    return application
