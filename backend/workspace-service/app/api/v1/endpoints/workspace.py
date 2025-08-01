from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from sqlalchemy.orm import selectinload
from uuid import UUID, uuid4
from datetime import datetime

from mavito_common.db.session import get_db
from mavito_common.models.term import Term
from mavito_common.models.user import User as UserModel
from mavito_common.models.workspace import (
    BookmarkedTerm,
    BookmarkedGlossary,
    WorkspaceGroup,
    WorkspaceGroupItem,
    ItemType,
)
from mavito_common.schemas.workspace import (
    BookmarkedTermCreate,
    BookmarkedTermUpdate,
    BookmarkedTermResponse,
    BookmarkedTermWithDetails,
    BookmarkedGlossaryCreate,
    BookmarkedGlossaryResponse,
    WorkspaceGroupCreate,
    WorkspaceGroupResponse,
    WorkspaceGroupItemCreate,
    WorkspaceGroupItemBulkCreate,
    WorkspaceGroupItemResponse,
    SearchTermsRequest,
    SearchTermsResponse,
    BulkDeleteRequest,
    WorkspaceOverviewResponse,
)
from app import deps
from app.crud import crud_workspace

router = APIRouter()

# ========== BOOKMARK ENDPOINTS ==========


@router.post("/bookmarks/terms", response_model=BookmarkedTermResponse)
async def bookmark_term(
    bookmark_data: BookmarkedTermCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Bookmark a term for a user."""
    # Use CRUD operations
    existing_bookmark = await crud_workspace.get_bookmarked_term(
        db=db,
        user_id=current_user.id,
        term_id=bookmark_data.term_id
    )
    
    if existing_bookmark:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Term is already bookmarked"
        )

    bookmark = await crud_workspace.create_bookmarked_term(
        db=db,
        obj_in=bookmark_data,
        user_id=current_user.id
    )

    return bookmark

    # Check if already bookmarked
    existing_query = select(BookmarkedTerm).where(
        and_(
            BookmarkedTerm.user_id == user_id,
            BookmarkedTerm.term_id == bookmark_data.term_id,
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
        bookmarked_at=datetime.utcnow(),
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
        created_at=new_bookmark.created_at,
    )


@router.get("/bookmarks/terms", response_model=List[BookmarkedTermWithDetails])
async def get_bookmarked_terms(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Get all bookmarked terms for a user with term details."""
    query = (
        select(BookmarkedTerm, Term)
        .join(Term, BookmarkedTerm.term_id == Term.id)
        .where(BookmarkedTerm.user_id == current_user.id)
        .order_by(desc(BookmarkedTerm.bookmarked_at))
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    bookmark_term_pairs = result.all()

    return [
        BookmarkedTermWithDetails(
            id=bookmark.id,
            user_id=bookmark.user_id,
            term_id=bookmark.term_id,
            notes=bookmark.notes,
            bookmarked_at=bookmark.bookmarked_at,
            created_at=bookmark.created_at,
            term=term.term,
            definition=term.definition,
            domain=term.domain,
            language=term.language,
            example=term.example,
        )
        for bookmark, term in bookmark_term_pairs
    ]


@router.delete("/bookmarks/terms/{term_id}")
async def unbookmark_term(
    term_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Remove a bookmarked term."""
    bookmark_query = select(BookmarkedTerm).where(
        and_(BookmarkedTerm.user_id == current_user.id, BookmarkedTerm.term_id == term_id)
    )
    bookmark_result = await db.execute(bookmark_query)
    bookmark = bookmark_result.scalars().first()

    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmarked term not found")

    await db.delete(bookmark)
    await db.commit()

    return {"message": "Term unbookmarked successfully"}


@router.put("/bookmarks/terms/{term_id}", response_model=BookmarkedTermResponse)
async def update_bookmarked_term(
    term_id: UUID,
    update_data: BookmarkedTermUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Update notes for a bookmarked term."""
    bookmark_query = select(BookmarkedTerm).where(
        and_(BookmarkedTerm.user_id == current_user.id, BookmarkedTerm.term_id == term_id)
    )
    bookmark_result = await db.execute(bookmark_query)
    bookmark = bookmark_result.scalars().first()

    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmarked term not found")

    # Update the notes
    bookmark.notes = update_data.notes

    await db.commit()
    await db.refresh(bookmark)

    return BookmarkedTermResponse(
        id=bookmark.id,
        user_id=bookmark.user_id,
        term_id=bookmark.term_id,
        notes=bookmark.notes,
        bookmarked_at=bookmark.bookmarked_at,
        created_at=bookmark.created_at,
    )


# ========== GLOSSARY BOOKMARK ENDPOINTS ==========


@router.post("/bookmarks/glossaries", response_model=BookmarkedGlossaryResponse)
async def bookmark_glossary(
    bookmark_data: BookmarkedGlossaryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Bookmark a glossary (domain) for a user."""
    # Check if already bookmarked
    existing_query = select(BookmarkedGlossary).where(
        and_(
            BookmarkedGlossary.user_id == current_user.id,
            BookmarkedGlossary.domain == bookmark_data.domain,
        )
    )
    existing_result = await db.execute(existing_query)
    existing = existing_result.scalars().first()

    if existing:
        raise HTTPException(status_code=400, detail="Glossary already bookmarked")

    # Create bookmark
    new_bookmark = BookmarkedGlossary(
        id=uuid4(),
        user_id=current_user.id,
        domain=bookmark_data.domain,
        notes=bookmark_data.notes,
        bookmarked_at=datetime.utcnow(),
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
        created_at=new_bookmark.created_at,
    )


@router.get("/bookmarks/glossaries", response_model=List[BookmarkedGlossaryResponse])
async def get_bookmarked_glossaries(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Get all bookmarked glossaries for a user."""
    query = (
        select(BookmarkedGlossary)
        .where(BookmarkedGlossary.user_id == current_user.id)
        .order_by(desc(BookmarkedGlossary.bookmarked_at))
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(query)
    bookmarks = result.scalars().all()

    return [
        BookmarkedGlossaryResponse(
            id=bookmark.id,
            user_id=bookmark.user_id,
            domain=bookmark.domain,
            notes=bookmark.notes,
            bookmarked_at=bookmark.bookmarked_at,
            created_at=bookmark.created_at,
        )
        for bookmark in bookmarks
    ]


@router.delete("/bookmarks/glossaries/{domain}")
async def unbookmark_glossary(
    domain: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Remove a bookmarked glossary."""
    bookmark_query = select(BookmarkedGlossary).where(
        and_(BookmarkedGlossary.user_id == current_user.id, BookmarkedGlossary.domain == domain)
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
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Create a new workspace group."""
    new_group = WorkspaceGroup(
        id=uuid4(),
        user_id=current_user.id,
        name=group_data.name,
        description=getattr(group_data, 'description', None),
        group_type=group_data.group_type,
        color=getattr(group_data, 'color', None),
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
        items=[],
    )


@router.delete("/groups/{group_id}")
async def delete_group(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Delete a workspace group and all its items."""
    # Check if group exists and belongs to user
    group_query = select(WorkspaceGroup).where(
        and_(
            WorkspaceGroup.id == group_id,
            WorkspaceGroup.user_id == current_user.id,
        )
    )
    group_result = await db.execute(group_query)
    group = group_result.scalar_one_or_none()

    if not group:
        raise HTTPException(
            status_code=404, detail="Group not found or access denied"
        )

    # Delete the group (CASCADE will handle items)
    await db.delete(group)
    await db.commit()

    return {"message": "Group deleted successfully"}


@router.get("/groups", response_model=List[WorkspaceGroupResponse])
async def get_user_groups(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Get all groups for a user."""
    groups_query = (
        select(WorkspaceGroup)
        .where(WorkspaceGroup.user_id == current_user.id)
        .options(selectinload(WorkspaceGroup.items))
        .order_by(desc(WorkspaceGroup.created_at))
    )

    groups_result = await db.execute(groups_query)
    groups = groups_result.scalars().all()

    result = []
    for group in groups:
        items = []
        for item in group.items:
            items.append(
                WorkspaceGroupItemResponse(
                    id=item.id,
                    group_id=item.group_id,
                    item_type=item.item_type,
                    term_id=item.term_id,
                    domain=item.domain,
                    added_at=item.added_at,
                    created_at=item.created_at,
                )
            )

        result.append(
            WorkspaceGroupResponse(
                id=group.id,
                user_id=group.user_id,
                name=group.name,
                description=group.description,
                group_type=group.group_type,
                color=group.color,
                created_at=group.created_at,
                updated_at=group.updated_at,
                items=items,
            )
        )

    return result


@router.post("/groups/{group_id}/items", response_model=WorkspaceGroupItemResponse)
async def add_item_to_group(
    group_id: UUID,
    item_data: WorkspaceGroupItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Add an item to a workspace group."""
    # Check if group exists and belongs to user
    group_query = select(WorkspaceGroup).where(
        and_(WorkspaceGroup.id == group_id, WorkspaceGroup.user_id == current_user.id)
    )
    group_result = await db.execute(group_query)
    group = group_result.scalars().first()

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Validate item based on type
    if item_data.item_type == ItemType.TERM:
        if not item_data.term_id:
            raise HTTPException(
                status_code=400, detail="term_id required for TERM items"
            )
        # Check if term exists
        term_query = select(Term).where(Term.id == item_data.term_id)
        term_result = await db.execute(term_query)
        if not term_result.scalars().first():
            raise HTTPException(status_code=404, detail="Term not found")

    elif item_data.item_type == ItemType.GLOSSARY:
        if not item_data.domain:
            raise HTTPException(
                status_code=400, detail="domain required for GLOSSARY items"
            )

    # Check if item already exists in group
    existing_query = select(WorkspaceGroupItem).where(
        and_(
            WorkspaceGroupItem.group_id == group_id,
            or_(
                and_(
                    WorkspaceGroupItem.item_type == ItemType.TERM,
                    WorkspaceGroupItem.term_id == item_data.term_id,
                ),
                and_(
                    WorkspaceGroupItem.item_type == ItemType.GLOSSARY,
                    WorkspaceGroupItem.domain == item_data.domain,
                ),
            ),
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
        added_at=datetime.utcnow(),
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
        created_at=new_item.created_at,
    )


@router.post("/groups/{group_id}/items/bulk", response_model=List[WorkspaceGroupItemResponse])
async def bulk_add_terms_to_group(
    group_id: UUID,
    bulk_data: WorkspaceGroupItemBulkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Bulk add multiple terms to a workspace group."""
    # Check if group exists and belongs to user
    group_query = select(WorkspaceGroup).where(
        and_(WorkspaceGroup.id == group_id, WorkspaceGroup.user_id == current_user.id)
    )
    group_result = await db.execute(group_query)
    group = group_result.scalars().first()

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Validate all terms exist and are bookmarked by the user
    terms_query = select(BookmarkedTerm).where(
        and_(
            BookmarkedTerm.user_id == current_user.id,
            BookmarkedTerm.term_id.in_(bulk_data.term_ids)
        )
    )
    terms_result = await db.execute(terms_query)
    bookmarked_terms = terms_result.scalars().all()
    
    bookmarked_term_ids = {term.term_id for term in bookmarked_terms}
    
    # Check for missing terms
    missing_terms = set(bulk_data.term_ids) - bookmarked_term_ids
    if missing_terms:
        raise HTTPException(
            status_code=400, 
            detail=f"Some terms are not bookmarked by user: {list(missing_terms)}"
        )

    # Check for existing items in group to avoid duplicates
    existing_query = select(WorkspaceGroupItem).where(
        and_(
            WorkspaceGroupItem.group_id == group_id,
            WorkspaceGroupItem.item_type == ItemType.TERM,
            WorkspaceGroupItem.term_id.in_(bulk_data.term_ids)
        )
    )
    existing_result = await db.execute(existing_query)
    existing_items = existing_result.scalars().all()
    existing_term_ids = {item.term_id for item in existing_items}
    
    # Filter out terms that already exist in the group
    new_term_ids = bookmarked_term_ids - existing_term_ids
    
    if not new_term_ids:
        raise HTTPException(
            status_code=400, 
            detail="All selected terms are already in the group"
        )

    # Create new group items
    new_items = []
    current_time = datetime.utcnow()
    
    for term_id in new_term_ids:
        new_item = WorkspaceGroupItem(
            id=uuid4(),
            group_id=group_id,
            item_type=ItemType.TERM,
            term_id=term_id,
            domain=None,  # Will be populated from term details if needed
            added_at=current_time,
        )
        new_items.append(new_item)
        db.add(new_item)

    await db.commit()
    
    # Refresh all items to get created_at timestamps
    for item in new_items:
        await db.refresh(item)

    # Return response objects
    response_items = []
    for item in new_items:
        response_items.append(
            WorkspaceGroupItemResponse(
                id=item.id,
                group_id=item.group_id,
                item_type=item.item_type,
                term_id=item.term_id,
                domain=item.domain,
                added_at=item.added_at,
                created_at=item.created_at,
            )
        )

    return response_items


# ========== SEARCH ENDPOINTS ==========


@router.post("/search", response_model=SearchTermsResponse)
async def search_bookmarked_terms(
    search_request: SearchTermsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Search through user's bookmarked terms."""
    query = select(BookmarkedTerm).where(BookmarkedTerm.user_id == current_user.id)

    if search_request.query:
        # Join with Term to search term content
        query = query.join(Term).where(
            or_(
                Term.term.ilike(f"%{search_request.query}%"),
                Term.definition.ilike(f"%{search_request.query}%"),
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
        terms.append(
            {
                "id": str(bookmark.term.id),
                "term": bookmark.term.term,
                "definition": bookmark.term.definition,
                "domain": bookmark.term.domain,
                "language": bookmark.term.language,
                "bookmarked_at": bookmark.bookmarked_at,
                "notes": bookmark.notes,
            }
        )

    return SearchTermsResponse(
        terms=terms,
        total=total_count,
        page=search_request.page,
        limit=search_request.limit,
        pages=(total_count + search_request.limit - 1) // search_request.limit,
    )


# ========== BULK OPERATIONS ==========


@router.delete("/bulk")
async def bulk_delete(
    delete_request: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Bulk delete bookmarks or groups."""
    deleted_count = 0

    if delete_request.bookmark_ids:
        # Delete bookmarked terms
        bookmark_query = select(BookmarkedTerm).where(
            and_(
                BookmarkedTerm.user_id == current_user.id,
                BookmarkedTerm.id.in_(delete_request.bookmark_ids),
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
                WorkspaceGroup.user_id == current_user.id,
                WorkspaceGroup.id.in_(delete_request.group_ids),
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
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_user),
):
    """Get workspace overview for a user."""
    # Count bookmarked terms
    terms_count_query = select(func.count()).select_from(
        select(BookmarkedTerm).where(BookmarkedTerm.user_id == current_user.id).subquery()
    )
    terms_count = await db.scalar(terms_count_query) or 0

    # Count bookmarked glossaries
    glossaries_count_query = select(func.count()).select_from(
        select(BookmarkedGlossary)
        .where(BookmarkedGlossary.user_id == current_user.id)
        .subquery()
    )
    glossaries_count = await db.scalar(glossaries_count_query) or 0

    # Count workspace groups
    groups_count_query = select(func.count()).select_from(
        select(WorkspaceGroup).where(WorkspaceGroup.user_id == current_user.id).subquery()
    )
    groups_count = await db.scalar(groups_count_query) or 0

    # Get recent bookmarks (last 5)
    recent_query = (
        select(BookmarkedTerm)
        .where(BookmarkedTerm.user_id == current_user.id)
        .options(selectinload(BookmarkedTerm.term))
        .order_by(desc(BookmarkedTerm.bookmarked_at))
        .limit(5)
    )

    recent_result = await db.execute(recent_query)
    recent_bookmarks = recent_result.scalars().all()

    recent_terms = []
    for bookmark in recent_bookmarks:
        recent_terms.append(
            {
                "id": str(bookmark.term.id),
                "term": bookmark.term.term,
                "definition": bookmark.term.definition,
                "domain": bookmark.term.domain,
                "language": bookmark.term.language,
                "bookmarked_at": bookmark.bookmarked_at,
            }
        )

    return WorkspaceOverviewResponse(
        total_bookmarked_terms=terms_count,
        total_bookmarked_glossaries=glossaries_count,
        total_groups=groups_count,
        recent_terms=recent_terms,
    )
