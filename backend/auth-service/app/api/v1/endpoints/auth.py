# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta, datetime, date
import uuid
from pydantic import BaseModel
from google.cloud import storage
from sqlalchemy import select, func

from mavito_common.schemas.user import (
    UserCreate,
    User as UserSchema,
    UserUpdate,
    UserProfilePictureUpdate,
    UserCreateGoogle,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
)

from google.oauth2 import id_token
from google.auth.transport import requests
from mavito_common.schemas.token import Token
from mavito_common.core.security import create_access_token
from mavito_common.core.config import settings
from mavito_common.db.session import get_db
from app.api import deps
from mavito_common.models.user import User as UserModel  # noqa: F401
from app.crud.crud_user import crud_user
from mavito_common.models.user import UserRole
from mavito_common.models.user_xp import UserXP, XPSource


router = APIRouter()


async def award_daily_login_xp(db: AsyncSession, user: UserModel) -> None:
    """Award daily login XP if user hasn't received it today."""
    today = date.today()

    stmt = select(UserXP).where(
        UserXP.user_id == user.id,
        UserXP.xp_source == XPSource.LOGIN_STREAK,
        func.date(UserXP.created_at) == today,
    )
    result = await db.execute(stmt)
    existing_xp = result.scalars().first()

    if existing_xp:
        return  # Already awarded LOGIN_STREAK XP today

    try:
        login_xp = UserXP(
            user_id=user.id,
            xp_amount=5,
            xp_source=XPSource.LOGIN_STREAK,
            source_reference_id=None,
            description="Daily login bonus",
        )

        db.add(login_xp)
        await db.commit()
        await db.refresh(login_xp)
    except Exception as e:
        await db.rollback()
        print(f"Error awarding daily login XP: {e}")
        # Don't fail the login if XP fails


# Profile picture upload schemas
class ProfilePictureUploadRequest(BaseModel):
    content_type: str
    filename: str


class ProfilePictureUploadResponse(BaseModel):
    upload_url: str
    gcs_key: str


class ProfilePictureViewResponse(BaseModel):
    view_url: str
    expires_at: str


@router.post("/profile-picture/upload-url", response_model=ProfilePictureUploadResponse)
def generate_profile_picture_upload_url(
    request_body: ProfilePictureUploadRequest,
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Generate a signed URL for uploading profile pictures to GCS.
    Only allows image content types and validates file extensions.
    """
    # Validate content type - only allow images
    allowed_content_types = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
    ]

    if request_body.content_type.lower() not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content type. Allowed types: {', '.join(allowed_content_types)}",
        )

    # Validate file extension
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
    filename_lower = request_body.filename.lower()

    if not any(filename_lower.endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension. Allowed extensions: {', '.join(allowed_extensions)}",
        )

    try:
        storage_client = storage.Client()
        bucket_name = settings.GCS_BUCKET_NAME
        bucket = storage_client.bucket(bucket_name)

        # Create unique profile picture path
        unique_file_key = (
            f"profile-pictures/{current_user.id}/{uuid.uuid4()}-{request_body.filename}"
        )

        blob = bucket.blob(unique_file_key)

        # Generate signed URL with 15-minute expiration
        url = blob.generate_signed_url(
            version="v4",
            method="PUT",
            expiration=timedelta(minutes=15),
            content_type=request_body.content_type,
        )

        return ProfilePictureUploadResponse(upload_url=url, gcs_key=unique_file_key)

    except Exception as e:
        print(f"Error generating profile picture upload URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate upload URL for profile picture.",
        )


@router.get("/me/profile-picture", response_model=ProfilePictureViewResponse)
def get_my_profile_picture_view_url(
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Generate a signed URL to view/download the current user's profile picture.
    Returns 404 if no profile picture is set.
    """
    if not current_user.profile_pic_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No profile picture set"
        )

    try:
        storage_client = storage.Client()
        bucket_name = settings.GCS_BUCKET_NAME
        bucket = storage_client.bucket(bucket_name)

        blob = bucket.blob(current_user.profile_pic_url)

        # Check if the blob exists
        if not blob.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile picture file not found in storage",
            )

        # Generate signed URL with 15-minute expiration for viewing
        view_url = blob.generate_signed_url(
            version="v4",
            method="GET",
            expiration=timedelta(minutes=15),
        )

        # Calculate expiration time
        expires_at = (datetime.now() + timedelta(minutes=15)).isoformat() + "Z"

        return ProfilePictureViewResponse(view_url=view_url, expires_at=expires_at)

    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"Error generating profile picture view URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate view URL for profile picture.",
        )


@router.post(
    "/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED
)
async def register_new_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,  # This matches the fields from your RegistrationPage.tsx
):
    """
    Create new user.
    - `first_name`, `last_name`, `email`, `password` are expected from UserCreate.
    - `role` can be part of UserCreate if you want to set it at registration.
      If `role` is in UserCreate and not optional, the frontend must send it.
      Currently, our UserCreate schema inherits `role: Optional[UserRole]` from UserBase.
    """
    user = await crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )

    # Create the user using the CRUD operation
    user_data_with_role = user_in.model_copy(update={"role": UserRole.contributor})

    # Create the user record in the database
    new_user = await crud_user.create_user(db, obj_in=user_data_with_role)

    # Return the created user object
    return new_user


@router.post("/login", response_model=Token)
async def login_for_access_token(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),  # FastAPI uses 'username' field for email here
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    The frontend LoginPage.tsx sends 'email' (as username) and 'password'.
    """
    user = await crud_user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },  # Standard for 401 bearer token errors
        )
    # Your SQL schema has account_locked and is_verified.
    # Your UserModel also has is_active.
    # crud_user.is_user_active can check these.
    if not await crud_user.is_user_active(
        user
    ):  # Check if user is active and not locked
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive or locked.",
        )

    # Update last_login timestamp
    await crud_user.set_last_login(db, user=user)

    # Award daily login XP
    await award_daily_login_xp(db, user=user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.email
        },  # 'sub' (subject) in JWT is typically user's email or ID
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}


class GoogleToken(BaseModel):
    id_token: str


@router.post("/google-login", response_model=Token)
async def google_login(google_token: GoogleToken, db: AsyncSession = Depends(get_db)):
    """
    Handle Google Login/Registration via ID token.
    """
    try:
        idinfo = id_token.verify_oauth2_token(
            google_token.id_token, requests.Request(), settings.GOOGLE_CLIENT_ID
        )
        email = idinfo["email"]
        first_name = idinfo.get("given_name")
        last_name = idinfo.get("family_name") or ""
        profile_pic_url = idinfo.get("picture")

        user = await crud_user.get_user_by_email(db, email=email)

        if not user:
            user_in = UserCreateGoogle(
                first_name=first_name,
                last_name=last_name,
                email=email,
                profile_pic_url=profile_pic_url,
            )
            user = await crud_user.create_user(db, obj_in=user_in)

        # Award daily login XP for Google login
        await award_daily_login_xp(db, user=user)

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError as e:
        # The ValueError now has a message with the definitive cause
        print(f"Error verifying Google token: {e}")
        print(f"Received token: {google_token.id_token}")
        print(f"Google Client ID: {settings.GOOGLE_CLIENT_ID}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate Google credentials: {e}",
        )
    except Exception as e:
        # Catch any other unexpected errors
        print(f"An unexpected error occurred during Google login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred",
        )


@router.get("/me", response_model=UserSchema)
async def read_users_me(
    # current_user will be the Pydantic UserSchema because get_current_active_user converts it
    current_user_response_schema: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Get current logged-in user's details.
    """
    return current_user_response_schema


@router.put("/me/profile-picture", response_model=UserSchema)
async def update_user_profile_picture(
    *,
    db: AsyncSession = Depends(get_db),
    profile_picture_update: UserProfilePictureUpdate,
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Update current user's profile picture URL.
    Does not require password verification for security reasons - profile pictures are not sensitive.
    """
    # Get the actual user model from the database
    user_model = await crud_user.get_user_by_email(db, email=current_user.email)
    if not user_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Validate that the profile picture URL belongs to current user
    expected_prefix = f"profile-pictures/{current_user.id}/"
    if not profile_picture_update.profile_pic_url.startswith(expected_prefix):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid profile picture URL. Must be from your own uploads.",
        )

    # Update the user's profile picture
    updated_user = await crud_user.update_user(
        db,
        db_obj=user_model,
        obj_in={"profile_pic_url": profile_picture_update.profile_pic_url},
    )

    return updated_user


@router.put("/me", response_model=UserSchema)
async def update_user_profile(
    *,
    db: AsyncSession = Depends(get_db),
    user_update: UserUpdate,
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Update current user's profile information.
    Requires current password for security validation.
    Allows updating first_name, last_name, email, and password.
    For profile picture updates, use the separate /me/profile-picture endpoint.
    """
    # Get the actual user model from the database
    user_model = await crud_user.get_user_by_email(db, email=current_user.email)
    if not user_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Validate current password for security
    authenticated_user = await crud_user.authenticate(
        db, email=current_user.email, password=user_update.current_password
    )
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password",
        )

    # If updating email, check if the new email already exists
    if user_update.email and user_update.email != current_user.email:
        existing_user = await crud_user.get_user_by_email(db, email=user_update.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    # Create update data without the current_password field
    update_data = user_update.model_dump(
        exclude={"current_password"}, exclude_unset=True
    )

    # Update the user
    updated_user = await crud_user.update_user(
        db, db_obj=user_model, obj_in=update_data
    )

    return updated_user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    *,
    db: AsyncSession = Depends(get_db),
    forgot_request: ForgotPasswordRequest,
):
    """
    Request password reset email for a user.
    This endpoint always returns success to prevent email enumeration attacks.
    """
    from app.utils.password_reset import find_user_by_email, create_password_reset_token
    from app.services.email_service import email_service

    try:
        user = await find_user_by_email(db, forgot_request.email)

        if user:
            reset_token = await create_password_reset_token(db, user)

            user_name = f"{user.first_name} {user.last_name}".strip()
            await email_service.send_password_reset_email(
                to_email=user.email, reset_token=reset_token, user_name=user_name
            )

    except Exception as e:

        print(f"Error in forgot password: {e}")

    return ForgotPasswordResponse(
        message="If your email address exists in our system, you will receive a password reset link shortly."
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    *,
    db: AsyncSession = Depends(get_db),
    reset_request: ResetPasswordRequest,
):
    """
    Reset user password using a valid reset token.
    """
    from app.utils.password_reset import verify_reset_token, clear_reset_token

    user = await verify_reset_token(db, reset_request.token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    if len(reset_request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long",
        )

    try:
        update_data = {"password": reset_request.new_password}
        await crud_user.update_user(db, db_obj=user, obj_in=update_data)

        await clear_reset_token(db, user)

        return ResetPasswordResponse(
            message="Your password has been successfully reset. You can now log in with your new password."
        )

    except Exception as e:
        await db.rollback()
        print(f"Error resetting password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting your password. Please try again.",
        )
