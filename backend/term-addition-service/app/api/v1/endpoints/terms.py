# term-addition-service/app/api/v1/endpoints/terms.py

from fastapi.params import Body
from sqlalchemy import select
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List
from uuid import UUID

from app import deps
from app.crud.crud_term_application import crud_term_application
from app.crud.crud_term import crud_term
from mavito_common.models.term import Term as TermModel
from mavito_common.models.user import UserRole as UserRoleEnum
from app.crud.crud_user import crud_user

from mavito_common.schemas.user import User as UserSchema
from mavito_common.schemas.term_application import (
    TermApplicationCreate,
    TermApplicationRead,
)
from mavito_common.schemas.term import Term as TermSchema, TermDropdown, TermRead

TermSchema.model_rebuild()

router = APIRouter()


@router.get(
    "/attributes",
    response_model=Dict[str, List[str]],
    summary="Get all unique languages and domains",
    description="Retrieves all distinct languages and domains present in the terms database to populate form dropdowns.",
)
async def get_term_attributes(
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    language_query = (
        select(TermModel.language).distinct().where(TermModel.language is not None)
    )
    domain_query = (
        select(TermModel.domain).distinct().where(TermModel.domain is not None)
    )

    language_result = await db.execute(language_query)
    domain_result = await db.execute(domain_query)

    languages = language_result.scalars().all()
    domains = domain_result.scalars().all()

    return {"languages": languages, "domains": domains}


@router.post(
    "/submit",
    response_model=TermApplicationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new term or propose an edit to an existing term",
    description="Allows contributors and linguists to submit new terms or propose changes to existing ones. Linguist submissions are pre-verified.",
)
async def submit_term_application(
    term_in: TermApplicationCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_linguist_or_contributor),
):
    """
    Handles the submission of a new term or an edit request for an existing term.
    Initial translations (if provided as existing UUIDs) are handled during term creation.
    """
    user_model = await crud_user.get_user_by_uuid(db, user_id=current_user.id)
    if not user_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Submitting user not found."
        )

    if term_in.original_term_id:
        original_term = await crud_term.get_term_by_id(
            db, term_id=term_in.original_term_id
        )
        if not original_term:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Original term with ID {term_in.original_term_id} not found.",
            )
        application = await crud_term_application.create_term_application(
            db,
            obj_in=term_in,
            submitted_by_user_id=current_user.id,
            submitted_by_user=user_model,
            submitted_by_user_role=UserRoleEnum(current_user.role),
        )
        if not application:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create term edit application for {term_in.original_term_id}.",
            )

    else:
        existing_term = await crud_term.get_term_by_name_and_language(
            db, term_name=term_in.term, language=term_in.language
        )
        if existing_term:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A term with the name '{term_in.term}' and language '{term_in.language}' already exists (case-insensitive).",
            )

        application = await crud_term_application.create_term_application(
            db,
            obj_in=term_in,
            submitted_by_user_id=current_user.id,
            submitted_by_user=user_model,
            submitted_by_user_role=UserRoleEnum(current_user.role),
        )
        if not application:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create term application.",
            )

    fetched_application = await crud_term_application.get_application_by_id(
        db, application.id
    )
    if not fetched_application:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve newly created application.",
        )

    response_application = TermApplicationRead.model_validate(fetched_application)
    response_application.crowd_votes_count = (
        await crud_term_application.get_application_vote_count(
            db, fetched_application.id
        )
    )

    return response_application


@router.get(
    "/my-submitted",
    response_model=List[TermApplicationRead],
    summary="Get term applications submitted by the current user",
    description="Retrieves a list of all term applications submitted by the currently authenticated user.",
)
async def get_my_submitted_term_applications(
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Get all term applications submitted by the current user.
    """
    applications = await crud_term_application.get_my_submitted_applications(
        db, user_id=current_user.id
    )

    response_applications = []
    for app in applications:
        app_dict = TermApplicationRead.model_validate(app).model_dump()
        app_dict["crowd_votes_count"] = (
            await crud_term_application.get_application_vote_count(db, app.id)
        )

        response_applications.append(TermApplicationRead(**app_dict))

    return response_applications


@router.get(
    "/{term_id}/reviews",
    response_model=List[TermApplicationRead],
    summary="Get all reviews for a term",
    description="Retrieves all rejection reviews for a term's applications.",
)
async def get_term_reviews(
    term_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Get all rejection reviews for a term's applications.
    """
    applications = await crud_term_application.get_rejected_applications_for_term(
        db, term_id=term_id
    )

    return [
        TermApplicationRead(
            **TermApplicationRead.model_validate(app).model_dump(),
            crowd_votes_count=await crud_term_application.get_application_vote_count(
                db, app.id
            ),
        )
        for app in applications
        if app.review
    ]


@router.get(
    "/editable",
    response_model=List[TermDropdown],
    summary="Get terms that can be edited by the user",
    description="Retrieves a list of terms that a user with the current role can propose edits for.",
)
async def get_editable_terms(
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Retrieves a list of terms that a user with the current role can propose edits for.
    """
    editable_terms = await crud_term.get_non_final_terms(db)
    return [TermDropdown.model_validate(term) for term in editable_terms]


@router.get(
    "/admin-verified",
    response_model=List[TermDropdown],  # Using the TermDropdown schema
    summary="Get terms that have been admin verified",
    description="Retrieves all terms that have been approved by an admin.",
)
async def get_admin_verified_terms(
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Get all terms that are finalized (ADMIN_APPROVED) for dropdowns.
    """
    terms = await crud_term.get_admin_verified_terms(db)
    return terms


@router.post(
    "/terms-by-ids",
    response_model=List[TermRead],
    summary="Get specific terms by their UUIDs",
    description="Retrieves a list of terms given their UUIDs.",
)
async def get_terms_by_ids(
    term_ids: List[UUID] = Body(..., embed=True),
    db: AsyncSession = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Returns a list of terms from a list of UUIDs.
    """
    terms = await crud_term.get_terms_by_ids(db, term_ids=term_ids)
    if not terms:
        raise HTTPException(status_code=404, detail="No terms found for the given IDs")

    # FastAPI's response_model will now handle the conversion correctly
    return terms
