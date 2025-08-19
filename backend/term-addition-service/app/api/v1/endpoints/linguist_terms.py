# term-addition-service/app/api/v1/endpoints/linguist_terms.py
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
    "/applications-for-review",
    response_model=List[TermApplicationRead],
    summary="Get applications awaiting linguist review",
    description="Retrieves term applications that are 'pending_verification' or 'crowd_verified'. Linguist-only.",
)
async def get_applications_for_linguist_review(
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_linguist),
):
    """
    Retrieves term applications that are ready for a linguist to review.
    """
    try:
        applications = (
            await crud_term_application.get_applications_pending_verification(db)
        )
        response_applications = []
        for app in applications:
            # Manually populate crowd_votes_count
            app_dict = TermApplicationRead.model_validate(app).model_dump()
            app_dict["crowd_votes_count"] = (
                await crud_term_application.get_application_vote_count(db, app.id)
            )
            response_applications.append(app_dict)
        return response_applications
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.put(
    "/{application_id}/verify",
    response_model=TermApplicationRead,
    summary="Linguist verifies a term application",
    description="Allows a linguist to verify a submission, moving it to 'linguist_verified'.",
)
async def linguist_verify_term_application(
    application_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_linguist),
):
    """
    Allows a linguist to verify an application, moving it to LINGUIST_VERIFIED status.
    """
    application = await crud_term_application.get_application_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Term application not found."
        )

    if application.status not in [
        TermStatus.PENDING_VERIFICATION,
        TermStatus.CROWD_VERIFIED,
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application is in '{application.status}' status and cannot be verified by a linguist.",
        )

    updated_application = (
        await crud_term_application.update_application_status_and_term(
            db,
            application_id=application_id,
            new_status=TermStatus.LINGUIST_VERIFIED,
            reviewer_id=current_user.id,
            is_linguist_verification=True,
        )
    )

    updated_application = await crud_term_application.get_application_by_id(
        db, application_id
    )
    response_data = TermApplicationRead.model_validate(updated_application).model_dump()
    response_data["crowd_votes_count"] = (
        await crud_term_application.get_application_vote_count(db, application_id)
    )
    return TermApplicationRead(**response_data)


@router.put(
    "/{application_id}/reject",
    response_model=TermApplicationRead,
    summary="Linguist rejects a term application",
    description="Allows a linguist to reject a submission. Requires review feedback.",
)
async def linguist_reject_term_application(
    application_id: UUID,
    reject_data: TermApplicationReject,
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_linguist),
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

    updated_application = (
        await crud_term_application.update_application_status_and_term(
            db,
            application_id=application_id,
            new_status=TermStatus.REJECTED,
            reviewer_id=current_user.id,
            review=reject_data.review,
            is_linguist_verification=True,
        )
    )
    updated_application = await crud_term_application.get_application_by_id(
        db, application_id
    )
    response_data = TermApplicationRead.model_validate(updated_application).model_dump()
    response_data["crowd_votes_count"] = (
        await crud_term_application.get_application_vote_count(db, application_id)
    )
    return TermApplicationRead(**response_data)
