# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from google.oauth2 import id_token
from google.auth.transport import requests
from pydantic import BaseModel
from mavito_common.schemas.user import UserCreate, User as UserSchema , UserCreateGoogle
from mavito_common.schemas.token import Token
from mavito_common.core.security import create_access_token
from mavito_common.core.config import settings
from mavito_common.db.session import get_db
from app.api import deps
from mavito_common.models.user import User as UserModel  # noqa: F401
from app.crud.crud_user import crud_user
from mavito_common.models.user import UserRole


router = APIRouter()


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
async def google_login(
    google_token: GoogleToken,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Google Login/Registration via ID token.
    """
    try:
        idinfo = id_token.verify_oauth2_token(
            google_token.id_token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        email = idinfo['email']
        first_name = idinfo.get('given_name')
        last_name = idinfo.get('family_name') or ""
        profile_pic_url = idinfo.get('picture')

        user = await crud_user.get_user_by_email(db, email=email)

        if not user:
            user_in = UserCreateGoogle(
                first_name=first_name,
                last_name=last_name,
                email=email,
                profile_pic_url=profile_pic_url
                
            )
            user = await crud_user.create_user(db, obj_in=user_in)
        
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
