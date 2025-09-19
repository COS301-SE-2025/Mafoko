from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid

from mavito_common.models.user_xp import XPSource


# Shared properties
class UserXPBase(BaseModel):
    xp_amount: int
    xp_source: XPSource
    source_reference_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# Properties to receive via API on creation
class UserXPCreate(UserXPBase):
    user_id: uuid.UUID


# Properties to receive via API on update
class UserXPUpdate(BaseModel):
    xp_amount: Optional[int] = None
    xp_source: Optional[XPSource] = None
    source_reference_id: Optional[uuid.UUID] = None
    description: Optional[str] = None


# Properties to return to client
class UserXPResponse(UserXPBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
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
    user_id: uuid.UUID
    xp_amount: int
    xp_source: XPSource
    source_reference_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
