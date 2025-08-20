# mavito_common/schemas/linguist_application.py
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
import uuid
import enum
from datetime import datetime
from .user import User as UserSchema


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class LinguistApplicationCreate(BaseModel):
    """
    Schema for the data required to create a new linguist application.
    This will be sent from the frontend to the backend.
    """

    google_scholar_url: str = Field(
        ..., description="URL to the applicant's Google Scholar profile."
    )
    research_papers_gcs_keys: List[str] = Field(
        ...,
        description="List of GCS keys for uploaded research paper PDFs.",
        min_length=1,
    )


class LinguistApplicationRead(LinguistApplicationCreate):
    """
    Schema for reading a linguist application, including server-generated fields.
    """

    id: uuid.UUID
    user_id: uuid.UUID
    status: ApplicationStatus
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LinguistApplicationWithUserRead(LinguistApplicationRead):
    """
    Schema for reading a linguist application that includes the full user details.
    This is used specifically for the admin view.
    """

    user: UserSchema = Field(
        ..., description="Details of the user associated with this application."
    )

    model_config = ConfigDict(from_attributes=True)
