from fastapi import APIRouter, HTTPException, Query, Depends, status
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, distinct, text
from sqlalchemy.orm import selectinload
import uuid
import httpx

from mavito_common.models.term import Term
from mavito_common.models.user import User
from mavito_common.db.session import get_db
from mavito_common.schemas.bookmark import (
    BookmarkTermRequest,
    BookmarkGlossaryRequest,
    BookmarkedTermResponse,
    BookmarkedGlossaryResponse,
    BookmarksResponse,
    SearchBookmarksRequest
)
from app.api import deps

router = APIRouter()


@router.post("/terms", status_code=status.HTTP_201_CREATED)
async def bookmark_term(
    *,
    db: AsyncSession = Depends(get_db),
    bookmark_request: BookmarkTermRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Bookmark a term for the current user.
    """
    try:
        term_uuid = uuid.UUID(bookmark_request.term_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid term ID format"
        )
    
    # Check if term exists
    result = await db.execute(select(Term).where(Term.id == term_uuid))
    term = result.scalar_one_or_none()
    
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Term not found"
        )
    
    # Check if already bookmarked
    from mavito_common.models.bookmark import TermBookmark
    result = await db.execute(
        select(TermBookmark).where(
            and_(
                TermBookmark.user_id == current_user.id,
                TermBookmark.term_id == term_uuid
            )
        )
    )
    existing_bookmark = result.scalar_one_or_none()
    
    if existing_bookmark:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Term already bookmarked"
        )
    
    # Create bookmark
    bookmark = TermBookmark(
        user_id=current_user.id,
        term_id=term_uuid
    )
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)
    
    return {"message": "Term bookmarked successfully", "bookmark_id": str(bookmark.id)}


@router.delete("/terms/{term_id}", status_code=status.HTTP_200_OK)
async def unbookmark_term(
    *,
    db: AsyncSession = Depends(get_db),
    term_id: str,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Remove a term bookmark for the current user.
    """
    try:
        term_uuid = uuid.UUID(term_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid term ID format"
        )
    
    from mavito_common.models.bookmark import TermBookmark
    result = await db.execute(
        select(TermBookmark).where(
            and_(
                TermBookmark.user_id == current_user.id,
                TermBookmark.term_id == term_uuid
            )
        )
    )
    bookmark = result.scalar_one_or_none()
    
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    await db.delete(bookmark)
    await db.commit()
    
    return {"message": "Term bookmark removed successfully"}


@router.post("/glossaries", status_code=status.HTTP_201_CREATED)
async def bookmark_glossary(
    *,
    db: AsyncSession = Depends(get_db),
    bookmark_request: BookmarkGlossaryRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Bookmark a glossary for the current user.
    """
    # Check if glossary exists by calling the glossary service
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"http://mavito_glossary_service:8080/api/v1/glossary/categories/{bookmark_request.domain}/terms",
                timeout=10.0
            )
            if response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Glossary not found"
                )
            elif response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to validate glossary"
                )
            
            # Get the terms to count them
            terms = response.json()
            term_count = len(terms) if isinstance(terms, list) else 0
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to glossary service"
        )
    
    # Check if already bookmarked
    from mavito_common.models.bookmark import GlossaryBookmark
    result = await db.execute(
        select(GlossaryBookmark).where(
            and_(
                GlossaryBookmark.user_id == current_user.id,
                GlossaryBookmark.domain == bookmark_request.domain
            )
        )
    )
    existing_bookmark = result.scalar_one_or_none()
    
    if existing_bookmark:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Glossary already bookmarked"
        )
    
    # Create bookmark
    bookmark = GlossaryBookmark(
        user_id=current_user.id,
        domain=bookmark_request.domain,
        description=bookmark_request.description,
        term_count=term_count
    )
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)
    
    return {"message": "Glossary bookmarked successfully", "bookmark_id": str(bookmark.id)}


@router.delete("/glossaries/{domain}", status_code=status.HTTP_200_OK)
async def unbookmark_glossary(
    *,
    db: AsyncSession = Depends(get_db),
    domain: str,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Remove a glossary bookmark for the current user.
    """
    from mavito_common.models.bookmark import GlossaryBookmark
    result = await db.execute(
        select(GlossaryBookmark).where(
            and_(
                GlossaryBookmark.user_id == current_user.id,
                GlossaryBookmark.domain == domain
            )
        )
    )
    bookmark = result.scalar_one_or_none()
    
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Glossary bookmark not found"
        )
    
    await db.delete(bookmark)
    await db.commit()
    
    return {"message": "Glossary bookmark removed successfully"}


@router.get("", response_model=BookmarksResponse)
async def get_user_bookmarks(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    Get all bookmarks for the current user.
    """
    from mavito_common.models.bookmark import TermBookmark, GlossaryBookmark
    
    # Get term bookmarks
    term_result = await db.execute(
        select(TermBookmark, Term)
        .join(Term, TermBookmark.term_id == Term.id)
        .where(TermBookmark.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by(TermBookmark.created_at.desc())
    )
    
    term_bookmarks = []
    for bookmark, term in term_result.all():
        term_bookmarks.append(BookmarkedTermResponse(
            id=str(bookmark.id),
            term_id=str(term.id),
            term=term.term,
            definition=term.definition,
            language=term.language,
            domain=term.domain,
            bookmarked_at=bookmark.created_at.isoformat(),
            notes=bookmark.notes
        ))
    
    # Get glossary bookmarks
    glossary_result = await db.execute(
        select(GlossaryBookmark)
        .where(GlossaryBookmark.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by(GlossaryBookmark.created_at.desc())
    )
    
    glossary_bookmarks = []
    for bookmark in glossary_result.scalars().all():
        glossary_bookmarks.append(BookmarkedGlossaryResponse(
            id=str(bookmark.id),
            domain=bookmark.domain,
            term_count=bookmark.term_count,
            bookmarked_at=bookmark.created_at.isoformat(),
            description=bookmark.description,
            notes=bookmark.notes
        ))
    
    return BookmarksResponse(
        terms=term_bookmarks,
        glossaries=glossary_bookmarks
    )


@router.post("/search")
async def search_bookmarks(
    *,
    db: AsyncSession = Depends(get_db),
    search_request: SearchBookmarksRequest,
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    Search through user's bookmarked terms and glossaries.
    """
    from mavito_common.models.bookmark import TermBookmark, GlossaryBookmark
    
    results = {"terms": [], "glossaries": []}
    
    if search_request.type in ["terms", "all"]:
        # Search term bookmarks
        term_query = select(TermBookmark, Term).join(Term, TermBookmark.term_id == Term.id).where(
            and_(
                TermBookmark.user_id == current_user.id,
                or_(
                    Term.term.ilike(f"%{search_request.query}%"),
                    Term.definition.ilike(f"%{search_request.query}%"),
                    Term.domain.ilike(f"%{search_request.query}%")
                )
            )
        ).offset(skip).limit(limit)
        
        term_result = await db.execute(term_query)
        
        for bookmark, term in term_result.all():
            results["terms"].append({
                "id": str(bookmark.id),
                "term_id": str(term.id),
                "term": term.term,
                "definition": term.definition,
                "language": term.language,
                "domain": term.domain,
                "bookmarked_at": bookmark.created_at.isoformat(),
                "notes": bookmark.notes
            })
    
    if search_request.type in ["glossaries", "all"]:
        # Search glossary bookmarks
        glossary_query = select(GlossaryBookmark).where(
            and_(
                GlossaryBookmark.user_id == current_user.id,
                or_(
                    GlossaryBookmark.domain.ilike(f"%{search_request.query}%"),
                    GlossaryBookmark.description.ilike(f"%{search_request.query}%")
                )
            )
        ).offset(skip).limit(limit)
        
        glossary_result = await db.execute(glossary_query)
        
        for bookmark in glossary_result.scalars().all():
            results["glossaries"].append({
                "id": str(bookmark.id),
                "domain": bookmark.domain,
                "term_count": bookmark.term_count,
                "bookmarked_at": bookmark.created_at.isoformat(),
                "description": bookmark.description,
                "notes": bookmark.notes
            })
    
    return results
