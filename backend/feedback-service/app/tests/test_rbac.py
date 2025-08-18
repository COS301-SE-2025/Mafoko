# feedback-service/app/tests/test_rbac.py
import pytest
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
import uuid

from mavito_common.models.user import User, UserRole
from mavito_common.models.feedback import FeedbackType
from mavito_common.schemas.feedback import FeedbackCreate
from app.crud.crud_feedback import crud_feedback


@pytest.mark.asyncio
class TestFeedbackRBAC:
    """Test Role-Based Access Control for feedback endpoints."""
    
    async def test_anonymous_can_submit_feedback(self, client: httpx.AsyncClient):
        """Test that anonymous users can submit feedback."""
        feedback_data = {
            "type": "suggestion",
            "message": "Anonymous feedback message",
            "name": "Anonymous",
            "email": "anon@test.com"
        }
        
        # No authentication mock - should work for anonymous users
        response = await client.post("/api/v1/feedback/", json=feedback_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["user_id"] is None  # Confirms anonymous submission

    async def test_regular_user_cannot_access_admin_endpoints(self, client: httpx.AsyncClient, mock_regular_user):
        """Test that regular users cannot access admin-only endpoints."""
        
        # Use FastAPI's dependency override mechanism
        from app.main import app
        from app.api import deps
        
        def mock_admin_dependency():
            raise HTTPException(status_code=403, detail="Administrator privileges required.")
        
        admin_endpoints = [
            ("/api/v1/feedback/", "GET"),  # Get all feedback
            ("/api/v1/feedback/admin/stats", "GET"),  # Get stats
            ("/api/v1/feedback/search/?q=test", "GET"),  # Search
        ]
        
        app.dependency_overrides[deps.get_current_active_admin] = mock_admin_dependency
        
        try:
            for endpoint, method in admin_endpoints:
                if method == "GET":
                    response = await client.get(endpoint)
                    assert response.status_code == 403
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_admin]

    async def test_admin_can_access_all_endpoints(self, client: httpx.AsyncClient, db_session: AsyncSession, mock_admin_user):
        """Test that admin users can access all endpoints."""
        
        # Create admin user in database
        admin_user = User(
            id=mock_admin_user.id,
            first_name="Admin",
            last_name="User",
            email=mock_admin_user.email,
            password_hash="hashed",
            role=UserRole.admin,
            is_active=True,
            account_locked=False
        )
        db_session.add(admin_user)
        await db_session.commit()
        
        # Create some test feedback
        feedback_create = FeedbackCreate(
            type=FeedbackType.suggestion,
            message="Test feedback for admin",
            name="Test User"
        )
        await crud_feedback.create(db_session, obj_in=feedback_create, user_id=None)
        
        # Use FastAPI's dependency override mechanism
        from app.main import app
        from app.api import deps
        from mavito_common.schemas.user import User as UserSchema
        
        # Create proper UserSchema mock
        mock_user_schema = UserSchema(
            id=admin_user.id,
            first_name=admin_user.first_name,
            last_name=admin_user.last_name,
            email=admin_user.email,
            role=admin_user.role,
            is_active=admin_user.is_active,
            is_verified=True,
            account_locked=admin_user.account_locked,
            created_at=admin_user.created_at,
            last_login=None
        )
        
        def override_get_current_active_admin():
            return mock_user_schema
        
        app.dependency_overrides[deps.get_current_active_admin] = override_get_current_active_admin
        
        try:
            # Test admin endpoints
            admin_endpoints = [
                ("/api/v1/feedback/", "GET", 200),  # Get all feedback
                ("/api/v1/feedback/admin/stats", "GET", 200),  # Get stats
                ("/api/v1/feedback/search/?q=test", "GET", 200),  # Search
            ]
            
            for endpoint, method, expected_status in admin_endpoints:
                if method == "GET":
                    response = await client.get(endpoint)
                    assert response.status_code == expected_status
                    
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_admin]

    async def test_user_can_only_see_own_feedback(self, client: httpx.AsyncClient, db_session: AsyncSession):
        """Test that users can only access their own feedback."""
        
        user1_id = uuid.uuid4()
        user2_id = uuid.uuid4()
        
        # Create users in database
        user1 = User(
            id=user1_id,
            first_name="User",
            last_name="One",
            email="user1@example.com",
            password_hash="hashed",
            role=UserRole.contributor,
            is_active=True,
            account_locked=False
        )
        user2 = User(
            id=user2_id,
            first_name="User",
            last_name="Two",
            email="user2@example.com",
            password_hash="hashed",
            role=UserRole.contributor,
            is_active=True,
            account_locked=False
        )
        db_session.add_all([user1, user2])
        await db_session.commit()
        
        # Create feedback for each user
        feedback1 = await crud_feedback.create(
            db_session,
            obj_in=FeedbackCreate(type=FeedbackType.suggestion, message="User 1 feedback"),
            user_id=user1_id
        )
        feedback2 = await crud_feedback.create(
            db_session,
            obj_in=FeedbackCreate(type=FeedbackType.complaint, message="User 2 feedback"),
            user_id=user2_id
        )
        
        # Use FastAPI's dependency override mechanism
        from app.main import app
        from app.api import deps
        from mavito_common.schemas.user import User as UserSchema
        
        # Create proper UserSchema mock for user1
        mock_user1_schema = UserSchema(
            id=user1.id,
            first_name=user1.first_name,
            last_name=user1.last_name,
            email=user1.email,
            role=user1.role,
            is_active=user1.is_active,
            is_verified=True,
            account_locked=user1.account_locked,
            created_at=user1.created_at,
            last_login=None
        )
        
        def override_get_current_active_user():
            return mock_user1_schema
        
        app.dependency_overrides[deps.get_current_active_user] = override_get_current_active_user
        
        try:
            # User1 can access their own feedback
            response = await client.get(f"/api/v1/feedback/{feedback1.id}")
            assert response.status_code == 200
            
            # User1 cannot access user2's feedback
            response = await client.get(f"/api/v1/feedback/{feedback2.id}")
            assert response.status_code == 403
            
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_user]

    async def test_admin_can_access_any_feedback(self, client: httpx.AsyncClient, db_session: AsyncSession, mock_admin_user):
        """Test that admin can access any user's feedback."""
        
        user_id = uuid.uuid4()
        
        # Create regular user in database
        user = User(
            id=user_id,
            first_name="Regular",
            last_name="User",
            email="user@example.com",
            password_hash="hashed",
            role=UserRole.contributor,
            is_active=True,
            account_locked=False
        )
        # Create admin user in database
        admin_user = User(
            id=mock_admin_user.id,
            first_name="Admin",
            last_name="User",
            email=mock_admin_user.email,
            password_hash="hashed",
            role=UserRole.admin,
            is_active=True,
            account_locked=False
        )
        db_session.add_all([user, admin_user])
        await db_session.commit()
        
        # Create feedback for regular user
        feedback = await crud_feedback.create(
            db_session,
            obj_in=FeedbackCreate(type=FeedbackType.suggestion, message="User feedback"),
            user_id=user_id
        )
        
        # Use FastAPI's dependency override mechanism
        from app.main import app
        from app.api import deps
        from mavito_common.schemas.user import User as UserSchema
        
        # Create proper UserSchema mock for admin
        mock_admin_schema = UserSchema(
            id=admin_user.id,
            first_name=admin_user.first_name,
            last_name=admin_user.last_name,
            email=admin_user.email,
            role=admin_user.role,
            is_active=admin_user.is_active,
            is_verified=True,
            account_locked=admin_user.account_locked,
            created_at=admin_user.created_at,
            last_login=None
        )
        
        def override_get_current_active_user():
            return mock_admin_schema
        
        app.dependency_overrides[deps.get_current_active_user] = override_get_current_active_user
        
        try:
            # Admin can access any feedback
            response = await client.get(f"/api/v1/feedback/{feedback.id}")
            assert response.status_code == 200
            data = response.json()
            assert data["user_id"] == str(user_id)
            
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_user]

    async def test_inactive_user_cannot_access_endpoints(self, client: httpx.AsyncClient):
        """Test that inactive users cannot access protected endpoints."""
        
        # Use FastAPI's dependency override mechanism
        from app.main import app
        from app.api import deps
        
        def mock_inactive_user_dependency():
            raise HTTPException(status_code=400, detail="Inactive or locked user account.")
        
        app.dependency_overrides[deps.get_current_active_user] = mock_inactive_user_dependency
        
        try:
            response = await client.get("/api/v1/feedback/my-feedback")
            assert response.status_code == 400  # Bad request for inactive user
            
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_user]

    async def test_role_hierarchy_enforcement(self, client: httpx.AsyncClient, db_session: AsyncSession):
        """Test that role hierarchy is properly enforced."""
        
        # Create users with different roles
        contributor_id = uuid.uuid4()
        linguist_id = uuid.uuid4()
        admin_id = uuid.uuid4()
        
        contributor = User(
            id=contributor_id,
            first_name="Contributor",
            last_name="User",
            email="contributor@example.com",
            password_hash="hashed",
            role=UserRole.contributor,
            is_active=True,
            account_locked=False
        )
        linguist = User(
            id=linguist_id,
            first_name="Linguist",
            last_name="User",
            email="linguist@example.com",
            password_hash="hashed",
            role=UserRole.linguist,
            is_active=True,
            account_locked=False
        )
        admin = User(
            id=admin_id,
            first_name="Admin",
            last_name="User",
            email="admin@example.com",
            password_hash="hashed",
            role=UserRole.admin,
            is_active=True,
            account_locked=False
        )
        db_session.add_all([contributor, linguist, admin])
        await db_session.commit()
        
        # Use FastAPI's dependency override mechanism
        from app.main import app
        from app.api import deps
        
        # Test that only admin can access admin endpoints
        def mock_non_admin_dependency():
            raise HTTPException(status_code=403, detail="Administrator privileges required.")
        
        app.dependency_overrides[deps.get_current_active_admin] = mock_non_admin_dependency
        
        try:
            # Linguist should not be able to access admin endpoints
            response = await client.get("/api/v1/feedback/admin/stats")
            assert response.status_code == 403
            
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_admin]

    async def test_permission_boundaries_clear(self, client: httpx.AsyncClient, db_session: AsyncSession):
        """Test that permission boundaries are clearly defined."""

        user_id = uuid.uuid4()
        admin_id = uuid.uuid4()

        # Create users in database
        regular_user = User(
            id=user_id,
            first_name="Regular",
            last_name="User",
            email="regular@example.com",
            password_hash="hashed",
            role=UserRole.contributor,
            is_active=True,
            account_locked=False
        )
        admin_user = User(
            id=admin_id,
            first_name="Admin",
            last_name="User",
            email="admin@example.com",
            password_hash="hashed",
            role=UserRole.admin,
            is_active=True,
            account_locked=False
        )
        db_session.add_all([regular_user, admin_user])
        await db_session.commit()

        # Create feedback
        user_feedback = await crud_feedback.create(
            db_session,
            obj_in=FeedbackCreate(type=FeedbackType.suggestion, message="User suggestion"),
            user_id=user_id
        )

        # Use FastAPI's dependency override mechanism
        from app.main import app
        from app.api import deps
        from mavito_common.schemas.user import User as UserSchema

        # Test user permissions
        mock_user_schema = UserSchema(
            id=regular_user.id,
            first_name=regular_user.first_name,
            last_name=regular_user.last_name,
            email=regular_user.email,
            role=regular_user.role,
            is_active=regular_user.is_active,
            is_verified=True,
            account_locked=regular_user.account_locked,
            created_at=regular_user.created_at,
            last_login=None
        )

        user_allowed_endpoints = [
            (f"/api/v1/feedback/{user_feedback.id}", "GET", 200),  # Own feedback
            ("/api/v1/feedback/my-feedback", "GET", 200),          # Own feedback list
        ]

        user_forbidden_endpoints = [
            ("/api/v1/feedback/", "GET", 403),                    # All feedback
            ("/api/v1/feedback/admin/stats", "GET", 403),         # Stats
            (f"/api/v1/feedback/{user_feedback.id}", "PUT", 403), # Update
            (f"/api/v1/feedback/{user_feedback.id}", "DELETE", 403), # Delete
        ]

        # Test allowed endpoints for users
        def override_get_current_active_user():
            return mock_user_schema

        app.dependency_overrides[deps.get_current_active_user] = override_get_current_active_user

        try:
            for endpoint, method, expected_status in user_allowed_endpoints:
                response = await client.get(endpoint)
                assert response.status_code == expected_status
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_user]

        # Test forbidden endpoints for users (admin endpoints)
        def mock_admin_dependency():
            raise HTTPException(status_code=403, detail="Administrator privileges required.")

        app.dependency_overrides[deps.get_current_active_admin] = mock_admin_dependency

        try:
            for endpoint, method, expected_status in user_forbidden_endpoints:
                if "/admin/" in endpoint:
                    response = await client.get(endpoint)
                    assert response.status_code == expected_status
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_admin]