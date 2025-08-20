# mavito-common-lib/mavito_common/schemas/term_application.py
from pydantic import BaseModel, UUID4, ConfigDict, Field
from typing import Optional
from datetime import datetime

from mavito_common.models.term_status import TermStatus
from mavito_common.schemas.user import User as UserSchema, UserBase
from mavito_common.schemas.term import (
    Term as TermReadSchema,
    TermCreate as UserTermCreateSchema,
)


class TermApplicationCreate(UserTermCreateSchema):
    """
    Schema for creating a new term application (either for a new term or an edit).
    Inherits proposed content fields from TermCreate.
    """

    original_term_id: Optional[UUID4] = Field(
        None, description="UUID of the term this application is an edit for"
    )


class TermApplicationUpdate(BaseModel):
    """
    Schema for updating a term application's status or reviewer info.
    Used internally by CRUD operations (not exposed to users directly).
    """

    status: Optional[TermStatus] = Field(
        None, description="Updated status of the application"
    )
    linguist_verified_by_user_id: Optional[UUID4] = Field(
        None, description="User ID of the linguist who verified this application"
    )
    admin_approved_by_user_id: Optional[UUID4] = Field(
        None, description="User ID of the admin who approved this application"
    )
    reviewed_at: Optional[datetime] = Field(
        None, description="Timestamp of when the application was reviewed"
    )


class TermApplicationUserVote(BaseModel):
    """
    Schema for a user casting a vote on a term application (for crowd verification).
    """

    application_id: UUID4 = Field(
        ..., description="The ID of the term application being voted on."
    )


class TermApplicationVoteRead(BaseModel):
    """
    Schema for reading a vote on a term application.
    Includes user details and vote timestamp.
    """

    id: UUID4
    user_id: UUID4
    voted_at: datetime
    user_details: Optional[UserBase] = None


class TermApplicationRead(BaseModel):
    """
    Full read schema for TermApplication, including nested details.
    """

    id: UUID4
    term_id: Optional[UUID4] = None
    submitted_by_user_id: UUID4
    proposed_content: UserTermCreateSchema
    status: TermStatus
    submitted_at: datetime

    linguist_verified_by_user_id: Optional[UUID4] = None
    admin_approved_by_user_id: Optional[UUID4] = None
    reviewed_at: Optional[datetime] = None
    is_edit_for_term_id: Optional[UUID4] = None

    # Nested user details
    submitted_by_user: Optional[UserSchema] = None
    linguist_verifier: Optional[UserSchema] = None
    admin_approver: Optional[UserSchema] = None

    # Related term details
    term_details: Optional[TermReadSchema] = None

    # Voting and review info
    crowd_votes_count: int = Field(
        0, description="Number of crowd votes this application has received"
    )
    review: Optional[str] = Field(
        None,
        max_length=2000,
        description="Feedback provided when application was rejected",
    )

    model_config = ConfigDict(from_attributes=True)


class TermApplicationReject(BaseModel):
    """
    Schema for rejecting a term application with mandatory feedback.
    """

    review: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Required feedback explaining the rejection",
    )
