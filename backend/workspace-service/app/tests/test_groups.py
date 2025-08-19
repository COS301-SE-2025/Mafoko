"""
Unit tests for group-related functionality.
"""

import pytest
import uuid
from unittest.mock import MagicMock, AsyncMock
from fastapi import HTTPException

from mavito_common.models.workspace_group import WorkspaceGroup
from mavito_common.models.term import Term
from mavito_common.schemas.workspace_group import (
    CreateGroupRequest,
    UpdateGroupRequest,
    AddTermsToGroupRequest,
)


class TestCreateGroup:
    """Test cases for the create_group endpoint."""

    @pytest.mark.asyncio
    async def test_create_group_success(self, mock_db, mock_user):
        """Test successful group creation."""
        group_id = uuid.uuid4()

        # Create a completely new mock_db to avoid side effects
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.add = MagicMock()

        # Create the execute method as an AsyncMock
        execute_mock = AsyncMock()
        mock_db.execute = execute_mock

        # Create result with scalar_one_or_none returning None (no existing group)
        result = MagicMock()
        result.scalar_one_or_none.return_value = None

        # Set execute return value
        execute_mock.return_value = result

        # Configure refresh to set up the group with required attributes
        def side_effect_refresh(group):
            group.id = group_id
            group.name = "Test Group"
            group.description = "Test Description"
            group.created_at = MagicMock()
            group.created_at.isoformat.return_value = "2023-01-01T00:00:00"
            group.updated_at = MagicMock()
            group.updated_at.isoformat.return_value = "2023-01-01T00:00:00"

        # Set up refresh to populate fields
        refresh_mock = AsyncMock()
        refresh_mock.side_effect = side_effect_refresh
        mock_db.refresh = refresh_mock

        # Create group request
        group_request = CreateGroupRequest(
            name="Test Group", description="Test Description"
        )

        from app.api.v1.endpoints.groups import create_group

        # Execute endpoint
        result = await create_group(
            db=mock_db, group_request=group_request, current_user=mock_user
        )

        # Verify results
        assert result.name == "Test Group"
        assert result.description == "Test Description"
        assert result.term_count == 0
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_group_duplicate_name(self, mock_db, mock_user):
        """Test creating a group with a duplicate name."""
        # Setup existing group
        existing_group = MagicMock(spec=WorkspaceGroup)
        existing_group.name = "Test Group"
        existing_group.user_id = mock_user.id

        # Mock database operations
        mock_db.execute.return_value.scalar_one_or_none.return_value = existing_group

        # Create group request
        group_request = CreateGroupRequest(
            name="Test Group", description="Test Description"
        )

        from app.api.v1.endpoints.groups import create_group

        # Execute endpoint and expect exception
        with pytest.raises(HTTPException) as exc:
            await create_group(
                db=mock_db, group_request=group_request, current_user=mock_user
            )

        assert exc.value.status_code == 409
        assert exc.value.detail == "Group with this name already exists"


class TestGetUserGroups:
    """Test cases for the get_user_groups endpoint."""

    @pytest.mark.asyncio
    async def test_get_user_groups_success(self, mock_db, mock_user):
        """Test successful retrieval of user groups."""
        # Create a completely new mock_db to avoid side effects
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()

        # Setup mock group
        mock_group = MagicMock(spec=WorkspaceGroup)
        mock_group.id = uuid.uuid4()
        mock_group.name = "Test Group"
        mock_group.description = "Test Description"
        mock_group.created_at = MagicMock()
        mock_group.created_at.isoformat.return_value = "2025-08-19T00:00:00"
        mock_group.updated_at = MagicMock()
        mock_group.updated_at.isoformat.return_value = "2025-08-19T00:00:00"

        # Create a groups result mock
        groups_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = [mock_group]
        groups_result.scalars.return_value = mock_scalars

        # Create a term count result mock
        term_count_result = MagicMock()
        term_count_result.scalar.return_value = 5

        # Create items result mock
        items_result = MagicMock()
        mock_scalars_items = MagicMock()
        mock_scalars_items.all.return_value = []
        items_result.scalars.return_value = mock_scalars_items

        # Set up execute with side effects
        execute_mock = AsyncMock()
        execute_mock.side_effect = [groups_result, term_count_result, items_result]
        mock_db.execute = execute_mock

        from app.api.v1.endpoints.groups import get_user_groups

        # Execute endpoint with explicit parameter values
        result = await get_user_groups(
            db=mock_db, current_user=mock_user, skip=0, limit=100
        )

        # Verify results
        assert len(result) == 1
        assert result[0].name == "Test Group"
        assert result[0].description == "Test Description"
        assert result[0].term_count == 5


class TestGetGroupWithTerms:
    """Test cases for the get_group_with_terms endpoint."""

    @pytest.mark.asyncio
    async def test_get_group_with_terms_not_found(self, mock_db, mock_user):
        """Test getting a non-existent group."""
        # Mock database operations
        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        from app.api.v1.endpoints.groups import get_group_with_terms

        # Execute endpoint and expect exception
        with pytest.raises(HTTPException) as exc:
            await get_group_with_terms(
                group_id=str(uuid.uuid4()), db=mock_db, current_user=mock_user
            )

        assert exc.value.status_code == 404
        assert exc.value.detail == "Group not found"


class TestUpdateGroup:
    """Test cases for the update_group endpoint."""

    @pytest.mark.asyncio
    async def test_update_group_success(self, mock_db, mock_user):
        """Test successful group update."""
        group_id = uuid.uuid4()

        # Create a completely new mock_db to avoid side effects
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Setup mock group
        mock_group = MagicMock(spec=WorkspaceGroup)
        mock_group.id = group_id
        mock_group.user_id = mock_user.id
        mock_group.name = "Old Name"
        mock_group.description = "Old Description"
        mock_group.created_at = MagicMock()
        mock_group.created_at.isoformat.return_value = "2025-08-19T00:00:00"
        mock_group.updated_at = MagicMock()
        mock_group.updated_at.isoformat.return_value = "2025-08-19T00:00:00"

        # Setup mock term count result
        term_count_result = MagicMock()
        term_count_result.scalar.return_value = 0

        # Create results for the execute calls
        group_result = MagicMock()
        group_result.scalar_one_or_none.return_value = mock_group

        name_check_result = MagicMock()
        name_check_result.scalar_one_or_none.return_value = None

        # Set up execute with side effects
        execute_mock = AsyncMock()
        execute_mock.side_effect = [group_result, name_check_result, term_count_result]
        mock_db.execute = execute_mock

        # Configure refresh to update mock group attributes
        def side_effect_refresh(group):
            # The attributes would already be updated in the endpoint
            pass

        refresh_mock = AsyncMock()
        refresh_mock.side_effect = side_effect_refresh
        mock_db.refresh = refresh_mock

        # Create update request
        update_request = UpdateGroupRequest(
            name="New Name", description="New Description"
        )

        from app.api.v1.endpoints.groups import update_group

        # Execute endpoint
        await update_group(
            group_id=str(group_id),
            update_request=update_request,
            db=mock_db,
            current_user=mock_user,
        )

        # Verify results
        assert mock_group.name == "New Name"
        assert mock_group.description == "New Description"
        mock_db.commit.assert_called_once()


class TestAddTermsToGroup:
    """Test cases for the add_terms_to_group endpoint."""

    @pytest.mark.asyncio
    async def test_add_terms_to_group_success(self, mock_db, mock_user):
        """Test successfully adding terms to a group."""
        group_id = uuid.uuid4()
        term_id = uuid.uuid4()

        # Create a completely new mock_db to avoid side effects
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.add = MagicMock()

        # Setup mock group
        mock_group = MagicMock(spec=WorkspaceGroup)
        mock_group.id = group_id
        mock_group.user_id = mock_user.id

        # Setup mock term and bookmark
        mock_term = MagicMock(spec=Term)
        mock_term.id = term_id

        mock_bookmark = MagicMock()
        mock_bookmark.term_id = term_id
        mock_bookmark.user_id = mock_user.id

        # Create results for the execute calls
        group_result = MagicMock()
        group_result.scalar_one_or_none.return_value = mock_group

        bookmark_result = MagicMock()
        bookmark_result.scalar_one_or_none.return_value = mock_bookmark

        existing_result = MagicMock()
        existing_result.scalar_one_or_none.return_value = None

        # Set up execute with side effects
        execute_mock = AsyncMock()
        execute_mock.side_effect = [group_result, bookmark_result, existing_result]
        mock_db.execute = execute_mock

        # Create request
        terms_request = AddTermsToGroupRequest(term_ids=[str(term_id)])

        from app.api.v1.endpoints.groups import add_terms_to_group

        # Execute endpoint
        result = await add_terms_to_group(
            group_id=str(group_id),
            terms_request=terms_request,
            db=mock_db,
            current_user=mock_user,
        )

        # Verify results
        assert result["message"] == "Added 1 terms to group"
        mock_db.add.assert_called_once()
        await mock_db.commit()

    @pytest.mark.asyncio
    async def test_add_terms_to_group_term_not_found(self, mock_db, mock_user):
        """Test adding non-bookmarked terms to a group."""
        group_id = uuid.uuid4()
        term_id = uuid.uuid4()

        # Create a completely new mock_db to avoid side effects
        mock_db = MagicMock()
        mock_db.commit = AsyncMock()

        # Setup mock group
        mock_group = MagicMock(spec=WorkspaceGroup)
        mock_group.id = group_id
        mock_group.user_id = mock_user.id

        # Create results for the execute calls
        group_result = MagicMock()
        group_result.scalar_one_or_none.return_value = mock_group

        # No bookmark found for the term (simulating term not bookmarked)
        bookmark_result = MagicMock()
        bookmark_result.scalar_one_or_none.return_value = None

        # Set up execute with side effects
        execute_mock = AsyncMock()
        execute_mock.side_effect = [group_result, bookmark_result]
        mock_db.execute = execute_mock

        # Create request
        terms_request = AddTermsToGroupRequest(term_ids=[str(term_id)])

        from app.api.v1.endpoints.groups import add_terms_to_group

        # Execute endpoint - it will skip the term, not raise an exception
        result = await add_terms_to_group(
            group_id=str(group_id),
            terms_request=terms_request,
            db=mock_db,
            current_user=mock_user,
        )

        # Verify results show the term was skipped
        assert len(result["skipped_terms"]) == 1
        assert result["skipped_terms"][0]["term_id"] == str(term_id)
        assert result["skipped_terms"][0]["reason"] == "Term not bookmarked by user"
        assert len(result["added_terms"]) == 0
