from pydantic import BaseModel, ConfigDict
from datetime import datetime
import uuid

from mavito_common.schemas.achievement import AchievementResponse


# Shared properties
class UserAchievementBase(BaseModel):
    user_id: uuid.UUID
    achievement_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


class UserAchievementCreate(UserAchievementBase):
    pass


class UserAchievementResponse(UserAchievementBase):
    id: uuid.UUID
    earned_at: datetime
    achievement: AchievementResponse
    model_config = ConfigDict(from_attributes=True)


class UserAchievementInDB(UserAchievementResponse):
    pass
