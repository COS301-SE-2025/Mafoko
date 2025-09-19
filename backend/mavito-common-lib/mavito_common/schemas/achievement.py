from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
import uuid

from mavito_common.models.achievement import AchievementType


# Shared properties
class AchievementBase(BaseModel):
    name: str
    description: str
    achievement_type: AchievementType
    target_value: int
    is_active: bool = True
    model_config = ConfigDict(from_attributes=True)


class AchievementCreate(AchievementBase):
    pass


class AchievementUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    achievement_type: Optional[AchievementType] = None
    target_value: Optional[int] = None
    is_active: Optional[bool] = None


class AchievementResponse(AchievementBase):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Properties for internal use
class AchievementInDB(AchievementResponse):
    pass
