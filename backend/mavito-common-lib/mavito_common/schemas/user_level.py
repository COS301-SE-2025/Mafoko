from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid


# Shared properties
class UserLevelBase(BaseModel):
    current_level: int
    total_xp: int
    model_config = ConfigDict(from_attributes=True)


class UserLevelCreate(UserLevelBase):
    user_id: uuid.UUID


class UserLevelUpdate(BaseModel):
    current_level: Optional[int] = None
    total_xp: Optional[int] = None


class UserLevelResponse(UserLevelBase):
    id: uuid.UUID
    user_id: uuid.UUID
    xp_for_next_level: int
    xp_progress_in_level: int
    model_config = ConfigDict(from_attributes=True)


# Properties for internal use
class UserLevelInDB(UserLevelResponse):
    pass
