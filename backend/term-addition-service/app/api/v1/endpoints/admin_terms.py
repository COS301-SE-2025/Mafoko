from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app import deps
from app.crud.crud_term_application import crud_term_application
from mavito_common.schemas.user import User as UserSchema
from mavito_common.schemas.term_application import (
    TermApplicationRead,
    TermApplicationReject,
)
from mavito_common.models.term_status import TermStatus


router = APIRouter()


@router.get(
    "/applications-for-approval",
    response_model=List[TermApplicationRead],
    summary="Get term applications awaiting admin approval",
    description="Retrieves term applications that are 'crowd_verified' or 'linguist_verified', awaiting final admin approval. Admin-only.",
)
async def get_applications_for_admin_approval(
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(
        deps.get_current_active_admin
    ),  # Only admins can view these
):
    """
    Retrieves term applications that are ready for admin approval (crowd-verified or linguist-verified).
    """
    applications = await crud_term_application.get_applications_pending_admin_approval(
        db
    )

    response_applications = []
    for app in applications:
        # Manually populate crowd_votes_count
        app_dict = TermApplicationRead.model_validate(app).model_dump()
        app_dict["crowd_votes_count"] = (
            await crud_term_application.get_application_vote_count(db, app.id)
        )
        response_applications.append(TermApplicationRead(**app_dict))

    return response_applications


@router.put(
    "/{application_id}/approve",
    response_model=TermApplicationRead,
    summary="Admin approves a term application",
    description="Allows an admin to give final approval to a term application, moving it to 'admin_approved'. This updates the actual Term record.",
)
async def admin_approve_term_application(
    application_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_admin),
):
    """
    Allows an admin to approve a term application, moving it to ADMIN_APPROVED status.
    This action also updates the associated Term record with the proposed content.
    """
    application = await crud_term_application.get_application_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Term application not found."
        )

    if application.status not in [
        TermStatus.CROWD_VERIFIED,
        TermStatus.LINGUIST_VERIFIED,
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application is in '{application.status}' status and cannot be admin-approved yet.",
        )

    try:
        updated_application = (
            await crud_term_application.update_application_status_and_term(
                db,
                application_id=application_id,
                new_status=TermStatus.ADMIN_APPROVED,
                reviewer_id=current_user.id,
                is_admin_approval=True,
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not updated_application:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to admin-approve application.",
        )

    response_data = TermApplicationRead.model_validate(updated_application).model_dump()
    response_data["crowd_votes_count"] = (
        await crud_term_application.get_application_vote_count(db, application_id)
    )
    return TermApplicationRead(**response_data)


@router.put(
    "/{application_id}/reject",
    response_model=TermApplicationRead,
    summary="Admin rejects a term application",
    description="Allows an admin to reject a term application at any stage. Requires review feedback.",
)
async def admin_reject_term_application(
    application_id: UUID,
    reject_data: TermApplicationReject,
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_admin),
):
    application = await crud_term_application.get_application_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Term application not found."
        )

    if application.status == TermStatus.ADMIN_APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject an already approved application.",
        )

    try:
        updated_application = (
            await crud_term_application.update_application_status_and_term(
                db,
                application_id=application_id,
                new_status=TermStatus.REJECTED,
                reviewer_id=current_user.id,
                review=reject_data.review,
                is_admin_approval=True,
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not updated_application:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reject application.",
        )

    # Reload application fully with all relationships before passing to Pydantic
    refreshed_application = await crud_term_application.get_application_by_id(
        db, application_id
    )

    response_data = TermApplicationRead.model_validate(
        refreshed_application
    ).model_dump()
    response_data["crowd_votes_count"] = (
        await crud_term_application.get_application_vote_count(db, application_id)
    )
    return TermApplicationRead(**response_data)
