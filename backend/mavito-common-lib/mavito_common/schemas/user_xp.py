from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
import uuid

from mavito_common.models.user_xp import XPSource


# Shared properties
class UserXPBase(BaseModel):
    xp_amount: int = Field(..., description="Amount of XP awarded (can be negative)")
    xp_source: XPSource = Field(
        ...,
        description="Source of the XP award",
        examples=["comment", "upvote_received", "term_addition"],
    )
    source_reference_id: Optional[uuid.UUID] = Field(
        None,
        description="ID of the source object (comment_id, term_id, etc.) for tracking",
    )
    description: Optional[str] = Field(
        None, description="Human-readable description of the XP award"
    )
    model_config = ConfigDict(from_attributes=True)


# Properties to receive via API on creation
class UserXPCreate(UserXPBase):
    user_id: uuid.UUID = Field(..., description="ID of the user receiving the XP")


# Properties to receive via API on update
class UserXPUpdate(BaseModel):
    xp_amount: Optional[int] = Field(
        None, description="Amount of XP awarded (can be negative)"
    )
    xp_source: Optional[XPSource] = Field(None, description="Source of the XP award")
    source_reference_id: Optional[uuid.UUID] = Field(
        None, description="ID of the source object for tracking"
    )
    description: Optional[str] = Field(
        None, description="Human-readable description of the XP award"
    )


# Properties to return to client
class UserXPResponse(UserXPBase):
    id: uuid.UUID = Field(..., description="Unique identifier for this XP record")
    user_id: uuid.UUID = Field(..., description="ID of the user who received the XP")
    created_at: datetime = Field(..., description="Timestamp when the XP was awarded")
    model_config = ConfigDict(from_attributes=True)


# Properties for internal use
class UserXPInDB(UserXPResponse):
    pass


# Aggregated XP stats for a user
class UserXPStats(BaseModel):
    user_id: uuid.UUID
    total_xp: int
    xp_this_week: int
    xp_this_month: int
    recent_xp_records: List[UserXPResponse]
    model_config = ConfigDict(from_attributes=True)


# Request to add XP to a user
class AddXPRequest(BaseModel):
    """Request to award XP to a user for a specific action"""

    user_id: uuid.UUID = Field(..., description="ID of the user receiving the XP")
    xp_amount: int = Field(
        ...,
        description="Amount of XP to award (can be negative for penalties)",
        examples=[5, 10, 25, -2],
    )
    xp_source: XPSource = Field(
        ...,
        description="Source of the XP award - must be one of the predefined enum values",
    )
    source_reference_id: Optional[uuid.UUID] = Field(
        None,
        description="ID of the source object (comment_id, term_id, vote_id, etc.) for tracking and duplicate prevention",
    )
    description: Optional[str] = Field(
        None,
        description="Human-readable description of why XP was awarded",
        examples=["Created a comment", "Received an upvote", "Added a new term"],
    )
