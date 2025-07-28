# backend/app/tests/test_admin.py
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from mavito_common.models.user import UserRole, User as UserModel
from app.api.v1.endpoints.admin import update_user_role, get_all_users, require_admin
from mavito_common.schemas.user import User as UserSchema
from app.api.deps import get_current_active_admin


@pytest.fixture
def mock_db():
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def mock_admin_user():
    user = MagicMock(spec=UserModel)
    user.id = uuid4()
    user.email = "admin@example.com"
    user.role = UserRole.admin
    user.is_active = True
    user.account_locked = False
    user.is_verified = True
    return user


@pytest.fixture
def mock_target_user():
    user = MagicMock(spec=UserModel)
    user.id = uuid4()
    user.email = "target@example.com"
    user.role = UserRole.contributor
    user.is_active = True
    user.account_locked = False
    user.is_verified = True
    return user


@pytest.fixture
def mock_non_admin_user():
    user = MagicMock(spec=UserModel)
    user.id = uuid4()
    user.email = "user@example.com"
    user.role = UserRole.contributor
    user.is_active = True
    user.account_locked = False
    user.is_verified = True
    return user


@pytest.fixture
def mock_linguist_user():
    user = MagicMock(spec=UserModel)
    user.id = uuid4()
    user.email = "linguist@example.com"
    user.role = UserRole.linguist
    user.is_active = True
    user.account_locked = False
    user.is_verified = True
    return user


# ==================== UPDATE USER ROLE TESTS ====================


@pytest.mark.asyncio
async def test_update_user_role_success_contributor_to_linguist(
    mock_db, mock_admin_user, mock_target_user
):
    """Test successful role update from contributor to linguist"""
    with patch("app.api.v1.endpoints.admin.crud_user") as mock_crud:
        mock_target_user.role = UserRole.linguist  # Updated role
        mock_crud.get_user_by_uuid = AsyncMock(return_value=mock_target_user)
        mock_crud.update_user = AsyncMock(return_value=mock_target_user)

        new_role = UserRole.linguist

        response = await update_user_role(
            user_id=mock_target_user.id,
            new_role=new_role,
            db=mock_db,
            current_user=mock_admin_user,
        )

        assert (
            response["message"]
            == f"Role updated to {UserRole.linguist} for user {mock_target_user.email}"
        )
        mock_crud.get_user_by_uuid.assert_called_once_with(
            mock_db, user_id=mock_target_user.id
        )
        mock_crud.update_user.assert_called_once_with(
            mock_db, db_obj=mock_target_user, obj_in={"role": new_role}
        )


@pytest.mark.asyncio
async def test_update_user_role_success_linguist_to_admin(
    mock_db, mock_admin_user, mock_linguist_user
):
    """Test successful role update from linguist to admin"""
    with patch("app.api.v1.endpoints.admin.crud_user") as mock_crud:
        mock_linguist_user.role = UserRole.admin  # Updated role
        mock_crud.get_user_by_uuid = AsyncMock(return_value=mock_linguist_user)
        mock_crud.update_user = AsyncMock(return_value=mock_linguist_user)

        new_role = UserRole.admin

        response = await update_user_role(
            user_id=mock_linguist_user.id,
            new_role=new_role,
            db=mock_db,
            current_user=mock_admin_user,
        )

        assert (
            response["message"]
            == f"Role updated to {UserRole.admin} for user {mock_linguist_user.email}"
        )


@pytest.mark.asyncio
async def test_update_user_role_success_admin_to_contributor(mock_db, mock_admin_user):
    """Test successful role update from admin to contributor (demoting another admin)"""
    target_admin = MagicMock(spec=UserModel)
    target_admin.id = uuid4()
    target_admin.email = "target_admin@example.com"
    target_admin.role = UserRole.contributor  # Updated role

    with patch("app.api.v1.endpoints.admin.crud_user") as mock_crud:
        mock_crud.get_user_by_uuid = AsyncMock(return_value=target_admin)
        mock_crud.update_user = AsyncMock(return_value=target_admin)

        new_role = UserRole.contributor

        response = await update_user_role(
            user_id=target_admin.id,
            new_role=new_role,
            db=mock_db,
            current_user=mock_admin_user,
        )

        assert (
            response["message"]
            == f"Role updated to {UserRole.contributor} for user {target_admin.email}"
        )


@pytest.mark.asyncio
async def test_update_user_role_unauthorized_contributor(
    mock_db, mock_target_user, mock_non_admin_user
):
    """Test unauthorized access with contributor role"""
    with pytest.raises(HTTPException) as exc_info:
        await update_user_role(
            user_id=mock_target_user.id,
            new_role=UserRole.admin,
            db=mock_db,
            current_user=mock_non_admin_user,
        )

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert "Admin privileges required." in exc_info.value.detail


@pytest.mark.asyncio
async def test_update_user_role_unauthorized_linguist(
    mock_db, mock_target_user, mock_linguist_user
):
    """Test unauthorized access with linguist role"""
    with pytest.raises(HTTPException) as exc_info:
        await update_user_role(
            user_id=mock_target_user.id,
            new_role=UserRole.admin,
            db=mock_db,
            current_user=mock_linguist_user,
        )

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert "Admin privileges required." in exc_info.value.detail


@pytest.mark.asyncio
async def test_update_user_role_user_not_found(mock_db, mock_admin_user):
    """Test user not found scenario"""
    with patch("app.api.v1.endpoints.admin.crud_user") as mock_crud:
        mock_crud.get_user_by_uuid = AsyncMock(return_value=None)

        with pytest.raises(HTTPException) as exc_info:
            await update_user_role(
                user_id=uuid4(),
                new_role=UserRole.linguist,
                db=mock_db,
                current_user=mock_admin_user,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "User not found" in exc_info.value.detail


@pytest.mark.asyncio
async def test_update_user_role_invalid_uuid(mock_db, mock_admin_user):
    """Test with invalid UUID format"""
    with patch("app.api.v1.endpoints.admin.crud_user") as mock_crud:
        mock_crud.get_user_by_uuid = AsyncMock(return_value=None)

        random_uuid = uuid4()
        with pytest.raises(HTTPException) as exc_info:
            await update_user_role(
                user_id=random_uuid,
                new_role=UserRole.linguist,
                db=mock_db,
                current_user=mock_admin_user,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_update_user_role_same_role(mock_db, mock_admin_user, mock_target_user):
    """Test updating user to the same role they already have"""
    with patch("app.api.v1.endpoints.admin.crud_user") as mock_crud:
        mock_crud.get_user_by_uuid = AsyncMock(return_value=mock_target_user)
        mock_crud.update_user = AsyncMock(return_value=mock_target_user)

        # Try to update to the same role
        current_role = mock_target_user.role

        response = await update_user_role(
            user_id=mock_target_user.id,
            new_role=current_role,
            db=mock_db,
            current_user=mock_admin_user,
        )

        assert (
            response["message"]
            == f"Role updated to {current_role} for user {mock_target_user.email}"
        )
        mock_crud.update_user.assert_called_once()


@pytest.mark.asyncio
async def test_update_user_role_database_error(
    mock_db, mock_admin_user, mock_target_user
):
    """Test database error during role update"""
    with patch("app.api.v1.endpoints.admin.crud_user") as mock_crud:
        mock_crud.get_user_by_uuid = AsyncMock(return_value=mock_target_user)
        mock_crud.update_user = AsyncMock(side_effect=Exception("Database error"))

        with pytest.raises(Exception) as exc_info:
            await update_user_role(
                user_id=mock_target_user.id,
                new_role=UserRole.linguist,
                db=mock_db,
                current_user=mock_admin_user,
            )

        assert "Database error" in str(exc_info.value)


# ==================== GET ALL USERS TESTS ====================


@pytest.mark.asyncio
async def test_get_all_users_success_multiple_users(mock_db, mock_admin_user):
    """Test successful retrieval of multiple users"""
    mock_users = []
    fake_validated = []

    # Create different types of users
    for i, role in enumerate([UserRole.admin, UserRole.linguist, UserRole.contributor]):
        user = MagicMock(spec=UserModel)
        user.id = uuid4()
        user.email = f"user{i}@example.com"
        user.role = role
        mock_users.append(user)

        validated_user = MagicMock(spec=UserSchema)
        validated_user.id = user.id
        validated_user.email = user.email
        validated_user.role = role
        fake_validated.append(validated_user)

    with (
        patch("app.api.v1.endpoints.admin.crud_user") as mock_crud,
        patch(
            "mavito_common.schemas.user.User.model_validate", side_effect=fake_validated
        ),
    ):
        mock_crud.get_all_users = AsyncMock(return_value=mock_users)

        result = await get_all_users(db=mock_db, current_user=mock_admin_user)

        assert len(result) == 3
        assert result == fake_validated
        mock_crud.get_all_users.assert_called_once_with(mock_db)


@pytest.mark.asyncio
async def test_get_all_users_success_empty_list(mock_db, mock_admin_user):
    """Test successful retrieval when no users exist"""
    with patch("app.api.v1.endpoints.admin.crud_user") as mock_crud:
        mock_crud.get_all_users = AsyncMock(return_value=[])

        result = await get_all_users(db=mock_db, current_user=mock_admin_user)

        assert result == []
        mock_crud.get_all_users.assert_called_once_with(mock_db)


@pytest.mark.asyncio
async def test_get_all_users_success_single_user(mock_db, mock_admin_user):
    """Test successful retrieval of single user"""
    mock_user = MagicMock(spec=UserModel)
    mock_user.id = uuid4()
    mock_user.email = "single@example.com"
    mock_user.role = UserRole.contributor

    fake_validated = MagicMock(spec=UserSchema)
    fake_validated.id = mock_user.id
    fake_validated.email = mock_user.email
    fake_validated.role = mock_user.role

    with (
        patch("app.api.v1.endpoints.admin.crud_user") as mock_crud,
        patch(
            "mavito_common.schemas.user.User.model_validate",
            return_value=fake_validated,
        ),
    ):
        mock_crud.get_all_users = AsyncMock(return_value=[mock_user])

        result = await get_all_users(db=mock_db, current_user=mock_admin_user)

        assert len(result) == 1
        assert result[0] == fake_validated


@pytest.mark.asyncio
async def test_get_all_users_database_error(mock_db, mock_admin_user):
    """Test database error during user retrieval"""
    with patch("app.api.v1.endpoints.admin.crud_user") as mock_crud:
        mock_crud.get_all_users = AsyncMock(
            side_effect=Exception("Database connection failed")
        )

        with pytest.raises(Exception) as exc_info:
            await get_all_users(db=mock_db, current_user=mock_admin_user)

        assert "Database connection failed" in str(exc_info.value)


@pytest.mark.asyncio
async def test_get_all_users_validation_error(mock_db, mock_admin_user):
    """Test Pydantic validation error during user serialization"""
    mock_user = MagicMock(spec=UserModel)
    mock_user.id = uuid4()
    mock_user.email = "test@example.com"
    mock_user.role = UserRole.contributor

    with (
        patch("app.api.v1.endpoints.admin.crud_user") as mock_crud,
        patch(
            "mavito_common.schemas.user.User.model_validate",
            side_effect=ValueError("Validation failed"),
        ),
    ):
        mock_crud.get_all_users = AsyncMock(return_value=[mock_user])

        with pytest.raises(ValueError) as exc_info:
            await get_all_users(db=mock_db, current_user=mock_admin_user)

        assert "Validation failed" in str(exc_info.value)


# ==================== REQUIRE_ADMIN FUNCTION TESTS ====================


def test_require_admin_success(mock_admin_user):
    """Test require_admin with valid admin user"""
    result = require_admin(mock_admin_user)
    assert result == mock_admin_user


def test_require_admin_failure_contributor(mock_non_admin_user):
    """Test require_admin with contributor user"""
    with pytest.raises(HTTPException) as exc_info:
        require_admin(mock_non_admin_user)

    assert exc_info.value.status_code == 403
    assert "Admin privileges required." in exc_info.value.detail


def test_require_admin_failure_linguist(mock_linguist_user):
    """Test require_admin with linguist user"""
    with pytest.raises(HTTPException) as exc_info:
        require_admin(mock_linguist_user)

    assert exc_info.value.status_code == 403
    assert "Admin privileges required." in exc_info.value.detail


def test_require_admin_failure_none_role():
    """Test require_admin with user having None role"""
    user = MagicMock(spec=UserModel)
    user.role = None

    with pytest.raises(HTTPException) as exc_info:
        require_admin(user)

    assert exc_info.value.status_code == 403


# ==================== DEPENDENCY TESTS ====================


@pytest.mark.asyncio
async def test_get_current_active_admin_success():
    """Test get_current_active_admin with valid admin user"""
    admin_schema = MagicMock(spec=UserSchema)
    admin_schema.role = UserRole.admin

    result = await get_current_active_admin(current_user=admin_schema)
    assert result == admin_schema


@pytest.mark.asyncio
async def test_get_current_active_admin_forbidden_contributor():
    """Test get_current_active_admin with contributor user"""
    user_schema = MagicMock(spec=UserSchema)
    user_schema.role = UserRole.contributor

    with pytest.raises(HTTPException) as exc_info:
        await get_current_active_admin(current_user=user_schema)

    assert exc_info.value.status_code == 403
    assert "Administrator privileges required." in exc_info.value.detail


@pytest.mark.asyncio
async def test_get_current_active_admin_forbidden_linguist():
    """Test get_current_active_admin with linguist user"""
    user_schema = MagicMock(spec=UserSchema)
    user_schema.role = UserRole.linguist

    with pytest.raises(HTTPException) as exc_info:
        await get_current_active_admin(current_user=user_schema)

    assert exc_info.value.status_code == 403
    assert "Administrator privileges required." in exc_info.value.detail


# ==================== EDGE CASE TESTS ====================


@pytest.mark.asyncio
async def test_update_user_role_all_possible_role_combinations(
    mock_db, mock_admin_user
):
    """Test all possible role update combinations"""
    roles = [UserRole.admin, UserRole.linguist, UserRole.contributor]

    for from_role in roles:
        for to_role in roles:
            user = MagicMock(spec=UserModel)
            user.id = uuid4()
            user.email = f"user_{from_role.value}_to_{to_role.value}@example.com"
            user.role = to_role  # Final role after update

            with patch("app.api.v1.endpoints.admin.crud_user") as mock_crud:
                mock_crud.get_user_by_uuid = AsyncMock(return_value=user)
                mock_crud.update_user = AsyncMock(return_value=user)

                response = await update_user_role(
                    user_id=user.id,
                    new_role=to_role,
                    db=mock_db,
                    current_user=mock_admin_user,
                )

                assert f"Role updated to {to_role}" in response["message"]
                assert user.email in response["message"]


@pytest.mark.asyncio
async def test_get_all_users_with_mixed_user_states(mock_db, mock_admin_user):
    """Test get_all_users with users in different states (active, inactive, locked)"""
    mock_users = []
    fake_validated = []

    # Create users with different states
    states = [
        {"is_active": True, "account_locked": False, "is_verified": True},
        {"is_active": False, "account_locked": False, "is_verified": True},
        {"is_active": True, "account_locked": True, "is_verified": False},
    ]

    for i, state in enumerate(states):
        user = MagicMock(spec=UserModel)
        user.id = uuid4()
        user.email = f"user{i}@example.com"
        user.role = UserRole.contributor
        for key, value in state.items():
            setattr(user, key, value)
        mock_users.append(user)

        validated_user = MagicMock(spec=UserSchema)
        validated_user.id = user.id
        validated_user.email = user.email
        validated_user.role = user.role
        fake_validated.append(validated_user)

    with (
        patch("app.api.v1.endpoints.admin.crud_user") as mock_crud,
        patch(
            "mavito_common.schemas.user.User.model_validate", side_effect=fake_validated
        ),
    ):
        mock_crud.get_all_users = AsyncMock(return_value=mock_users)

        result = await get_all_users(db=mock_db, current_user=mock_admin_user)

        assert len(result) == 3
        # All users should be returned regardless of their state
        assert result == fake_validated
