from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
import uuid


# Shared properties
class UserPreferencesBase(BaseModel):
    dark_mode: bool = Field(default=False, description="Enable dark mode")
    offline_mode_enabled: bool = Field(
        default=False, description="Enable offline mode functionality"
    )
    ui_language: str = Field(
        default="eng", max_length=3, description="UI language code (3 characters)"
    )
    text_size: int = Field(
        default=16, ge=12, le=24, description="Text size in pixels"
    )
    text_spacing: float = Field(
        default=1.0, ge=0.8, le=2.0, description="Text spacing multiplier"
    )
    high_contrast_mode: bool = Field(
        default=False, description="Enable high contrast mode for accessibility"
    )
    model_config = ConfigDict(from_attributes=True)


class UserPreferencesCreate(UserPreferencesBase):
    """Schema for creating user preferences"""
    user_id: uuid.UUID


class UserPreferencesUpdate(BaseModel):
    """Schema for updating user preferences"""
    dark_mode: Optional[bool] = None
    offline_mode_enabled: Optional[bool] = None
    ui_language: Optional[str] = Field(None, max_length=3)
    text_size: Optional[int] = Field(None, ge=12, le=24)
    text_spacing: Optional[float] = Field(None, ge=0.8, le=2.0)
    high_contrast_mode: Optional[bool] = None
    model_config = ConfigDict(from_attributes=True)


class UserPreferencesResponse(UserPreferencesBase):
    """Response schema for user preferences"""
    user_id: uuid.UUID
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# Properties for internal use
class UserPreferencesInDB(UserPreferencesResponse):
    """Database schema for user preferences (internal use)"""
    pass