import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator
from mavito_common.models.feedback import FeedbackType, FeedbackStatus


# Shared properties
class FeedbackBase(BaseModel):
    type: FeedbackType
    message: str
    name: Optional[str] = None
    email: Optional[str] = None

    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        if not v or not v.strip():
            raise ValueError('Message cannot be empty')
        if len(v.strip()) > 5000:
            raise ValueError('Message cannot exceed 5000 characters')
        return v.strip()

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                return None
            if len(v) > 100:
                raise ValueError('Name cannot exceed 100 characters')
        return v

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                return None
            if len(v) > 100:
                raise ValueError('Email cannot exceed 100 characters')
        return v


# Properties to receive on feedback creation
class FeedbackCreate(FeedbackBase):
    pass


# Properties to receive on feedback update (admin use)
class FeedbackUpdate(BaseModel):
    status: Optional[FeedbackStatus] = None
    admin_response: Optional[str] = None

    @field_validator('admin_response')
    @classmethod
    def validate_admin_response(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                return None
            if len(v) > 5000:
                raise ValueError('Admin response cannot exceed 5000 characters')
        return v


# Properties shared by models stored in DB
class FeedbackInDBBase(FeedbackBase):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    status: FeedbackStatus
    created_at: datetime
    admin_response: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by_user_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


# Properties to return to client
class Feedback(FeedbackInDBBase):
    pass


# Properties stored in DB
class FeedbackInDB(FeedbackInDBBase):
    pass


# Admin view with additional details
class FeedbackAdmin(Feedback):
    # Include user details if available
    user_email: Optional[str] = None
    resolved_by_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Statistics for admin dashboard
class FeedbackStats(BaseModel):
    total_feedback: int
    open_feedback: int
    resolved_feedback: int
    by_type: dict[str, int]
    recent_feedback: list[Feedback]