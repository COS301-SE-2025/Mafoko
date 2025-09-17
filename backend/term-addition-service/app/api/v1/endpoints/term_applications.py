from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from mavito_common.models.user import UserRole as UserRoleEnum
from app import deps
from app.crud.crud_term_application import crud_term_application
from mavito_common.schemas.user import User as UserSchema
from mavito_common.schemas.term_application import TermApplicationRead


router = APIRouter()


@router.post(
    "/{termId}/vote",
    response_model=TermApplicationRead,
    summary="Crowd vote for a term application",
    description="Allows users to vote for a term application.",
)
async def crowd_vote_term_application(
    termId: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Adds a crowd vote for a term application.
    """
    try:
        updated_application = await crud_term_application.add_application_vote(
            db,
            application_id=termId,
            voter_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not updated_application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Term application not found or vote could not be added.",
        )

    return updated_application


@router.get(
    "/pending-admin-verification",
    response_model=List[TermApplicationRead],
    summary="Get pending term applications",
    description="Retrieves all term applications that are pending admin verification.",
)
async def get_pending_admin_term_applications(
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Get all term applications that are pending verification.
    """
    applications = await crud_term_application.get_applications_pending_admin_approval(
        db
    )
    return applications


@router.get(
    "/pending-verification",
    response_model=List[TermApplicationRead],
    summary="Get pending term applications",
    description="Retrieves all term applications that are pending verification.",
)
async def get_pending_term_applications(
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Get all term applications that are pending verification.
    """
    applications = await crud_term_application.get_applications_pending_verification(db)
    response_applications = []
    for app in applications:
        app_dict = TermApplicationRead.model_validate(app).model_dump()
        app_dict["crowd_votes_count"] = (
            await crud_term_application.get_application_vote_count(db, app.id)
        )
        response_applications.append(TermApplicationRead(**app_dict))

    return response_applications


@router.get(
    "/all",
    response_model=List[TermApplicationRead],
    summary="Get all term applications",
    description="Retrieves all term applications.",
)
async def get_all_term_applications(
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Get all term applications.
    """
    applications = await crud_term_application.get_all_applications(db)
    return applications


@router.delete(
    "/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a user's own term application",
    description="Allows a contributor to delete their own pending term application. Only the submitter or an admin can perform this action. The associated term record is also deleted.",
)
async def delete_term_application(
    application_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Deletes a term application by ID.
    """
    application = await crud_term_application.get_application_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Term application not found."
        )

    # Security check: Ensure the user owns the application or is an admin
    if (
        application.submitted_by_user_id != current_user.id
        and current_user.role != UserRoleEnum.admin
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this application.",
        )

    # Call the new CRUD function to handle the deletion
    success = await crud_term_application.delete_application_and_term(
        db, application_id=application_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete term application.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
