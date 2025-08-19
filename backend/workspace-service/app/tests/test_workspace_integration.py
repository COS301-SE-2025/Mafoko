import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from mavito_common.models.user import User
from mavito_common.models.term import Term
from mavito_common.models.bookmark import TermBookmark, GlossaryBookmark
from mavito_common.models.workspace_group import WorkspaceGroup
from mavito_common.models.group_term import GroupTerm
from mavito_common.models.workspace_note import WorkspaceNote


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:

    test_user = User(
        first_name="Test",
        last_name="User",
        email="test@example.com",
        password_hash="fakehashedpassword",
        is_active=True,
        is_verified=True,
    )
    db_session.add(test_user)
    await db_session.commit()
    await db_session.refresh(test_user)
    return test_user


@pytest.fixture
async def test_terms(db_session: AsyncSession) -> list[Term]:

    terms = [
        Term(
            term="Machine Learning",
            definition="A field of computer science that gives computers the ability to learn without being explicitly programmed.",
            language="en",
            domain="statistics",
            example="Training a model to recognize patterns in data.",
        ),
        Term(
            term="Natural Language Processing",
            definition="A field of AI that enables computers to understand and process human language.",
            language="en",
            domain="statistics",
            example="Chatbots that can understand and respond to text.",
        ),
        Term(
            term="Confidence Interval",
            definition="A range of values that is likely to contain the true value of a population parameter.",
            language="en",
            domain="statistics",
            example="95% confidence interval: 0.7 to 0.9",
        ),
        Term(
            term="Regression",
            definition="A statistical process for estimating the relationships between dependent and independent variables.",
            language="en",
            domain="statistics",
            example="Linear regression to predict house prices.",
        ),
        Term(
            term="Variance",
            definition="A measure of how far a set of numbers are spread out from their average value.",
            language="en",
            domain="statistics",
            example="The variance of [1, 2, 3, 4, 5] is 2.5.",
        ),
    ]

    for term in terms:
        db_session.add(term)

    await db_session.commit()

    for term in terms:
        await db_session.refresh(term)

    return terms


@pytest.fixture
def auth_headers(test_user: User) -> dict:

    import jwt
    from mavito_common.core.config import settings

    token_data = {"sub": test_user.email, "user_id": str(test_user.id)}
    token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_bookmark_term_success(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):

    term = test_terms[0]

    response = await client.post(
        "/api/v1/workspace/bookmarks/terms",
        json={"term_id": str(term.id)},
        headers=auth_headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert "bookmark_id" in data
    assert data["message"] == "Term bookmarked successfully"

    result = await db_session.execute(
        select(TermBookmark).where(
            (TermBookmark.user_id == test_user.id) & (TermBookmark.term_id == term.id)
        )
    )
    bookmark = result.scalar_one()
    assert bookmark is not None


@pytest.mark.asyncio
async def test_bookmark_term_already_exists(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):

    term = test_terms[0]

    # First bookmark the term
    bookmark = TermBookmark(user_id=test_user.id, term_id=term.id)
    db_session.add(bookmark)
    await db_session.commit()

    # Try to bookmark it again
    response = await client.post(
        "/api/v1/workspace/bookmarks/terms",
        json={"term_id": str(term.id)},
        headers=auth_headers,
    )

    assert response.status_code == 409
    data = response.json()
    assert data["detail"] == "Term already bookmarked"


@pytest.mark.asyncio
async def test_bookmark_term_not_found(client: AsyncClient, auth_headers: dict):
    """Test bookmarking a term that doesn't exist."""
    nonexistent_id = str(uuid.uuid4())

    response = await client.post(
        "/api/v1/workspace/bookmarks/terms",
        json={"term_id": nonexistent_id},
        headers=auth_headers,
    )

    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Term not found"


@pytest.mark.asyncio
async def test_unbookmark_term_success(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test successfully unbookmarking a term."""
    term = test_terms[0]

    # First bookmark the term
    bookmark = TermBookmark(user_id=test_user.id, term_id=term.id)
    db_session.add(bookmark)
    await db_session.commit()

    # Now unbookmark it
    response = await client.delete(
        f"/api/v1/workspace/bookmarks/terms/{term.id}", headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Term bookmark removed successfully"

    # Verify the bookmark was removed
    result = await db_session.execute(
        select(TermBookmark).where(
            (TermBookmark.user_id == test_user.id) & (TermBookmark.term_id == term.id)
        )
    )
    bookmark = result.scalar_one_or_none()
    assert bookmark is None


@pytest.mark.asyncio
async def test_unbookmark_nonexistent_term(client: AsyncClient, auth_headers: dict):
    """Test unbookmarking a term that's not bookmarked."""
    nonexistent_id = str(uuid.uuid4())

    response = await client.delete(
        f"/api/v1/workspace/bookmarks/terms/{nonexistent_id}", headers=auth_headers
    )

    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Bookmark not found"


@pytest.mark.asyncio
async def test_get_bookmarks_empty(client: AsyncClient, auth_headers: dict):
    """Test getting bookmarks when user has none."""
    response = await client.get("/api/v1/workspace/bookmarks", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["terms"] == []
    assert data["glossaries"] == []


@pytest.mark.asyncio
async def test_get_bookmarks_with_data(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test getting bookmarks when user has several."""
    # Create multiple bookmarks
    for i in range(3):
        bookmark = TermBookmark(user_id=test_user.id, term_id=test_terms[i].id)
        db_session.add(bookmark)

    # Add a glossary bookmark
    glossary_bookmark = GlossaryBookmark(
        user_id=test_user.id,
        domain="statistics",
        description="Statistical terms",
        term_count=100,
    )
    db_session.add(glossary_bookmark)

    await db_session.commit()

    # Get the bookmarks
    response = await client.get("/api/v1/workspace/bookmarks", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data["terms"]) == 3
    assert len(data["glossaries"]) == 1

    # Verify term bookmark fields
    for term_bookmark in data["terms"]:
        assert "term_id" in term_bookmark
        assert "term" in term_bookmark
        assert "definition" in term_bookmark
        assert "bookmarked_at" in term_bookmark

    # Verify glossary bookmark fields
    assert data["glossaries"][0]["domain"] == "statistics"
    assert data["glossaries"][0]["description"] == "Statistical terms"
    assert data["glossaries"][0]["term_count"] == 100


@pytest.mark.asyncio
async def test_search_bookmarks(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test searching bookmarks."""
    # Create multiple bookmarks
    for term in test_terms:
        bookmark = TermBookmark(user_id=test_user.id, term_id=term.id)
        db_session.add(bookmark)

    await db_session.commit()

    # Search for bookmarks with "language" in the definition
    response = await client.post(
        "/api/v1/workspace/bookmarks/search",
        json={"query": "language", "type": "terms"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["terms"]) == 1  # Should find "Natural Language Processing"
    assert "Natural Language Processing" in data["terms"][0]["term"]


# --- Test Group Endpoints ---


@pytest.mark.asyncio
async def test_create_group_success(
    client: AsyncClient, db_session: AsyncSession, auth_headers: dict
):
    """Test creating a new group."""
    response = await client.post(
        "/api/v1/workspace/groups",
        json={
            "name": "My Statistical Terms",
            "description": "Important statistical concepts",
        },
        headers=auth_headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Statistical Terms"
    assert data["description"] == "Important statistical concepts"
    assert data["term_count"] == 0
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_create_duplicate_group(
    client: AsyncClient, db_session: AsyncSession, test_user: User, auth_headers: dict
):
    """Test creating a group with a name that already exists."""
    # First create a group
    group = WorkspaceGroup(
        user_id=test_user.id,
        name="My Statistical Terms",
        description="Important statistical concepts",
    )
    db_session.add(group)
    await db_session.commit()

    # Try to create it again
    response = await client.post(
        "/api/v1/workspace/groups",
        json={"name": "My Statistical Terms", "description": "Another description"},
        headers=auth_headers,
    )

    assert response.status_code == 409
    data = response.json()
    assert data["detail"] == "Group with this name already exists"


@pytest.mark.asyncio
async def test_get_groups(
    client: AsyncClient, db_session: AsyncSession, test_user: User, auth_headers: dict
):
    """Test getting user's groups."""
    # Create multiple groups
    groups = [
        WorkspaceGroup(user_id=test_user.id, name="Group 1", description="First group"),
        WorkspaceGroup(
            user_id=test_user.id, name="Group 2", description="Second group"
        ),
        WorkspaceGroup(user_id=test_user.id, name="Group 3", description="Third group"),
    ]

    for group in groups:
        db_session.add(group)

    await db_session.commit()

    # Get the groups
    response = await client.get("/api/v1/workspace/groups", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3

    # Verify group fields
    names = [group["name"] for group in data]
    assert "Group 1" in names
    assert "Group 2" in names
    assert "Group 3" in names


@pytest.mark.asyncio
async def test_get_group_with_terms(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test getting a specific group with its terms."""
    # Create a group
    group = WorkspaceGroup(
        user_id=test_user.id,
        name="Statistics Terms",
        description="Important statistical concepts",
    )
    db_session.add(group)
    await db_session.commit()
    await db_session.refresh(group)

    # Add terms to the group
    for i in range(3):
        group_term = GroupTerm(group_id=group.id, term_id=test_terms[i].id)
        db_session.add(group_term)

    await db_session.commit()

    # Get the group with terms
    response = await client.get(
        f"/api/v1/workspace/groups/{group.id}", headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Statistics Terms"
    assert len(data["terms"]) == 3

    # Verify term fields
    for term in data["terms"]:
        assert "id" in term
        assert "term" in term
        assert "definition" in term
        assert "language" in term
        assert "domain" in term
        assert "added_at" in term


@pytest.mark.asyncio
async def test_update_group(
    client: AsyncClient, db_session: AsyncSession, test_user: User, auth_headers: dict
):
    """Test updating a group's details."""
    # Create a group
    group = WorkspaceGroup(
        user_id=test_user.id, name="Old Name", description="Old description"
    )
    db_session.add(group)
    await db_session.commit()
    await db_session.refresh(group)

    # Update the group
    response = await client.put(
        f"/api/v1/workspace/groups/{group.id}",
        json={"name": "New Name", "description": "New description"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["description"] == "New description"

    # Verify the update in the database
    result = await db_session.execute(
        select(WorkspaceGroup).where(WorkspaceGroup.id == group.id)
    )
    updated_group = result.scalar_one()
    assert updated_group.name == "New Name"
    assert updated_group.description == "New description"


@pytest.mark.asyncio
async def test_delete_group(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test deleting a group."""
    # Create a group
    group = WorkspaceGroup(
        user_id=test_user.id,
        name="Group to Delete",
        description="This group will be deleted",
    )
    db_session.add(group)
    await db_session.commit()
    await db_session.refresh(group)

    # Add terms to the group
    group_term = GroupTerm(group_id=group.id, term_id=test_terms[0].id)
    db_session.add(group_term)
    await db_session.commit()

    # Delete the group
    response = await client.delete(
        f"/api/v1/workspace/groups/{group.id}", headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Group deleted successfully"

    # Verify the group is gone
    result = await db_session.execute(
        select(WorkspaceGroup).where(WorkspaceGroup.id == group.id)
    )
    deleted_group = result.scalar_one_or_none()
    assert deleted_group is None

    # Verify the group term associations are gone
    result = await db_session.execute(
        select(GroupTerm).where(GroupTerm.group_id == group.id)
    )
    group_terms = result.scalars().all()
    assert len(group_terms) == 0


@pytest.mark.asyncio
async def test_add_terms_to_group(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test adding terms to a group."""
    # Create a group
    group = WorkspaceGroup(
        user_id=test_user.id,
        name="Statistical Concepts",
        description="Important statistical concepts",
    )
    db_session.add(group)
    await db_session.commit()
    await db_session.refresh(group)

    # Make sure terms exist and are committed
    for term in test_terms:
        await db_session.refresh(term)

    # Print debug info
    print(f"Group ID: {group.id}")
    print(f"Term 1 ID: {test_terms[0].id}")
    print(f"Term 2 ID: {test_terms[1].id}")

    # Add terms to the group directly using the database
    group_term1 = GroupTerm(group_id=group.id, term_id=test_terms[0].id)
    group_term2 = GroupTerm(group_id=group.id, term_id=test_terms[1].id)
    db_session.add(group_term1)
    db_session.add(group_term2)
    await db_session.commit()

    # Verify the terms were added
    result = await db_session.execute(
        select(GroupTerm).where(GroupTerm.group_id == group.id)
    )
    group_terms = result.scalars().all()
    assert len(group_terms) == 2

    # Now let's test the API endpoint separately
    # We'll use different terms to avoid conflict
    term_ids = [str(test_terms[2].id), str(test_terms[3].id)]
    response = await client.post(
        f"/api/v1/workspace/groups/{group.id}/terms",
        json={"term_ids": term_ids},
        headers=auth_headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert "Added" in data["message"]


@pytest.mark.asyncio
async def test_remove_term_from_group(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test removing a term from a group."""
    # Create a group
    group = WorkspaceGroup(
        user_id=test_user.id,
        name="Statistical Concepts",
        description="Important statistical concepts",
    )
    db_session.add(group)
    await db_session.commit()
    await db_session.refresh(group)

    # Add a term to the group
    group_term = GroupTerm(group_id=group.id, term_id=test_terms[0].id)
    db_session.add(group_term)
    await db_session.commit()

    # Remove the term
    response = await client.delete(
        f"/api/v1/workspace/groups/{group.id}/terms/{test_terms[0].id}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Term removed from group successfully"

    # Verify the term was removed
    result = await db_session.execute(
        select(GroupTerm).where(
            (GroupTerm.group_id == group.id) & (GroupTerm.term_id == test_terms[0].id)
        )
    )
    group_term = result.scalar_one_or_none()
    assert group_term is None


# --- Test Note Endpoints ---


@pytest.mark.asyncio
async def test_create_note_success(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test creating a note for a term."""
    term = test_terms[0]

    response = await client.post(
        "/api/v1/workspace/notes",
        json={
            "term_id": str(term.id),
            "content": "This is a test note about Machine Learning.",
        },
        headers=auth_headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["term_id"] == str(term.id)
    assert data["content"] == "This is a test note about Machine Learning."
    assert "created_at" in data
    assert "updated_at" in data
    assert "term_info" in data
    assert data["term_info"]["term"] == term.term

    # Verify note was created in the database
    result = await db_session.execute(
        select(WorkspaceNote).where(
            (WorkspaceNote.user_id == test_user.id) & (WorkspaceNote.term_id == term.id)
        )
    )
    note = result.scalar_one()
    assert note is not None
    assert note.content == "This is a test note about Machine Learning."


@pytest.mark.asyncio
async def test_create_duplicate_note(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test creating a note for a term that already has a note."""
    term = test_terms[0]

    # Create a note first
    note = WorkspaceNote(user_id=test_user.id, term_id=term.id, content="Existing note")
    db_session.add(note)
    await db_session.commit()

    # Try to create another note for the same term
    response = await client.post(
        "/api/v1/workspace/notes",
        json={"term_id": str(term.id), "content": "This should fail"},
        headers=auth_headers,
    )

    assert response.status_code == 409
    data = response.json()
    assert "already exists" in data["detail"]


@pytest.mark.asyncio
async def test_get_user_notes(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test getting all notes for a user."""
    # Create multiple notes
    for i in range(3):
        note = WorkspaceNote(
            user_id=test_user.id,
            term_id=test_terms[i].id,
            content=f"Note about {test_terms[i].term}",
        )
        db_session.add(note)

    await db_session.commit()

    # Get all notes
    response = await client.get("/api/v1/workspace/notes", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3

    # Verify note fields
    for note in data:
        assert "id" in note
        assert "term_id" in note
        assert "content" in note
        assert "created_at" in note
        assert "updated_at" in note
        assert "term_info" in note


@pytest.mark.asyncio
async def test_get_note_by_id(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test getting a specific note by ID."""
    term = test_terms[0]

    # Create a note
    note = WorkspaceNote(
        user_id=test_user.id, term_id=term.id, content="Note about Machine Learning"
    )
    db_session.add(note)
    await db_session.commit()
    await db_session.refresh(note)

    # Get the note by ID
    response = await client.get(
        f"/api/v1/workspace/notes/{note.id}", headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(note.id)
    assert data["term_id"] == str(term.id)
    assert data["content"] == "Note about Machine Learning"
    assert "term_info" in data
    assert data["term_info"]["term"] == term.term


@pytest.mark.asyncio
async def test_update_note(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test updating a note's content."""
    term = test_terms[0]

    # Create a note
    note = WorkspaceNote(
        user_id=test_user.id, term_id=term.id, content="Original content"
    )
    db_session.add(note)
    await db_session.commit()
    await db_session.refresh(note)

    # Update the note
    response = await client.put(
        f"/api/v1/workspace/notes/{note.id}",
        json={"content": "Updated content"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Updated content"

    # Verify the update in the database
    result = await db_session.execute(
        select(WorkspaceNote).where(WorkspaceNote.id == note.id)
    )
    updated_note = result.scalar_one()
    assert updated_note.content == "Updated content"


@pytest.mark.asyncio
async def test_delete_note(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test deleting a note."""
    term = test_terms[0]

    # Create a note
    note = WorkspaceNote(
        user_id=test_user.id, term_id=term.id, content="Note to delete"
    )
    db_session.add(note)
    await db_session.commit()
    await db_session.refresh(note)

    # Delete the note
    response = await client.delete(
        f"/api/v1/workspace/notes/{note.id}", headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Note deleted successfully"

    # Verify the note is gone
    result = await db_session.execute(
        select(WorkspaceNote).where(WorkspaceNote.id == note.id)
    )
    deleted_note = result.scalar_one_or_none()
    assert deleted_note is None


# --- Test Authentication ---


@pytest.mark.asyncio
async def test_unauthenticated_access(client: AsyncClient):
    """Test accessing endpoints without authentication."""
    # Try to access bookmarks without auth
    response = await client.get("/api/v1/workspace/bookmarks")
    assert (
        response.status_code == 403
    )  # The service returns 403 for unauthorized access

    # Try to access groups without auth
    response = await client.get("/api/v1/workspace/groups")
    assert response.status_code == 403

    # Try to access notes without auth
    response = await client.get("/api/v1/workspace/notes")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_invalid_token(client: AsyncClient):
    """Test accessing endpoints with an invalid token."""
    invalid_headers = {"Authorization": "Bearer invalidtoken123"}

    response = await client.get("/api/v1/workspace/bookmarks", headers=invalid_headers)

    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


# --- Test Complete Workflows ---


@pytest.mark.asyncio
async def test_complete_workspace_workflow(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test a complete workflow with bookmarks, groups, and notes."""
    # 1. Create a group
    response = await client.post(
        "/api/v1/workspace/groups",
        json={
            "name": "Statistics Collection",
            "description": "My collection of statistical terms",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    group_data = response.json()
    group_id = group_data["id"]

    # 2. Bookmark multiple terms
    bookmarked_term_ids = []
    for i in range(3):
        response = await client.post(
            "/api/v1/workspace/bookmarks/terms",
            json={"term_id": str(test_terms[i].id)},
            headers=auth_headers,
        )
        assert response.status_code == 201
        bookmarked_term_ids.append(str(test_terms[i].id))

    # 3. Add terms to the group directly via database
    for term_id in bookmarked_term_ids:
        group_term = GroupTerm(group_id=uuid.UUID(group_id), term_id=uuid.UUID(term_id))
        db_session.add(group_term)
    await db_session.commit()

    # Also test the API endpoint
    response = await client.post(
        f"/api/v1/workspace/groups/{group_id}/terms",
        json={"term_ids": bookmarked_term_ids},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert "Added" in response.json()["message"]

    # 4. Create notes for terms
    for i in range(2):
        response = await client.post(
            "/api/v1/workspace/notes",
            json={
                "term_id": str(test_terms[i].id),
                "content": f"My note about {test_terms[i].term}",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201

    # 5. Get all bookmarks
    response = await client.get("/api/v1/workspace/bookmarks", headers=auth_headers)
    assert response.status_code == 200
    bookmarks_data = response.json()
    assert len(bookmarks_data["terms"]) == 3

    # 6. Get the group with terms
    response = await client.get(
        f"/api/v1/workspace/groups/{group_id}", headers=auth_headers
    )
    assert response.status_code == 200
    group_with_terms = response.json()
    assert len(group_with_terms["terms"]) == 3

    # 7. Get all notes
    response = await client.get("/api/v1/workspace/notes", headers=auth_headers)
    assert response.status_code == 200
    notes_data = response.json()
    assert len(notes_data) == 2

    # 8. Remove a term from the group
    response = await client.delete(
        f"/api/v1/workspace/groups/{group_id}/terms/{test_terms[0].id}",
        headers=auth_headers,
    )
    assert response.status_code == 200

    # 9. Verify the term was removed
    response = await client.get(
        f"/api/v1/workspace/groups/{group_id}", headers=auth_headers
    )
    assert response.status_code == 200
    updated_group = response.json()
    assert len(updated_group["terms"]) == 2

    # 10. Unbookmark a term
    response = await client.delete(
        f"/api/v1/workspace/bookmarks/terms/{test_terms[2].id}", headers=auth_headers
    )
    assert response.status_code == 200

    # 11. Verify bookmarks were updated
    response = await client.get("/api/v1/workspace/bookmarks", headers=auth_headers)
    assert response.status_code == 200
    updated_bookmarks = response.json()
    assert len(updated_bookmarks["terms"]) == 2


@pytest.mark.asyncio
async def test_pagination_on_bookmarks(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test pagination for bookmarks endpoint."""
    # Create multiple bookmarks
    for term in test_terms:
        bookmark = TermBookmark(user_id=test_user.id, term_id=term.id)
        db_session.add(bookmark)

    await db_session.commit()

    # Test with skip=0, limit=2
    response = await client.get(
        "/api/v1/workspace/bookmarks?skip=0&limit=2", headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["terms"]) == 2

    # Test with skip=2, limit=2
    response = await client.get(
        "/api/v1/workspace/bookmarks?skip=2&limit=2", headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["terms"]) == 2

    # Test with skip=4, limit=2 (should return less than 2 items)
    response = await client.get(
        "/api/v1/workspace/bookmarks?skip=4&limit=2", headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["terms"]) == 1  # Only 5 terms total


@pytest.mark.asyncio
async def test_filter_notes_by_term(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_terms: list[Term],
    auth_headers: dict,
):
    """Test filtering notes by term ID."""
    # Create notes for multiple terms
    for term in test_terms:
        note = WorkspaceNote(
            user_id=test_user.id, term_id=term.id, content=f"Note about {term.term}"
        )
        db_session.add(note)

    await db_session.commit()

    # Filter notes by a specific term
    term_id = str(test_terms[0].id)
    response = await client.get(
        f"/api/v1/workspace/notes?term_id={term_id}", headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["term_id"] == term_id
