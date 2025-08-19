"""
Unit tests for notes-related functionality.
"""

import pytest
import uuid
from unittest.mock import MagicMock, AsyncMock
from fastapi import HTTPException

from mavito_common.models.workspace_note import WorkspaceNote
from mavito_common.models.term import Term
from mavito_common.models.bookmark import TermBookmark, GlossaryBookmark
from mavito_common.schemas.workspace_note import (
    CreateNoteRequest,
    UpdateNoteRequest,
    UpdateBookmarkNoteRequest,
)


class TestCreateNote:
    """Test cases for the create_note endpoint."""

    @pytest.mark.asyncio
    async def test_create_note_success(self, mock_db, mock_user):
        """Test successful note creation."""
        term_id = uuid.uuid4()
        note_id = uuid.uuid4()

        # Setup mock term
        mock_term = MagicMock(spec=Term)
        mock_term.id = term_id
        mock_term.term = "Test Term"
        mock_term.definition = "Test Definition"
        mock_term.language = "en"
        mock_term.domain = "Test Domain"

        # For create_note to succeed:
        # 1. First execute should return the term
        # 2. Second execute should return None (no existing note)

        # Create mock db with proper AsyncMock behavior
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.add = MagicMock()

        # Create the execute method as an AsyncMock
        execute_mock = AsyncMock()
        mock_db.execute = execute_mock

        # Setup first result - term exists
        first_result = MagicMock()
        first_result.scalar_one_or_none.return_value = mock_term

        # Setup second result - no existing note
        second_result = MagicMock()
        second_result.scalar_one_or_none.return_value = None

        # Configure side effects
        execute_mock.side_effect = [first_result, second_result]

        # Configure refresh to set up the note object with all required attributes
        def side_effect_refresh(note):
            note.id = note_id
            note.term_id = term_id
            note.content = "Test note content"
            note.created_at = MagicMock()
            note.created_at.isoformat.return_value = "2023-01-01T00:00:00"
            note.updated_at = MagicMock()
            note.updated_at.isoformat.return_value = "2023-01-01T00:00:00"

        # Set up refresh to populate fields
        refresh_mock = AsyncMock()
        refresh_mock.side_effect = side_effect_refresh
        mock_db.refresh = refresh_mock

        # Create note request
        note_request = CreateNoteRequest(
            term_id=str(term_id), content="Test note content"
        )

        from app.api.v1.endpoints.notes import create_note

        # Execute endpoint
        result = await create_note(
            db=mock_db, note_request=note_request, current_user=mock_user
        )

        # Verify results
        assert result.content == "Test note content"
        assert result.term_info["term"] == "Test Term"
        mock_db.add.assert_called_once()
        await mock_db.commit() @ pytest.mark.asyncio

    async def test_create_note_term_not_found(self, mock_db, mock_user):
        """Test creating a note for a non-existent term."""
        # Create a completely new mock_db to avoid side effects
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Create an execute method that returns a result with no term
        result = MagicMock()
        result.scalar_one_or_none.return_value = None

        # Set up the execute method
        execute_mock = AsyncMock()
        execute_mock.return_value = result
        mock_db.execute = execute_mock

        # Create note request
        note_request = CreateNoteRequest(
            term_id=str(uuid.uuid4()), content="Test note content"
        )

        from app.api.v1.endpoints.notes import create_note

        # Execute endpoint and expect exception
        with pytest.raises(HTTPException) as exc:
            await create_note(
                db=mock_db, note_request=note_request, current_user=mock_user
            )

        assert exc.value.status_code == 404
        assert exc.value.detail == "Term not found"

    @pytest.mark.asyncio
    async def test_create_note_already_exists(self, mock_db, mock_user):
        """Test creating a note when one already exists for the term."""
        term_id = uuid.uuid4()

        # Setup mock term and existing note
        mock_term = MagicMock(spec=Term)
        mock_term.id = term_id

        mock_existing_note = MagicMock(spec=WorkspaceNote)
        mock_existing_note.term_id = term_id
        mock_existing_note.user_id = mock_user.id

        # Create a completely new mock_db to avoid side effects
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()

        # Create the execute method as an AsyncMock
        execute_mock = AsyncMock()
        mock_db.execute = execute_mock

        # Setup first result - term exists
        first_result = MagicMock()
        first_result.scalar_one_or_none.return_value = mock_term

        # Setup second result - existing note found
        second_result = MagicMock()
        second_result.scalar_one_or_none.return_value = mock_existing_note

        # Configure side effects
        execute_mock.side_effect = [first_result, second_result]

        # Create note request
        note_request = CreateNoteRequest(
            term_id=str(term_id), content="Test note content"
        )

        from app.api.v1.endpoints.notes import create_note

        # Execute endpoint and expect exception
        with pytest.raises(HTTPException) as exc:
            await create_note(
                db=mock_db, note_request=note_request, current_user=mock_user
            )

        assert exc.value.status_code == 409
        assert (
            exc.value.detail == "Note for this term already exists. Use PUT to update."
        )


class TestUpdateNote:
    """Test cases for the update_note endpoint."""

    @pytest.mark.asyncio
    async def test_update_note_success(self, mock_db, mock_user):
        """Test successful note update."""
        note_id = uuid.uuid4()

        # Setup mock note and term
        mock_term = MagicMock(spec=Term)
        mock_term.id = uuid.uuid4()
        mock_term.term = "Test Term"
        mock_term.definition = "Test Definition"
        mock_term.language = "en"
        mock_term.domain = "Test Domain"

        mock_note = MagicMock(spec=WorkspaceNote)
        mock_note.id = note_id
        mock_note.user_id = mock_user.id
        mock_note.term = mock_term
        mock_note.content = "Original note content"
        mock_note.term_id = mock_term.id
        mock_note.created_at = MagicMock()
        mock_note.created_at.isoformat.return_value = "2023-01-01T00:00:00"
        mock_note.updated_at = MagicMock()
        mock_note.updated_at.isoformat.return_value = "2023-01-01T00:00:00"

        # Create a completely new mock_db to avoid side effects
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Create result with scalar_one_or_none returning our mock note
        first_result = MagicMock()
        first_result.scalar_one_or_none.return_value = mock_note

        # For the term info lookup
        second_result = MagicMock()
        second_result.scalar_one.return_value = mock_term

        # Set up the execute method
        execute_mock = AsyncMock()
        execute_mock.side_effect = [first_result, second_result]
        mock_db.execute = execute_mock

        # Create update request
        update_request = UpdateNoteRequest(content="Updated note content")

        from app.api.v1.endpoints.notes import update_note

        # Execute endpoint
        result = await update_note(
            note_id=str(note_id),
            db=mock_db,
            update_request=update_request,
            current_user=mock_user,
        )

        # Verify results
        assert mock_note.content == "Updated note content"
        assert result.content == "Updated note content"
        assert result.term_info["term"] == "Test Term"
        await mock_db.commit() @ pytest.mark.asyncio

    async def test_update_note_not_found(self, mock_db, mock_user):
        """Test updating a non-existent note."""
        # Create a completely new mock_db to avoid side effects
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Create result with scalar_one_or_none returning None (no note found)
        result = MagicMock()
        result.scalar_one_or_none.return_value = None

        # Set up the execute method
        execute_mock = AsyncMock()
        execute_mock.return_value = result
        mock_db.execute = execute_mock

        # Create update request
        update_request = UpdateNoteRequest(content="Updated note content")

        from app.api.v1.endpoints.notes import update_note

        # Execute endpoint and expect exception
        with pytest.raises(HTTPException) as exc:
            await update_note(
                note_id=str(uuid.uuid4()),
                db=mock_db,
                update_request=update_request,
                current_user=mock_user,
            )

        assert exc.value.status_code == 404
        assert exc.value.detail == "Note not found"


class TestUpdateBookmarkNote:
    """Test cases for the update_bookmark_note endpoint."""

    @pytest.mark.asyncio
    async def test_update_term_bookmark_note_success(self, mock_db, mock_user):
        """Test successful update of term bookmark note."""
        bookmark_id = uuid.uuid4()

        # Setup mock bookmark
        mock_bookmark = MagicMock(spec=TermBookmark)
        mock_bookmark.id = bookmark_id
        mock_bookmark.user_id = mock_user.id
        mock_bookmark.notes = "Original bookmark note"

        # Create a completely new mock_db to avoid side effects
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()

        # Create result with scalar_one_or_none returning our mock bookmark
        result = MagicMock()
        result.scalar_one_or_none.return_value = mock_bookmark

        # Set up the execute method
        execute_mock = AsyncMock()
        execute_mock.return_value = result
        mock_db.execute = execute_mock

        # Create update request
        update_request = UpdateBookmarkNoteRequest(
            bookmark_id=str(bookmark_id),
            notes="Updated bookmark note",
            bookmark_type="term",
        )

        from app.api.v1.endpoints.notes import update_bookmark_note

        # Execute endpoint
        result = await update_bookmark_note(
            db=mock_db, update_request=update_request, current_user=mock_user
        )

        # Verify results
        assert mock_bookmark.notes == "Updated bookmark note"
        assert result["message"] == "Bookmark note updated successfully"
        await mock_db.commit()

    @pytest.mark.asyncio
    async def test_update_glossary_bookmark_note_success(self, mock_db, mock_user):
        """Test successful update of glossary bookmark note."""
        bookmark_id = uuid.uuid4()

        # Setup mock bookmark
        mock_bookmark = MagicMock(spec=GlossaryBookmark)
        mock_bookmark.id = bookmark_id
        mock_bookmark.user_id = mock_user.id
        mock_bookmark.notes = "Original bookmark note"

        # Create a completely new mock_db to avoid side effects
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()

        # Create result with scalar_one_or_none returning our mock bookmark
        result = MagicMock()
        result.scalar_one_or_none.return_value = mock_bookmark

        # Set up the execute method
        execute_mock = AsyncMock()
        execute_mock.return_value = result
        mock_db.execute = execute_mock

        # Create update request
        update_request = UpdateBookmarkNoteRequest(
            bookmark_id=str(bookmark_id),
            notes="Updated bookmark note",
            bookmark_type="glossary",
        )

        from app.api.v1.endpoints.notes import update_bookmark_note

        # Execute endpoint
        result = await update_bookmark_note(
            db=mock_db, update_request=update_request, current_user=mock_user
        )

        # Verify results
        assert mock_bookmark.notes == "Updated bookmark note"
        assert result["message"] == "Bookmark note updated successfully"
        await mock_db.commit() @ pytest.mark.asyncio

    async def test_update_bookmark_note_invalid_type(self, mock_db, mock_user):
        """Test updating a bookmark note with invalid type."""
        # Create a completely new mock_db to avoid side effects
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()

        # Create update request with invalid type
        update_request = UpdateBookmarkNoteRequest(
            bookmark_id=str(uuid.uuid4()),
            notes="Updated bookmark note",
            bookmark_type="invalid",
        )

        from app.api.v1.endpoints.notes import update_bookmark_note

        # Execute endpoint and expect exception
        with pytest.raises(HTTPException) as exc:
            await update_bookmark_note(
                db=mock_db, update_request=update_request, current_user=mock_user
            )

        assert exc.value.status_code == 400
        assert exc.value.detail == "Invalid bookmark type. Must be 'term' or 'glossary'"
