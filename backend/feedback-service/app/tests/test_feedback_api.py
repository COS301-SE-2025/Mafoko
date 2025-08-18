# feedback-service/app/tests/test_feedback_api.py
import pytest
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from mavito_common.models.user import User, UserRole
from mavito_common.models.feedback import FeedbackType
from mavito_common.schemas.feedback import FeedbackCreate
from app.crud.crud_feedback import crud_feedback


@pytest.mark.asyncio
class TestFeedbackAPI:
    
    async def test_submit_feedback_anonymous(self, client: httpx.AsyncClient):
        """Test submitting feedback without authentication."""
        feedback_data = {
            "type": "complaint",
            "message": "The application crashes frequently",
            "name": "Anonymous User",
            "email": "anon@example.com"
        }
        
        response = await client.post("/api/v1/feedback/", json=feedback_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "complaint"
        assert data["message"] == "The application crashes frequently"
        assert data["user_id"] is None  # Anonymous
        assert data["status"] == "open"

    async def test_submit_feedback_authenticated(self, client: httpx.AsyncClient, db_session: AsyncSession, mock_regular_user):
        """Test submitting feedback with authentication."""
        # Create user in database first
        user = User(
            id=mock_regular_user.id,
            first_name="Test",
            last_name="User",
            email=mock_regular_user.email,
            password_hash="hashed",
            role=UserRole.contributor,
            is_active=True,
            account_locked=False
        )
        db_session.add(user)
        await db_session.commit()
        
        feedback_data = {
            "type": "suggestion",
            "message": "Please add dark mode",
            "name": "Test User",
            "email": "test@example.com"
        }
        
        # Override dependency with mock user
        from app.main import app
        from app.api.deps import get_current_user_optional
        
        def override_get_current_user_optional():
            return mock_regular_user
        
        app.dependency_overrides[get_current_user_optional] = override_get_current_user_optional
        
        try:
            response = await client.post("/api/v1/feedback/", json=feedback_data)
            
            assert response.status_code == 201
            data = response.json()
            assert data["type"] == "suggestion"
            assert data["user_id"] == str(mock_regular_user.id)
        finally:
            # Clean up override
            del app.dependency_overrides[get_current_user_optional]

    async def test_submit_feedback_validation_error(self, client: httpx.AsyncClient):
        """Test validation error when required fields are missing."""
        incomplete_data = {
            "type": "complaint",
            # Missing required 'message' field
        }
        
        response = await client.post("/api/v1/feedback/", json=incomplete_data)
        
        assert response.status_code == 422  # Validation error

    async def test_get_my_feedback_success(self, client: httpx.AsyncClient, db_session: AsyncSession, mock_regular_user):
        """Test user getting their own feedback."""
        # Create feedback for the user
        user = User(
            id=mock_regular_user.id,
            first_name="Test",
            last_name="User",
            email=mock_regular_user.email,
            password_hash="hashed",
            role=UserRole.contributor,
            is_active=True,
            account_locked=False
        )
        db_session.add(user)
        await db_session.commit()
        
        feedback_create = FeedbackCreate(
            type=FeedbackType.complaint,
            message="My feedback message",
            name="Test User",
            email="test@example.com"
        )
        await crud_feedback.create(db_session, obj_in=feedback_create, user_id=user.id)
        
        # Use FastAPI's dependency override mechanism
        from app.main import app
        from app.api import deps
        from mavito_common.schemas.user import User as UserSchema
        
        # Create proper UserSchema mock
        mock_user_schema = UserSchema(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            is_verified=True,
            account_locked=user.account_locked,
            created_at=user.created_at,
            last_login=None
        )
        
        def override_get_current_active_user():
            return mock_user_schema
        
        app.dependency_overrides[deps.get_current_active_user] = override_get_current_active_user
        
        try:
            response = await client.get("/api/v1/feedback/my-feedback")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["message"] == "My feedback message"
            assert data[0]["user_id"] == str(user.id)
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_user]

    async def test_get_my_feedback_unauthorized(self, client: httpx.AsyncClient):
        """Test getting feedback without authentication fails."""
        response = await client.get("/api/v1/feedback/my-feedback")
        
        assert response.status_code == 401  # Unauthorized

    async def test_get_specific_feedback_as_owner(self, client: httpx.AsyncClient, db_session: AsyncSession, mock_regular_user):
        """Test user accessing their own specific feedback."""
        # Create user and feedback
        user = User(
            id=mock_regular_user.id,
            first_name="Test",
            last_name="User", 
            email=mock_regular_user.email,
            password_hash="hashed",
            role=UserRole.contributor,
            is_active=True,
            account_locked=False
        )
        db_session.add(user)
        await db_session.commit()
        
        feedback_create = FeedbackCreate(
            type=FeedbackType.suggestion,
            message="Specific feedback",
            name="Test User"
        )
        feedback = await crud_feedback.create(db_session, obj_in=feedback_create, user_id=user.id)
        
        # Use FastAPI's dependency override mechanism
        from app.main import app
        from app.api import deps
        from mavito_common.schemas.user import User as UserSchema
        
        # Create proper UserSchema mock
        mock_user_schema = UserSchema(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            is_verified=True,
            account_locked=user.account_locked,
            created_at=user.created_at,
            last_login=None
        )
        
        def override_get_current_active_user():
            return mock_user_schema
        
        app.dependency_overrides[deps.get_current_active_user] = override_get_current_active_user
        
        try:
            response = await client.get(f"/api/v1/feedback/{feedback.id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Specific feedback"
            assert data["user_id"] == str(user.id)
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_user]

    async def test_get_specific_feedback_forbidden(self, client: httpx.AsyncClient, db_session: AsyncSession, mock_regular_user):
        """Test user cannot access other user's feedback."""
        # Create another user and their feedback
        other_user_id = uuid.uuid4()
        other_user = User(
            id=other_user_id,
            first_name="Other",
            last_name="User",
            email="other@example.com",
            password_hash="hashed",
            role=UserRole.contributor,
            is_active=True,
            account_locked=False
        )
        db_session.add(other_user)
        await db_session.commit()
        
        feedback_create = FeedbackCreate(
            type=FeedbackType.complaint,
            message="Someone else's feedback",
            name="Other User"
        )
        feedback = await crud_feedback.create(db_session, obj_in=feedback_create, user_id=other_user_id)
        
        # Create user in database
        user = User(
            id=mock_regular_user.id,
            first_name="Test",
            last_name="User",
            email=mock_regular_user.email,
            password_hash="hashed",
            role=UserRole.contributor,
            is_active=True,
            account_locked=False
        )
        db_session.add(user)
        await db_session.commit()
        
        # Use FastAPI's dependency override mechanism
        from app.main import app
        from app.api import deps
        from mavito_common.schemas.user import User as UserSchema
        
        # Create proper UserSchema mock
        mock_user_schema = UserSchema(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            is_verified=True,
            account_locked=user.account_locked,
            created_at=user.created_at,
            last_login=None
        )
        
        def override_get_current_active_user():
            return mock_user_schema
        
        app.dependency_overrides[deps.get_current_active_user] = override_get_current_active_user
        
        try:
            response = await client.get(f"/api/v1/feedback/{feedback.id}")
            
            assert response.status_code == 403  # Forbidden - can't access other user's feedback
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_user]

    async def test_get_all_feedback_admin_success(self, client: httpx.AsyncClient, db_session: AsyncSession, mock_admin_user):
        """Test admin can get all feedback."""
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
        
        # Create some feedback
        feedback_create = FeedbackCreate(
            type=FeedbackType.suggestion,
            message="Admin can see this",
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
            response = await client.get("/api/v1/feedback/")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) >= 1
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_admin]

    async def test_get_all_feedback_non_admin_forbidden(self, client: httpx.AsyncClient, db_session: AsyncSession, mock_regular_user):
        """Test non-admin cannot get all feedback."""
        # Create user in database
        user = User(
            id=mock_regular_user.id,
            first_name="Test",
            last_name="User",
            email=mock_regular_user.email,
            password_hash="hashed",
            role=UserRole.contributor,
            is_active=True,
            account_locked=False
        )
        db_session.add(user)
        await db_session.commit()
        
        # Use FastAPI's dependency override mechanism
        from app.main import app
        from app.api import deps
        
        def override_get_current_active_admin():
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Administrator privileges required.")
        
        app.dependency_overrides[deps.get_current_active_admin] = override_get_current_active_admin
        
        try:
            response = await client.get("/api/v1/feedback/")
            
            assert response.status_code == 403  # Forbidden
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_admin]

    async def test_update_feedback_admin_success(self, client: httpx.AsyncClient, db_session: AsyncSession, mock_admin_user):
        """Test admin can update feedback status."""
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
        
        # Create feedback
        feedback_create = FeedbackCreate(
            type=FeedbackType.complaint,
            message="Needs admin attention",
            name="User"
        )
        feedback = await crud_feedback.create(db_session, obj_in=feedback_create, user_id=None)
        
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
            update_data = {"status": "in_progress"}
            response = await client.put(f"/api/v1/feedback/{feedback.id}", json=update_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "in_progress"
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_admin]

    async def test_delete_feedback_admin_success(self, client: httpx.AsyncClient, db_session: AsyncSession, mock_admin_user):
        """Test admin can delete feedback."""
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
        
        # Create feedback
        feedback_create = FeedbackCreate(
            type=FeedbackType.suggestion,
            message="To be deleted",
            name="User"
        )
        feedback = await crud_feedback.create(db_session, obj_in=feedback_create, user_id=None)
        
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
            response = await client.delete(f"/api/v1/feedback/{feedback.id}")
            
            assert response.status_code == 200  # Success with message
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_admin]

    async def test_get_feedback_stats_admin(self, client: httpx.AsyncClient, db_session: AsyncSession, mock_admin_user):
        """Test admin can get feedback statistics."""
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
            response = await client.get("/api/v1/feedback/admin/stats")
            
            assert response.status_code == 200
            data = response.json()
            assert "total_feedback" in data
            assert "by_type" in data
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_admin]

    async def test_search_feedback_admin(self, client: httpx.AsyncClient, db_session: AsyncSession, mock_admin_user):
        """Test admin can search feedback."""
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
        
        # Create searchable feedback
        feedback_create = FeedbackCreate(
            type=FeedbackType.suggestion,
            message="This is a searchable feedback message",
            name="User"
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
            response = await client.get("/api/v1/feedback/search/?q=searchable")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) >= 1
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_admin]

    async def test_search_feedback_short_query(self, client: httpx.AsyncClient, db_session: AsyncSession, mock_admin_user):
        """Test search with query too short."""
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
            response = await client.get("/api/v1/feedback/search/?q=ab")  # Too short
            
            assert response.status_code == 400  # Bad request
        finally:
            # Clean up override
            del app.dependency_overrides[deps.get_current_active_admin]