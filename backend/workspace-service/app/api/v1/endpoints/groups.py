from fastapi import APIRouter, HTTPException, Query, Depends, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, delete
import uuid

from mavito_common.models.term import Term
from mavito_common.models.user import User
from mavito_common.db.session import get_db
from mavito_common.schemas.workspace_group import (
    CreateGroupRequest,
    UpdateGroupRequest,
    AddTermsToGroupRequest,
    GroupResponse,
    GroupWithTermsResponse,
    BulkDeleteRequest
)
from app.api import deps

router = APIRouter()


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    *,
    db: AsyncSession = Depends(get_db),
    group_request: CreateGroupRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Create a new group for organizing bookmarked terms.
    """
    # Check if group name already exists for this user
    from mavito_common.models.workspace_group import WorkspaceGroup
    result = await db.execute(
        select(WorkspaceGroup).where(
            and_(
                WorkspaceGroup.user_id == current_user.id,
                WorkspaceGroup.name == group_request.name
            )
        )
    )
    existing_group = result.scalar_one_or_none()
    
    if existing_group:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Group with this name already exists"
        )
    
    # Create new group
    group = WorkspaceGroup(
        user_id=current_user.id,
        name=group_request.name,
        description=group_request.description
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)
    
    return GroupResponse(
        id=str(group.id),
        name=group.name,
        description=group.description,
        created_at=group.created_at.isoformat(),
        updated_at=group.updated_at.isoformat(),
        term_count=0,
        items=[]
    )


@router.get("", response_model=List[GroupResponse])
async def get_user_groups(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    Get all groups for the current user.
    """
    from mavito_common.models.workspace_group import WorkspaceGroup
    from mavito_common.models.group_term import GroupTerm
    
    # Get all groups for the user
    groups_result = await db.execute(
        select(WorkspaceGroup)
        .where(WorkspaceGroup.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by(WorkspaceGroup.created_at.desc())
    )
    
    groups = []
    for group in groups_result.scalars().all():
        # Get term count for each group
        term_count_result = await db.execute(
            select(func.count(GroupTerm.term_id))
            .where(GroupTerm.group_id == group.id)
        )
        term_count = term_count_result.scalar() or 0
        
        # Get terms for each group
        terms_result = await db.execute(
            select(GroupTerm)
            .where(GroupTerm.group_id == group.id)
            .order_by(GroupTerm.added_at.desc())
        )
        
        # Build items list for frontend
        items = []
        for group_term in terms_result.scalars().all():
            items.append({
                "term_id": str(group_term.term_id),
                "added_at": group_term.added_at.isoformat(),
                "item_type": "term"
            })
        
        group_response = GroupResponse(
            id=str(group.id),
            name=group.name,
            description=group.description,
            created_at=group.created_at.isoformat(),
            updated_at=group.updated_at.isoformat(),
            term_count=term_count,
            items=items
        )
        
        groups.append(group_response)
    
    return groups


@router.get("/{group_id}", response_model=GroupWithTermsResponse)
async def get_group_with_terms(
    *,
    db: AsyncSession = Depends(get_db),
    group_id: str,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get a specific group with all its terms.
    """
    try:
        group_uuid = uuid.UUID(group_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid group ID format"
        )
    
    from mavito_common.models.workspace_group import WorkspaceGroup
    from mavito_common.models.group_term import GroupTerm
    
    # Get group
    result = await db.execute(
        select(WorkspaceGroup).where(
            and_(
                WorkspaceGroup.id == group_uuid,
                WorkspaceGroup.user_id == current_user.id
            )
        )
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Get terms in this group
    terms_result = await db.execute(
        select(GroupTerm, Term)
        .join(Term, GroupTerm.term_id == Term.id)
        .where(GroupTerm.group_id == group_uuid)
        .order_by(GroupTerm.added_at.desc())
    )
    
    terms = []
    for group_term, term in terms_result.all():
        terms.append({
            "id": str(term.id),
            "term": term.term,
            "definition": term.definition,
            "language": term.language,
            "domain": term.domain,
            "added_at": group_term.added_at.isoformat()
        })
    
    return GroupWithTermsResponse(
        id=str(group.id),
        name=group.name,
        description=group.description,
        created_at=group.created_at.isoformat(),
        updated_at=group.updated_at.isoformat(),
        terms=terms
    )


@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    *,
    db: AsyncSession = Depends(get_db),
    group_id: str,
    update_request: UpdateGroupRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Update a group's name or description.
    """
    try:
        group_uuid = uuid.UUID(group_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid group ID format"
        )
    
    from mavito_common.models.workspace_group import WorkspaceGroup
    result = await db.execute(
        select(WorkspaceGroup).where(
            and_(
                WorkspaceGroup.id == group_uuid,
                WorkspaceGroup.user_id == current_user.id
            )
        )
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if new name conflicts with existing group
    if update_request.name and update_request.name != group.name:
        result = await db.execute(
            select(WorkspaceGroup).where(
                and_(
                    WorkspaceGroup.user_id == current_user.id,
                    WorkspaceGroup.name == update_request.name,
                    WorkspaceGroup.id != group_uuid
                )
            )
        )
        existing_group = result.scalar_one_or_none()
        
        if existing_group:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Group with this name already exists"
            )
    
    # Update group
    if update_request.name is not None:
        group.name = update_request.name
    if update_request.description is not None:
        group.description = update_request.description
    
    await db.commit()
    await db.refresh(group)
    
    # Get term count
    from mavito_common.models.group_term import GroupTerm
    term_count_result = await db.execute(
        select(func.count(GroupTerm.term_id)).where(GroupTerm.group_id == group_uuid)
    )
    term_count = term_count_result.scalar()
    
    return GroupResponse(
        id=str(group.id),
        name=group.name,
        description=group.description,
        created_at=group.created_at.isoformat(),
        updated_at=group.updated_at.isoformat(),
        term_count=term_count or 0
    )


@router.delete("/{group_id}", status_code=status.HTTP_200_OK)
async def delete_group(
    *,
    db: AsyncSession = Depends(get_db),
    group_id: str,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Delete a group and all its term associations.
    """
    try:
        group_uuid = uuid.UUID(group_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid group ID format"
        )
    
    from mavito_common.models.workspace_group import WorkspaceGroup
    from mavito_common.models.group_term import GroupTerm
    
    result = await db.execute(
        select(WorkspaceGroup).where(
            and_(
                WorkspaceGroup.id == group_uuid,
                WorkspaceGroup.user_id == current_user.id
            )
        )
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Delete all term associations first
    await db.execute(
        delete(GroupTerm).where(GroupTerm.group_id == group_uuid)
    )
    
    # Delete the group
    await db.delete(group)
    await db.commit()
    
    return {"message": "Group deleted successfully"}


@router.post("/{group_id}/terms", status_code=status.HTTP_201_CREATED)
async def add_terms_to_group(
    *,
    db: AsyncSession = Depends(get_db),
    group_id: str,
    terms_request: AddTermsToGroupRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Add multiple terms to a group.
    """
    try:
        group_uuid = uuid.UUID(group_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid group ID format"
        )
    
    from mavito_common.models.workspace_group import WorkspaceGroup
    from mavito_common.models.group_term import GroupTerm
    from mavito_common.models.bookmark import TermBookmark
    
    # Verify group belongs to user
    result = await db.execute(
        select(WorkspaceGroup).where(
            and_(
                WorkspaceGroup.id == group_uuid,
                WorkspaceGroup.user_id == current_user.id
            )
        )
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    added_terms = []
    skipped_terms = []
    
    for term_id_str in terms_request.term_ids:
        try:
            term_uuid = uuid.UUID(term_id_str)
        except ValueError:
            skipped_terms.append({"term_id": term_id_str, "reason": "Invalid UUID format"})
            continue
        
        # Check if user has bookmarked this term
        bookmark_result = await db.execute(
            select(TermBookmark).where(
                and_(
                    TermBookmark.user_id == current_user.id,
                    TermBookmark.term_id == term_uuid
                )
            )
        )
        bookmark = bookmark_result.scalar_one_or_none()
        
        if not bookmark:
            skipped_terms.append({"term_id": term_id_str, "reason": "Term not bookmarked by user"})
            continue
        
        # Check if term is already in this group
        existing_result = await db.execute(
            select(GroupTerm).where(
                and_(
                    GroupTerm.group_id == group_uuid,
                    GroupTerm.term_id == term_uuid
                )
            )
        )
        existing = existing_result.scalar_one_or_none()
        
        if existing:
            skipped_terms.append({"term_id": term_id_str, "reason": "Term already in group"})
            continue
        
        # Add term to group
        group_term = GroupTerm(
            group_id=group_uuid,
            term_id=term_uuid
        )
        db.add(group_term)
        added_terms.append(term_id_str)
    
    await db.commit()
    
    return {
        "message": f"Added {len(added_terms)} terms to group",
        "added_terms": added_terms,
        "skipped_terms": skipped_terms
    }


@router.delete("/{group_id}/terms/{term_id}", status_code=status.HTTP_200_OK)
async def remove_term_from_group(
    *,
    db: AsyncSession = Depends(get_db),
    group_id: str,
    term_id: str,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Remove a term from a group.
    """
    try:
        group_uuid = uuid.UUID(group_id)
        term_uuid = uuid.UUID(term_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format"
        )
    
    from mavito_common.models.workspace_group import WorkspaceGroup
    from mavito_common.models.group_term import GroupTerm
    
    # Verify group belongs to user
    result = await db.execute(
        select(WorkspaceGroup).where(
            and_(
                WorkspaceGroup.id == group_uuid,
                WorkspaceGroup.user_id == current_user.id
            )
        )
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Find and delete the group-term association
    result = await db.execute(
        select(GroupTerm).where(
            and_(
                GroupTerm.group_id == group_uuid,
                GroupTerm.term_id == term_uuid
            )
        )
    )
    group_term = result.scalar_one_or_none()
    
    if not group_term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Term not found in group"
        )
    
    await db.delete(group_term)
    await db.commit()
    
    return {"message": "Term removed from group successfully"}


@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
async def bulk_delete_groups(
    *,
    db: AsyncSession = Depends(get_db),
    delete_request: BulkDeleteRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Delete multiple groups at once.
    """
    from mavito_common.models.workspace_group import WorkspaceGroup
    from mavito_common.models.group_term import GroupTerm
    
    deleted_groups = []
    failed_groups = []
    
    for group_id_str in delete_request.group_ids:
        try:
            group_uuid = uuid.UUID(group_id_str)
        except ValueError:
            failed_groups.append({"group_id": group_id_str, "reason": "Invalid UUID format"})
            continue
        
        # Check if group exists and belongs to user
        result = await db.execute(
            select(WorkspaceGroup).where(
                and_(
                    WorkspaceGroup.id == group_uuid,
                    WorkspaceGroup.user_id == current_user.id
                )
            )
        )
        group = result.scalar_one_or_none()
        
        if not group:
            failed_groups.append({"group_id": group_id_str, "reason": "Group not found"})
            continue
        
        try:
            # Delete all term associations first
            await db.execute(
                delete(GroupTerm).where(GroupTerm.group_id == group_uuid)
            )
            
            # Delete the group
            await db.delete(group)
            deleted_groups.append(group_id_str)
        except Exception as e:
            failed_groups.append({"group_id": group_id_str, "reason": str(e)})
    
    await db.commit()
    
    return {
        "message": f"Deleted {len(deleted_groups)} groups",
        "deleted_groups": deleted_groups,
        "failed_groups": failed_groups
    }
