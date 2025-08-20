# feedback-service/app/tests/test_feedback_crud.py
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.crud.crud_feedback import crud_feedback
from mavito_common.schemas.feedback import FeedbackCreate, FeedbackUpdate
from mavito_common.models.feedback import FeedbackType, FeedbackStatus
from mavito_common.models.user import User


@pytest.mark.asyncio
class TestCRUDFeedback:

    async def test_create_feedback_anonymous(
        self, db_session: AsyncSession, sample_feedback_data
    ):
        """Test creating feedback without user association."""
        feedback_create = FeedbackCreate(**sample_feedback_data)

        feedback = await crud_feedback.create(db_session, obj_in=feedback_create)

        assert feedback.type == FeedbackType.complaint
        assert feedback.message == "The system is running very slowly today."
        assert feedback.name == "Test User"
        assert feedback.email == "test@example.com"
        assert feedback.user_id is None  # Anonymous
        assert feedback.status == FeedbackStatus.open
        assert feedback.created_at is not None

    async def test_create_feedback_with_user(
        self, db_session: AsyncSession, sample_feedback_data, regular_user_data
    ):
        """Test creating feedback with user association."""
        # Create user first
        user = User(**regular_user_data, password_hash="hashed_password")
        db_session.add(user)
        await db_session.commit()

        feedback_create = FeedbackCreate(**sample_feedback_data)

        feedback = await crud_feedback.create(
            db_session, obj_in=feedback_create, user_id=user.id
        )

        assert feedback.user_id == user.id
        assert feedback.status == FeedbackStatus.open

    async def test_get_feedback_by_id(
        self, db_session: AsyncSession, sample_feedback_data
    ):
        """Test retrieving feedback by ID."""
        feedback_create = FeedbackCreate(**sample_feedback_data)
        created_feedback = await crud_feedback.create(
            db_session, obj_in=feedback_create
        )

        retrieved_feedback = await crud_feedback.get(db_session, created_feedback.id)

        assert retrieved_feedback is not None
        assert retrieved_feedback.id == created_feedback.id
        assert retrieved_feedback.message == sample_feedback_data["message"]

    async def test_get_feedback_not_found(self, db_session: AsyncSession):
        """Test retrieving non-existent feedback returns None."""
        non_existent_id = uuid.uuid4()

        feedback = await crud_feedback.get(db_session, non_existent_id)

        assert feedback is None

    async def test_get_multi_feedback(self, db_session: AsyncSession):
        """Test retrieving multiple feedback entries."""
        # Create multiple feedback entries
        feedback_data = [
            {
                "type": FeedbackType.complaint,
                "message": "Issue 1",
                "name": "User 1",
                "email": "user1@test.com",
            },
            {
                "type": FeedbackType.suggestion,
                "message": "Suggestion 1",
                "name": "User 2",
                "email": "user2@test.com",
            },
            {
                "type": FeedbackType.compliment,
                "message": "Great job!",
                "name": "User 3",
                "email": "user3@test.com",
            },
        ]

        for data in feedback_data:
            feedback_create = FeedbackCreate(**data)
            await crud_feedback.create(db_session, obj_in=feedback_create)

        # Test getting all feedback
        all_feedback = await crud_feedback.get_multi(db_session, skip=0, limit=10)
        assert len(all_feedback) == 3

        # Test pagination
        paginated = await crud_feedback.get_multi(db_session, skip=1, limit=1)
        assert len(paginated) == 1

        # Test filtering by type
        complaints = await crud_feedback.get_multi(
            db_session, feedback_type=FeedbackType.complaint
        )
        assert len(complaints) == 1
        assert complaints[0].type == FeedbackType.complaint

    async def test_update_feedback(
        self, db_session: AsyncSession, sample_feedback_data, admin_user_data
    ):
        """Test updating feedback status and admin response."""
        # Create admin user
        admin_user = User(**admin_user_data, password_hash="hashed_password")
        db_session.add(admin_user)
        await db_session.commit()

        # Create feedback
        feedback_create = FeedbackCreate(**sample_feedback_data)
        feedback = await crud_feedback.create(db_session, obj_in=feedback_create)

        # Update feedback
        update_data = FeedbackUpdate(
            status=FeedbackStatus.resolved,
            admin_response="Thank you for your feedback. We have addressed the issue.",
        )

        updated_feedback = await crud_feedback.update(
            db_session, db_obj=feedback, obj_in=update_data, admin_user_id=admin_user.id
        )

        assert updated_feedback.status == FeedbackStatus.resolved
        assert (
            updated_feedback.admin_response
            == "Thank you for your feedback. We have addressed the issue."
        )
        assert updated_feedback.resolved_at is not None
        assert updated_feedback.resolved_by_user_id == admin_user.id

    async def test_delete_feedback(
        self, db_session: AsyncSession, sample_feedback_data
    ):
        """Test deleting feedback."""
        feedback_create = FeedbackCreate(**sample_feedback_data)
        feedback = await crud_feedback.create(db_session, obj_in=feedback_create)

        deleted_feedback = await crud_feedback.delete(db_session, id=feedback.id)

        assert deleted_feedback is not None
        assert deleted_feedback.id == feedback.id

        # Verify it's deleted
        retrieved = await crud_feedback.get(db_session, feedback.id)
        assert retrieved is None

    async def test_get_stats(self, db_session: AsyncSession):
        """Test getting feedback statistics."""
        # Create diverse feedback data
        feedback_data = [
            {
                "type": FeedbackType.complaint,
                "message": "Issue 1",
                "name": "User 1",
                "email": "user1@test.com",
            },
            {
                "type": FeedbackType.complaint,
                "message": "Issue 2",
                "name": "User 2",
                "email": "user2@test.com",
            },
            {
                "type": FeedbackType.suggestion,
                "message": "Suggestion 1",
                "name": "User 3",
                "email": "user3@test.com",
            },
            {
                "type": FeedbackType.compliment,
                "message": "Great job!",
                "name": "User 4",
                "email": "user4@test.com",
            },
        ]

        created_feedback = []
        for data in feedback_data:
            feedback_create = FeedbackCreate(**data)
            feedback = await crud_feedback.create(db_session, obj_in=feedback_create)
            created_feedback.append(feedback)

        # Mark one as resolved
        resolved_feedback = created_feedback[0]
        update_data = FeedbackUpdate(status=FeedbackStatus.resolved)
        await crud_feedback.update(
            db_session, db_obj=resolved_feedback, obj_in=update_data
        )

        # Get stats
        stats = await crud_feedback.get_stats(db_session)

        assert stats["total_feedback"] == 4
        assert stats["open_feedback"] == 3
        assert stats["resolved_feedback"] == 1
        assert stats["by_type"]["complaint"] == 2
        assert stats["by_type"]["suggestion"] == 1
        assert stats["by_type"]["compliment"] == 1
        assert len(stats["recent_feedback"]) <= 10

    async def test_search_feedback(self, db_session: AsyncSession):
        """Test searching feedback by content."""
        # Create feedback with searchable content
        feedback_data = [
            {
                "type": FeedbackType.complaint,
                "message": "The search feature is broken",
                "name": "User 1",
                "email": "user1@test.com",
            },
            {
                "type": FeedbackType.suggestion,
                "message": "Please improve the UI design",
                "name": "User 2",
                "email": "user2@test.com",
            },
            {
                "type": FeedbackType.complaint,
                "message": "Login system has security issues",
                "name": "User 3",
                "email": "user3@test.com",
            },
        ]

        for data in feedback_data:
            feedback_create = FeedbackCreate(**data)
            await crud_feedback.create(db_session, obj_in=feedback_create)

        # Search for "search"
        search_results = await crud_feedback.search(db_session, query="search")
        assert len(search_results) == 1
        assert "search" in search_results[0].message.lower()

        # Search for "system"
        system_results = await crud_feedback.search(db_session, query="system")
        assert len(system_results) == 1
        assert "system" in system_results[0].message.lower()

        # Search with no results
        no_results = await crud_feedback.search(db_session, query="nonexistent")
        assert len(no_results) == 0
