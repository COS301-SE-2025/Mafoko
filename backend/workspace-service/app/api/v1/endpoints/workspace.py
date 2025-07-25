from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from uuid import UUID, uuid4
from datetime import datetime

from mavito_common.db.session import get_db
from mavito_common.models.user import User
from mavito_common.models.term import Term
from mavito_common.models.workspace import (
    BookmarkedTerm,
    BookmarkedGlossary,
    WorkspaceGroup,
    WorkspaceGroupItem,
    GroupType,
    ItemType
)
from mavito_common.schemas.workspace import (
    BookmarkedTermCreate,
    BookmarkedTermResponse,
    BookmarkedGlossaryCreate,
    BookmarkedGlossaryResponse,
    WorkspaceGroupCreate,
    WorkspaceGroupResponse,
    WorkspaceGroupItemCreate,
    WorkspaceGroupItemResponse,
    SearchTermsRequest,
    SearchTermsResponse,
    BulkDeleteRequest,
    WorkspaceOverviewResponse
)
from app.crud.crud_workspace import workspace

router = APIRouter()

# ========== BOOKMARK ENDPOINTS ==========

@router.post("/bookmarks/terms", response_model=BookmarkedTermResponse)
async def bookmark_term(
    bookmark_data: BookmarkedTermCreate,
    user_id: UUID = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Bookmark a term for a user."""
    # Check if term exists
    term_query = select(Term).where(Term.id == bookmark_data.term_id)
    term_result = await db.execute(term_query)
    term = term_result.scalars().first()
    
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    
    # Check if already bookmarked
    existing_query = select(BookmarkedTerm).where(
        and_(
            BookmarkedTerm.user_id == user_id,
            BookmarkedTerm.term_id == bookmark_data.term_id
        )
    )
    existing_result = await db.execute(existing_query)
    existing = existing_result.scalars().first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Term already bookmarked")
    
    # Create bookmark
    new_bookmark = BookmarkedTerm(
        id=uuid4(),
        user_id=user_id,
        term_id=bookmark_data.term_id,
        notes=bookmark_data.notes,
        bookmarked_at=datetime.utcnow()
    )
    
    db.add(new_bookmark)
    await db.commit()
    await db.refresh(new_bookmark)
    
    return BookmarkedTermResponse(
        id=new_bookmark.id,
        user_id=new_bookmark.user_id,
        term_id=new_bookmark.term_id,
        notes=new_bookmark.notes,
        bookmarked_at=new_bookmark.bookmarked_at,
        created_at=new_bookmark.created_at
    )


@router.delete("/bookmarks/terms/{term_id}")
async def unbookmark_term(
    term_id: UUID,
    user_id: UUID = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Remove a bookmarked term."""
    bookmark_query = select(BookmarkedTerm).where(
        and_(
            BookmarkedTerm.user_id == user_id,
            BookmarkedTerm.term_id == term_id
        )
    )
    bookmark_result = await db.execute(bookmark_query)
    bookmark = bookmark_result.scalars().first()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmarked term not found")
    
    await db.delete(bookmark)
    await db.commit()
    
    return {"message": "Term unbookmarked successfully"}


@router.post("/bookmarks/glossaries", response_model=BookmarkedGlossaryResponse)
async def bookmark_glossary(
    bookmark_data: BookmarkedGlossaryCreate,
    user_id: UUID = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Bookmark a glossary (domain) for a user."""
    # Check if already bookmarked
    existing_query = select(BookmarkedGlossary).where(
        and_(
            BookmarkedGlossary.user_id == user_id,
            BookmarkedGlossary.domain == bookmark_data.domain
        )
    )
    existing_result = await db.execute(existing_query)
    existing = existing_result.scalars().first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Glossary already bookmarked")
    
    # Create bookmark
    new_bookmark = BookmarkedGlossary(
        id=uuid4(),
        user_id=user_id,
        domain=bookmark_data.domain,
        notes=bookmark_data.notes,
        bookmarked_at=datetime.utcnow()
    )
    
    db.add(new_bookmark)
    await db.commit()
    await db.refresh(new_bookmark)
    
    return BookmarkedGlossaryResponse(
        id=new_bookmark.id,
        user_id=new_bookmark.user_id,
        domain=new_bookmark.domain,
        notes=new_bookmark.notes,
        bookmarked_at=new_bookmark.bookmarked_at,
        created_at=new_bookmark.created_at
    )


@router.delete("/bookmarks/glossaries/{domain}")
async def unbookmark_glossary(
    domain: str,
    user_id: UUID = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Remove a bookmarked glossary."""
    bookmark_query = select(BookmarkedGlossary).where(
        and_(
            BookmarkedGlossary.user_id == user_id,
            BookmarkedGlossary.domain == domain
        )
    )
    bookmark_result = await db.execute(bookmark_query)
    bookmark = bookmark_result.scalars().first()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmarked glossary not found")
    
    await db.delete(bookmark)
    await db.commit()
    
    return {"message": "Glossary unbookmarked successfully"}


# ========== GROUP ENDPOINTS ==========

@router.post("/groups", response_model=WorkspaceGroupResponse)
async def create_group(
    group_data: WorkspaceGroupCreate,
    user_id: UUID = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Create a new workspace group."""
    new_group = WorkspaceGroup(
        id=uuid4(),
        user_id=user_id,
        name=group_data.name,
        description=group_data.description,
        group_type=group_data.group_type,
        color=group_data.color
    )
    
    db.add(new_group)
    await db.commit()
    await db.refresh(new_group)
    
    return WorkspaceGroupResponse(
        id=new_group.id,
        user_id=new_group.user_id,
        name=new_group.name,
        description=new_group.description,
        group_type=new_group.group_type,
        color=new_group.color,
        created_at=new_group.created_at,
        updated_at=new_group.updated_at,
        items=[]
    )


@router.get("/groups", response_model=List[WorkspaceGroupResponse])
async def get_user_groups(
    user_id: UUID = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get all groups for a user."""
    groups_query = select(WorkspaceGroup).where(
        WorkspaceGroup.user_id == user_id
    ).options(selectinload(WorkspaceGroup.items)).order_by(desc(WorkspaceGroup.created_at))
    
    groups_result = await db.execute(groups_query)
    groups = groups_result.scalars().all()
    
    result = []
    for group in groups:
        items = []
        for item in group.items:
            items.append(WorkspaceGroupItemResponse(
                id=item.id,
                group_id=item.group_id,
                item_type=item.item_type,
                term_id=item.term_id,
                domain=item.domain,
                added_at=item.added_at,
                created_at=item.created_at
            ))
        
        result.append(WorkspaceGroupResponse(
            id=group.id,
            user_id=group.user_id,
            name=group.name,
            description=group.description,
            group_type=group.group_type,
            color=group.color,
            created_at=group.created_at,
            updated_at=group.updated_at,
            items=items
        ))
    
    return result


@router.post("/groups/{group_id}/items", response_model=WorkspaceGroupItemResponse)
async def add_item_to_group(
    group_id: UUID,
    item_data: WorkspaceGroupItemCreate,
    user_id: UUID = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Add an item to a workspace group."""
    # Check if group exists and belongs to user
    group_query = select(WorkspaceGroup).where(
        and_(
            WorkspaceGroup.id == group_id,
            WorkspaceGroup.user_id == user_id
        )
    )
    group_result = await db.execute(group_query)
    group = group_result.scalars().first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Validate item based on type
    if item_data.item_type == ItemType.TERM:
        if not item_data.term_id:
            raise HTTPException(status_code=400, detail="term_id required for TERM items")
        # Check if term exists
        term_query = select(Term).where(Term.id == item_data.term_id)
        term_result = await db.execute(term_query)
        if not term_result.scalars().first():
            raise HTTPException(status_code=404, detail="Term not found")
    
    elif item_data.item_type == ItemType.GLOSSARY:
        if not item_data.domain:
            raise HTTPException(status_code=400, detail="domain required for GLOSSARY items")
    
    # Check if item already exists in group
    existing_query = select(WorkspaceGroupItem).where(
        and_(
            WorkspaceGroupItem.group_id == group_id,
            or_(
                and_(
                    WorkspaceGroupItem.item_type == ItemType.TERM,
                    WorkspaceGroupItem.term_id == item_data.term_id
                ),
                and_(
                    WorkspaceGroupItem.item_type == ItemType.GLOSSARY,
                    WorkspaceGroupItem.domain == item_data.domain
                )
            )
        )
    )
    existing_result = await db.execute(existing_query)
    if existing_result.scalars().first():
        raise HTTPException(status_code=400, detail="Item already exists in group")
    
    # Create group item
    new_item = WorkspaceGroupItem(
        id=uuid4(),
        group_id=group_id,
        item_type=item_data.item_type,
        term_id=item_data.term_id,
        domain=item_data.domain,
        added_at=datetime.utcnow()
    )
    
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    
    return WorkspaceGroupItemResponse(
        id=new_item.id,
        group_id=new_item.group_id,
        item_type=new_item.item_type,
        term_id=new_item.term_id,
        domain=new_item.domain,
        added_at=new_item.added_at,
        created_at=new_item.created_at
    )


# ========== SEARCH ENDPOINTS ==========

@router.post("/search", response_model=SearchTermsResponse)
async def search_bookmarked_terms(
    search_request: SearchTermsRequest,
    user_id: UUID = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Search through user's bookmarked terms."""
    query = select(BookmarkedTerm).where(BookmarkedTerm.user_id == user_id)
    
    if search_request.query:
        # Join with Term to search term content
        query = query.join(Term).where(
            or_(
                Term.term.ilike(f"%{search_request.query}%"),
                Term.definition.ilike(f"%{search_request.query}%")
            )
        )
    
    if search_request.domain:
        query = query.join(Term).where(Term.domain == search_request.domain)
    
    if search_request.language:
        query = query.join(Term).where(Term.language == search_request.language)
    
    # Add ordering and pagination
    query = query.order_by(desc(BookmarkedTerm.bookmarked_at))
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_count = await db.scalar(count_query) or 0
    
    # Apply pagination
    offset = (search_request.page - 1) * search_request.limit
    query = query.offset(offset).limit(search_request.limit)
    
    # Include term details
    query = query.options(selectinload(BookmarkedTerm.term))
    
    result = await db.execute(query)
    bookmarks = result.scalars().all()
    
    terms = []
    for bookmark in bookmarks:
        terms.append({
            "id": str(bookmark.term.id),
            "term": bookmark.term.term,
            "definition": bookmark.term.definition,
            "domain": bookmark.term.domain,
            "language": bookmark.term.language,
            "bookmarked_at": bookmark.bookmarked_at,
            "notes": bookmark.notes
        })
    
    return SearchTermsResponse(
        terms=terms,
        total=total_count,
        page=search_request.page,
        limit=search_request.limit,
        pages=(total_count + search_request.limit - 1) // search_request.limit
    )


# ========== BULK OPERATIONS ==========

@router.delete("/bulk")
async def bulk_delete(
    delete_request: BulkDeleteRequest,
    user_id: UUID = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Bulk delete bookmarks or groups."""
    deleted_count = 0
    
    if delete_request.bookmark_ids:
        # Delete bookmarked terms
        bookmark_query = select(BookmarkedTerm).where(
            and_(
                BookmarkedTerm.user_id == user_id,
                BookmarkedTerm.id.in_(delete_request.bookmark_ids)
            )
        )
        bookmark_result = await db.execute(bookmark_query)
        bookmarks = bookmark_result.scalars().all()
        
        for bookmark in bookmarks:
            await db.delete(bookmark)
            deleted_count += 1
    
    if delete_request.group_ids:
        # Delete workspace groups (cascade will handle items)
        group_query = select(WorkspaceGroup).where(
            and_(
                WorkspaceGroup.user_id == user_id,
                WorkspaceGroup.id.in_(delete_request.group_ids)
            )
        )
        group_result = await db.execute(group_query)
        groups = group_result.scalars().all()
        
        for group in groups:
            await db.delete(group)
            deleted_count += 1
    
    await db.commit()
    
    return {"message": f"Successfully deleted {deleted_count} items"}


# ========== OVERVIEW ENDPOINT ==========

@router.get("/overview", response_model=WorkspaceOverviewResponse)
async def get_workspace_overview(
    user_id: UUID = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get workspace overview for a user."""
    # Count bookmarked terms
    terms_count_query = select(func.count()).select_from(
        select(BookmarkedTerm).where(BookmarkedTerm.user_id == user_id).subquery()
    )
    terms_count = await db.scalar(terms_count_query) or 0
    
    # Count bookmarked glossaries
    glossaries_count_query = select(func.count()).select_from(
        select(BookmarkedGlossary).where(BookmarkedGlossary.user_id == user_id).subquery()
    )
    glossaries_count = await db.scalar(glossaries_count_query) or 0
    
    # Count workspace groups
    groups_count_query = select(func.count()).select_from(
        select(WorkspaceGroup).where(WorkspaceGroup.user_id == user_id).subquery()
    )
    groups_count = await db.scalar(groups_count_query) or 0
    
    # Get recent bookmarks (last 5)
    recent_query = select(BookmarkedTerm).where(
        BookmarkedTerm.user_id == user_id
    ).options(selectinload(BookmarkedTerm.term)).order_by(
        desc(BookmarkedTerm.bookmarked_at)
    ).limit(5)
    
    recent_result = await db.execute(recent_query)
    recent_bookmarks = recent_result.scalars().all()
    
    recent_terms = []
    for bookmark in recent_bookmarks:
        recent_terms.append({
            "id": str(bookmark.term.id),
            "term": bookmark.term.term,
            "definition": bookmark.term.definition,
            "domain": bookmark.term.domain,
            "language": bookmark.term.language,
            "bookmarked_at": bookmark.bookmarked_at
        })
    
    return WorkspaceOverviewResponse(
        total_bookmarked_terms=terms_count,
        total_bookmarked_glossaries=glossaries_count,
        total_groups=groups_count,
        recent_terms=recent_terms
    )
