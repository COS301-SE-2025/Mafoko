# app/schemas/user.py
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import (
    Optional,
)  # List was correctly marked as unused previously and can be omitted if not needed
from datetime import datetime
import uuid  # Import for UUID type

# Assuming UserRole is correctly defined in app/models/user.py
from mavito_common.models.user import UserRole
from .linguist_application import LinguistApplicationCreate


# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: Optional[UserRole] = None
    profile_pic_url: Optional[str] = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str  # Plain password received from client
    linguist_application: Optional[LinguistApplicationCreate] = None


# Properties to receive via API on update
class UserUpdate(BaseModel):  # Defined independently for clarity on updatable fields
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    profile_pic_url: Optional[str] = None
    account_locked: Optional[bool] = None  # If admins can update this


# Properties to return to client (this is your main User response model)
# It includes fields from UserBase and additional fields relevant for API responses.
class User(UserBase):
    id: uuid.UUID  # Changed from int to uuid.UUID
    is_active: (
        bool  # Re-added this, as it's in your SQLAlchemy model and used in deps.py
    )
    is_verified: bool
    account_locked: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    # Pydantic V2 configuration
    model_config = ConfigDict(from_attributes=True)


# Properties stored in DB, including the hashed password (for internal use by CRUD)
# This schema is useful if you need a Pydantic model that includes password_hash.
class UserInDB(User):  # Inherits fields from User
    password_hash: str  # Matches your SQL column name
