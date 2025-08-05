from fastapi import APIRouter, HTTPException, Query, Depends, status
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import uuid

from mavito_common.models.term import Term
from mavito_common.models.user import User
from mavito_common.db.session import get_db
from mavito_common.schemas.workspace_note import (
    CreateNoteRequest,
    UpdateNoteRequest,
    NoteResponse,
    UpdateBookmarkNoteRequest,
)
from app.api import deps

router = APIRouter()


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    *,
    db: AsyncSession = Depends(get_db),
    note_request: CreateNoteRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Create a note for a term.
    """
    try:
        term_uuid = uuid.UUID(note_request.term_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid term ID format"
        )

    # Check if term exists
    result = await db.execute(select(Term).where(Term.id == term_uuid))
    term = result.scalar_one_or_none()

    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Term not found"
        )

    # Check if user has already created a note for this term
    from mavito_common.models.workspace_note import WorkspaceNote

    result = await db.execute(
        select(WorkspaceNote).where(
            and_(
                WorkspaceNote.user_id == current_user.id,
                WorkspaceNote.term_id == term_uuid,
            )
        )
    )
    existing_note = result.scalar_one_or_none()

    if existing_note:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Note for this term already exists. Use PUT to update.",
        )

    # Create note
    note = WorkspaceNote(
        user_id=current_user.id, term_id=term_uuid, content=note_request.content
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)

    return NoteResponse(
        id=str(note.id),
        term_id=str(note.term_id),
        content=note.content,
        created_at=note.created_at.isoformat(),
        updated_at=note.updated_at.isoformat(),
        term_info={
            "term": term.term,
            "definition": term.definition,
            "language": term.language,
            "domain": term.domain,
        },
    )


@router.get("", response_model=List[NoteResponse])
async def get_user_notes(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    term_id: Optional[str] = Query(None, description="Filter by specific term ID")
):
    """
    Get all notes for the current user, optionally filtered by term.
    """
    from mavito_common.models.workspace_note import WorkspaceNote

    query = (
        select(WorkspaceNote, Term)
        .join(Term, WorkspaceNote.term_id == Term.id)
        .where(WorkspaceNote.user_id == current_user.id)
    )

    if term_id:
        try:
            term_uuid = uuid.UUID(term_id)
            query = query.where(WorkspaceNote.term_id == term_uuid)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid term ID format"
            )

    query = query.offset(skip).limit(limit).order_by(WorkspaceNote.updated_at.desc())

    result = await db.execute(query)

    notes = []
    for note, term in result.all():
        notes.append(
            NoteResponse(
                id=str(note.id),
                term_id=str(note.term_id),
                content=note.content,
                created_at=note.created_at.isoformat(),
                updated_at=note.updated_at.isoformat(),
                term_info={
                    "term": term.term,
                    "definition": term.definition,
                    "language": term.language,
                    "domain": term.domain,
                },
            )
        )

    return notes


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    *,
    db: AsyncSession = Depends(get_db),
    note_id: str,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get a specific note by ID.
    """
    try:
        note_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid note ID format"
        )

    from mavito_common.models.workspace_note import WorkspaceNote

    result = await db.execute(
        select(WorkspaceNote, Term)
        .join(Term, WorkspaceNote.term_id == Term.id)
        .where(
            and_(
                WorkspaceNote.id == note_uuid, WorkspaceNote.user_id == current_user.id
            )
        )
    )

    result_tuple = result.first()
    if not result_tuple:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    note, term = result_tuple

    return NoteResponse(
        id=str(note.id),
        term_id=str(note.term_id),
        content=note.content,
        created_at=note.created_at.isoformat(),
        updated_at=note.updated_at.isoformat(),
        term_info={
            "term": term.term,
            "definition": term.definition,
            "language": term.language,
            "domain": term.domain,
        },
    )


@router.put("/bookmark-note", status_code=status.HTTP_200_OK)
async def update_bookmark_note(
    *,
    db: AsyncSession = Depends(get_db),
    update_request: UpdateBookmarkNoteRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Update notes on a bookmark (term or glossary).
    """
    try:
        bookmark_uuid = uuid.UUID(update_request.bookmark_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid bookmark ID format"
        )

    if update_request.bookmark_type == "term":
        from mavito_common.models.bookmark import TermBookmark

        result = await db.execute(
            select(TermBookmark).where(
                and_(
                    TermBookmark.id == bookmark_uuid,
                    TermBookmark.user_id == current_user.id,
                )
            )
        )
        bookmark = result.scalar_one_or_none()

        if not bookmark:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Term bookmark not found"
            )

        bookmark.notes = update_request.notes

    elif update_request.bookmark_type == "glossary":
        from mavito_common.models.bookmark import GlossaryBookmark

        result = await db.execute(
            select(GlossaryBookmark).where(
                and_(
                    GlossaryBookmark.id == bookmark_uuid,
                    GlossaryBookmark.user_id == current_user.id,
                )
            )
        )
        bookmark = result.scalar_one_or_none()

        if not bookmark:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Glossary bookmark not found",
            )

        bookmark.notes = update_request.notes

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid bookmark type. Must be 'term' or 'glossary'",
        )

    await db.commit()

    return {"message": "Bookmark note updated successfully"}


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    *,
    db: AsyncSession = Depends(get_db),
    note_id: str,
    update_request: UpdateNoteRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Update an existing note.
    """
    try:
        note_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid note ID format"
        )

    from mavito_common.models.workspace_note import WorkspaceNote

    result = await db.execute(
        select(WorkspaceNote).where(
            and_(
                WorkspaceNote.id == note_uuid, WorkspaceNote.user_id == current_user.id
            )
        )
    )
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    # Update note content
    note.content = update_request.content
    await db.commit()
    await db.refresh(note)

    # Get term info for response
    term_result = await db.execute(select(Term).where(Term.id == note.term_id))
    term = term_result.scalar_one()

    return NoteResponse(
        id=str(note.id),
        term_id=str(note.term_id),
        content=note.content,
        created_at=note.created_at.isoformat(),
        updated_at=note.updated_at.isoformat(),
        term_info={
            "term": term.term,
            "definition": term.definition,
            "language": term.language,
            "domain": term.domain,
        },
    )


@router.delete("/{note_id}", status_code=status.HTTP_200_OK)
async def delete_note(
    *,
    db: AsyncSession = Depends(get_db),
    note_id: str,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Delete a note.
    """
    try:
        note_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid note ID format"
        )

    from mavito_common.models.workspace_note import WorkspaceNote

    result = await db.execute(
        select(WorkspaceNote).where(
            and_(
                WorkspaceNote.id == note_uuid, WorkspaceNote.user_id == current_user.id
            )
        )
    )
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    await db.delete(note)
    await db.commit()

    return {"message": "Note deleted successfully"}


@router.get("/term/{term_id}", response_model=NoteResponse)
async def get_note_by_term(
    *,
    db: AsyncSession = Depends(get_db),
    term_id: str,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get a note for a specific term.
    """
    try:
        term_uuid = uuid.UUID(term_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid term ID format"
        )

    from mavito_common.models.workspace_note import WorkspaceNote

    result = await db.execute(
        select(WorkspaceNote, Term)
        .join(Term, WorkspaceNote.term_id == Term.id)
        .where(
            and_(
                WorkspaceNote.term_id == term_uuid,
                WorkspaceNote.user_id == current_user.id,
            )
        )
    )

    result_tuple = result.first()
    if not result_tuple:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found for this term"
        )

    note, term = result_tuple

    return NoteResponse(
        id=str(note.id),
        term_id=str(note.term_id),
        content=note.content,
        created_at=note.created_at.isoformat(),
        updated_at=note.updated_at.isoformat(),
        term_info={
            "term": term.term,
            "definition": term.definition,
            "language": term.language,
            "domain": term.domain,
        },
    )
