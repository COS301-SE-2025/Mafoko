# backend/app/tests/test_auth.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import timedelta
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from mavito_common.models.user import UserRole

from app.api.v1.endpoints.auth import (
    register_new_user,
    login_for_access_token,
    read_users_me,
)
from mavito_common.schemas.user import UserCreate
from mavito_common.models.user import User as UserModel


class TestRegisterNewUser:
    @pytest.fixture
    def mock_db(self):
        return AsyncMock(spec=AsyncSession)

    @pytest.fixture
    def valid_user_create(self):
        return UserCreate(
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com",
            password="securepassword123",
        )

    @pytest.fixture
    def mock_user_model(self):
        user = MagicMock(spec=UserModel)
        user.first_name = "John"
        # ... other mock attributes
        return user

    @pytest.mark.asyncio
    async def test_register_new_user_success(
        self, mock_db, valid_user_create, mock_user_model
    ):
        """Test successful user registration."""
        with patch("app.api.v1.endpoints.auth.crud_user") as mock_crud:
            mock_crud.get_user_by_email = AsyncMock(return_value=None)
            mock_crud.create_user = AsyncMock(return_value=mock_user_model)

            # Define the expected payload with the role set
            expected_payload = valid_user_create.model_copy(
                update={"role": UserRole.contributor}
            )

            result = await register_new_user(db=mock_db, user_in=valid_user_create)

            assert result == mock_user_model
            mock_crud.get_user_by_email.assert_called_once_with(
                mock_db, email=valid_user_create.email
            )

            # Assert that create_user was called with the correct, modified payload
            mock_crud.create_user.assert_called_once_with(
                mock_db, obj_in=expected_payload
            )

    @pytest.mark.asyncio
    async def test_register_new_user_email_already_exists(
        self, mock_db, valid_user_create, mock_user_model
    ):
        """Test registration with existing email."""
        with patch("app.api.v1.endpoints.auth.crud_user") as mock_crud:
            # Setup mocks - user already exists
            mock_crud.get_user_by_email = AsyncMock(return_value=mock_user_model)

            # Call the endpoint and expect HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await register_new_user(db=mock_db, user_in=valid_user_create)

            # Assertions
            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "already exists" in exc_info.value.detail
            mock_crud.get_user_by_email.assert_called_once_with(
                mock_db, email=valid_user_create.email
            )
            # create_user should not be called since user already exists
            assert (
                not hasattr(mock_crud, "create_user")
                or not mock_crud.create_user.called
            )

    @pytest.mark.asyncio
    async def test_register_new_user_database_error(self, mock_db, valid_user_create):
        """Test registration when database operations fail."""
        with patch("app.api.v1.endpoints.auth.crud_user") as mock_crud:
            # Setup mocks - database error
            mock_crud.get_user_by_email = AsyncMock(
                side_effect=Exception("Database connection error")
            )

            # Call the endpoint and expect exception to propagate
            with pytest.raises(Exception) as exc_info:
                await register_new_user(db=mock_db, user_in=valid_user_create)

            assert "Database connection error" in str(exc_info.value)


class TestLoginForAccessToken:
    """Test cases for the login_for_access_token endpoint."""

    @pytest.fixture
    def mock_db(self):
        """Mock database session."""
        return AsyncMock(spec=AsyncSession)

    @pytest.fixture
    def mock_form_data(self):
        """Mock OAuth2PasswordRequestForm."""
        form_data = MagicMock(spec=OAuth2PasswordRequestForm)
        form_data.username = "john.doe@example.com"  # Email as username
        form_data.password = "securepassword123"
        return form_data

    @pytest.fixture
    def mock_user_model(self):
        """Mock authenticated user model."""
        user = MagicMock(spec=UserModel)
        user.id = 1
        user.email = "john.doe@example.com"
        user.is_active = True
        return user

    @pytest.mark.asyncio
    async def test_login_success(self, mock_db, mock_form_data, mock_user_model):
        """Test successful login."""
        with patch("app.api.v1.endpoints.auth.crud_user") as mock_crud, patch(
            "app.api.v1.endpoints.auth.create_access_token"
        ) as mock_create_token, patch(
            "app.api.v1.endpoints.auth.settings"
        ) as mock_settings:

            # Setup mocks - make them async
            mock_crud.authenticate = AsyncMock(return_value=mock_user_model)
            mock_crud.is_user_active = AsyncMock(return_value=True)
            mock_crud.set_last_login = AsyncMock(return_value=None)
            mock_create_token.return_value = "fake_access_token"
            mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30

            # Call the endpoint
            result = await login_for_access_token(db=mock_db, form_data=mock_form_data)

            # Assertions
            assert result == {
                "access_token": "fake_access_token",
                "token_type": "bearer",
            }
            mock_crud.authenticate.assert_called_once_with(
                mock_db, email=mock_form_data.username, password=mock_form_data.password
            )
            mock_crud.is_user_active.assert_called_once_with(mock_user_model)
            mock_crud.set_last_login.assert_called_once_with(
                mock_db, user=mock_user_model
            )
            mock_create_token.assert_called_once_with(
                data={"sub": mock_user_model.email}, expires_delta=timedelta(minutes=30)
            )

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, mock_db, mock_form_data):
        """Test login with invalid credentials."""
        with patch("app.api.v1.endpoints.auth.crud_user") as mock_crud:
            # Setup mocks - authentication fails
            mock_crud.authenticate = AsyncMock(return_value=None)

            # Call the endpoint and expect HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await login_for_access_token(db=mock_db, form_data=mock_form_data)

            # Assertions
            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert "Incorrect email or password" in exc_info.value.detail
            assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}
            mock_crud.authenticate.assert_called_once_with(
                mock_db, email=mock_form_data.username, password=mock_form_data.password
            )

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, mock_db, mock_form_data, mock_user_model):
        """Test login with inactive/locked user account."""
        with patch("app.api.v1.endpoints.auth.crud_user") as mock_crud:
            # Setup mocks - user exists but is inactive
            mock_crud.authenticate = AsyncMock(return_value=mock_user_model)
            mock_crud.is_user_active = AsyncMock(return_value=False)

            # Call the endpoint and expect HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await login_for_access_token(db=mock_db, form_data=mock_form_data)

            # Assertions
            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "inactive or locked" in exc_info.value.detail
            mock_crud.authenticate.assert_called_once()
            mock_crud.is_user_active.assert_called_once_with(mock_user_model)

    @pytest.mark.asyncio
    async def test_login_set_last_login_fails(
        self, mock_db, mock_form_data, mock_user_model
    ):
        """Test login when setting last_login timestamp fails."""
        with patch("app.api.v1.endpoints.auth.crud_user") as mock_crud, patch(
            "app.api.v1.endpoints.auth.create_access_token"
        ) as mock_create_token, patch(
            "app.api.v1.endpoints.auth.settings"
        ) as mock_settings:

            # Setup mocks
            mock_crud.authenticate = AsyncMock(return_value=mock_user_model)
            mock_crud.is_user_active = AsyncMock(return_value=True)
            mock_crud.set_last_login = AsyncMock(
                side_effect=Exception("Database update failed")
            )
            mock_create_token.return_value = "fake_access_token"
            mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30

            # Call the endpoint and expect exception to propagate
            with pytest.raises(Exception) as exc_info:
                await login_for_access_token(db=mock_db, form_data=mock_form_data)

            assert "Database update failed" in str(exc_info.value)


class TestReadUsersMe:
    """Test cases for the read_users_me endpoint."""

    @pytest.fixture
    def mock_current_user(self):
        """Mock current user schema with proper field structure."""
        from uuid import uuid4
        from datetime import datetime

        # Create a mock that matches your actual UserSchema structure
        user_data = {
            "id": uuid4(),
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "is_active": True,
            "role": "linguist",  # Use valid enum value
            "is_verified": True,
            "account_locked": False,
            "created_at": datetime.now(),
            "profile_pic_url": None,
        }

        # Use MagicMock to avoid Pydantic validation issues in tests
        mock_user = MagicMock()
        for key, value in user_data.items():
            setattr(mock_user, key, value)

        return mock_user

    @pytest.mark.asyncio
    async def test_read_users_me_success(self, mock_current_user):
        """Test successful retrieval of current user details."""
        # Call the endpoint
        result = await read_users_me(current_user_response_schema=mock_current_user)

        # Assertions
        assert result == mock_current_user
        assert result.email == "john.doe@example.com"
        assert result.first_name == "John"
        assert result.last_name == "Doe"

    @pytest.mark.asyncio
    async def test_read_users_me_different_user_data(self):
        """Test with different user data to ensure endpoint works correctly."""
        from uuid import uuid4
        from datetime import datetime

        # Create mock user with proper structure
        user_data = {
            "id": uuid4(),
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@example.com",
            "is_active": True,
            "role": "researcher",  # Use valid enum value
            "is_verified": True,
            "account_locked": False,
            "created_at": datetime.now(),
            "profile_pic_url": None,
        }

        different_user = MagicMock()
        for key, value in user_data.items():
            setattr(different_user, key, value)

        # Call the endpoint
        result = await read_users_me(current_user_response_schema=different_user)

        # Assertions
        assert result == different_user
        assert result.email == "jane.smith@example.com"
        assert result.role == "researcher"


class TestAuthIntegration:
    """Integration-style tests for auth endpoints."""

    @pytest.mark.asyncio
    async def test_token_creation_format(self):
        """Test that token creation uses correct format and data."""
        mock_user = MagicMock(spec=UserModel)
        mock_user.email = "test@example.com"

        with patch(
            "app.api.v1.endpoints.auth.create_access_token"
        ) as mock_create_token, patch(
            "app.api.v1.endpoints.auth.settings"
        ) as mock_settings:

            mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 60
            mock_create_token.return_value = "token_123"

            # Simulate token creation call from login endpoint
            access_token_expires = timedelta(
                minutes=mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
            token = mock_create_token(
                data={"sub": mock_user.email}, expires_delta=access_token_expires
            )

            # Verify token creation parameters
            mock_create_token.assert_called_with(
                data={"sub": "test@example.com"}, expires_delta=timedelta(minutes=60)
            )
            assert token == "token_123"

    @pytest.mark.asyncio
    async def test_error_response_format(self):
        """Test that error responses have correct format."""
        mock_db = AsyncMock(spec=AsyncSession)

        with patch("app.api.v1.endpoints.auth.crud_user") as mock_crud:
            mock_crud.get_user_by_email = AsyncMock(
                return_value=MagicMock()
            )  # User exists

            user_data = UserCreate(
                first_name="Test",
                last_name="User",
                email="existing@example.com",
                password="password123",
            )

            with pytest.raises(HTTPException) as exc_info:
                await register_new_user(db=mock_db, user_in=user_data)

            # Verify error format
            assert exc_info.value.status_code == 400
            assert isinstance(exc_info.value.detail, str)
            assert "already exists" in exc_info.value.detail


# Additional fixtures and utilities for testing
@pytest.fixture
def mock_settings():
    """Mock settings configuration."""
    mock_settings = MagicMock()
    mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
    return mock_settings


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "password": "securepassword123",
    }


# Parametrized tests for edge cases
class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    @pytest.mark.parametrize(
        "email",
        [
            "user@domain.com",
            "user.name+tag@domain.co.uk",
            "user123@subdomain.domain.org",
        ],
    )
    @pytest.mark.asyncio
    async def test_register_with_various_email_formats(self, email):
        """Test registration with various valid email formats."""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_user_model = MagicMock(spec=UserModel)

        with patch("app.api.v1.endpoints.auth.crud_user") as mock_crud:
            mock_crud.get_user_by_email = AsyncMock(return_value=None)
            mock_crud.create_user = AsyncMock(return_value=mock_user_model)

            user_data = UserCreate(
                first_name="Test", last_name="User", email=email, password="password123"
            )

            result = await register_new_user(db=mock_db, user_in=user_data)
            assert result == mock_user_model

    # @pytest.mark.parametrize("password", [
    #     "short",
    #     "a" * 100,  # very long password
    #     "password with spaces",
    #     "pass@word#123!"
    # ])
    # @pytest.mark.asyncio
    # async def test_login_with_various_password_formats(self, password):
    #     """Test login with various password formats."""
    #     mock_db = AsyncMock(spec=AsyncSession)
    #     mock_user = MagicMock(spec=UserModel)
    #     mock_user.email = "test@example.com"

    #     form_data = MagicMock(spec=OAuth2PasswordRequestForm)
    #     form_data.username = "test@example.com"
    #     form_data.password = password

    #     with patch('app.api.v1.endpoints.auth.crud_user') as mock_crud, \
    #          patch('app.api.v1.endpoints.auth.create_access_token'), \
    #          patch('app.api.v1.endpoints.auth.settings'):

    #         mock_crud.authenticate.return_value = mock_user
    #         mock_crud.is_user_active.return_value = True
    #         mock_crud.set_last_login.return_value = None

    #         # Should not raise exception regardless of password format
    #         # (validation happens in crud_user.authenticate)
    #         result = await login_for_access_token(db=mock_db, form_data=form_data)
    #         assert "access_token" in result
    #         assert result["token_type"] == "bearer"
