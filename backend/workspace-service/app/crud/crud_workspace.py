# app/crud/crud_workspace.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, distinct, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from uuid import UUID

from mavito_common.models.workspace import (
    BookmarkedTerm,
    BookmarkedGlossary,
    WorkspaceGroup,
    WorkspaceGroupItem,
    GroupType,
)
from mavito_common.models.term import Term
from mavito_common.schemas.workspace import (
    BookmarkedTermCreate,
    BookmarkedGlossaryCreate,
    WorkspaceGroupCreate,
    WorkspaceGroupUpdate,
    WorkspaceGroupItemCreate,
    SearchTermsRequest,
    BulkDeleteRequest,
)


class CRUDWorkspace:

    # Bookmarked Terms CRUD
    async def create_bookmarked_term(
        self, db: AsyncSession, *, obj_in: BookmarkedTermCreate, user_id: UUID
    ) -> BookmarkedTerm:
        """Create a new bookmarked term."""
        db_obj = BookmarkedTerm(
            user_id=user_id, term_id=obj_in.term_id, notes=obj_in.notes
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_bookmarked_terms(
        self, db: AsyncSession, *, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[BookmarkedTerm]:
        """Get user's bookmarked terms with pagination."""
        result = await db.execute(
            select(BookmarkedTerm)
            .options(selectinload(BookmarkedTerm.term))
            .filter(BookmarkedTerm.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_bookmarked_term(
        self, db: AsyncSession, *, user_id: UUID, term_id: UUID
    ) -> Optional[BookmarkedTerm]:
        """Get specific bookmarked term."""
        result = await db.execute(
            select(BookmarkedTerm)
            .options(selectinload(BookmarkedTerm.term))
            .filter(
                and_(
                    BookmarkedTerm.user_id == user_id, BookmarkedTerm.term_id == term_id
                )
            )
        )
        return result.scalars().first()

    async def delete_bookmarked_term(
        self, db: AsyncSession, *, user_id: UUID, term_id: UUID
    ) -> bool:
        """Delete a bookmarked term."""
        result = await db.execute(
            select(BookmarkedTerm).filter(
                and_(
                    BookmarkedTerm.user_id == user_id, BookmarkedTerm.term_id == term_id
                )
            )
        )
        db_obj = result.scalars().first()
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return True
        return False

    # Bookmarked Glossaries CRUD
    async def create_bookmarked_glossary(
        self, db: AsyncSession, *, obj_in: BookmarkedGlossaryCreate, user_id: UUID
    ) -> BookmarkedGlossary:
        """Create a new bookmarked glossary."""
        db_obj = BookmarkedGlossary(
            user_id=user_id, glossary_name=obj_in.glossary_name, notes=obj_in.notes
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_bookmarked_glossaries(
        self, db: AsyncSession, *, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[BookmarkedGlossary]:
        """Get user's bookmarked glossaries with pagination."""
        result = await db.execute(
            select(BookmarkedGlossary)
            .filter(BookmarkedGlossary.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def delete_bookmarked_glossary(
        self, db: AsyncSession, *, user_id: UUID, glossary_name: str
    ) -> bool:
        """Delete a bookmarked glossary."""
        result = await db.execute(
            select(BookmarkedGlossary).filter(
                and_(
                    BookmarkedGlossary.user_id == user_id,
                    BookmarkedGlossary.glossary_name == glossary_name,
                )
            )
        )
        db_obj = result.scalars().first()
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return True
        return False

    # Workspace Groups CRUD
    async def create_workspace_group(
        self, db: AsyncSession, *, obj_in: WorkspaceGroupCreate, user_id: UUID
    ) -> WorkspaceGroup:
        """Create a new workspace group."""
        db_obj = WorkspaceGroup(
            user_id=user_id,
            name=obj_in.name,
            description=obj_in.description,
            group_type=obj_in.group_type,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_workspace_groups(
        self, db: AsyncSession, *, user_id: UUID, group_type: Optional[GroupType] = None
    ) -> List[WorkspaceGroup]:
        """Get user's workspace groups, optionally filtered by type."""
        query = select(WorkspaceGroup).filter(WorkspaceGroup.user_id == user_id)
        if group_type:
            query = query.filter(WorkspaceGroup.group_type == group_type)

        result = await db.execute(query)
        return result.scalars().all()

    async def get_workspace_group(
        self, db: AsyncSession, *, group_id: UUID, user_id: UUID
    ) -> Optional[WorkspaceGroup]:
        """Get specific workspace group."""
        result = await db.execute(
            select(WorkspaceGroup)
            .options(selectinload(WorkspaceGroup.items))
            .filter(
                and_(WorkspaceGroup.id == group_id, WorkspaceGroup.user_id == user_id)
            )
        )
        return result.scalars().first()

    async def update_workspace_group(
        self,
        db: AsyncSession,
        *,
        group_id: UUID,
        user_id: UUID,
        obj_in: WorkspaceGroupUpdate,
    ) -> Optional[WorkspaceGroup]:
        """Update workspace group."""
        result = await db.execute(
            select(WorkspaceGroup).filter(
                and_(WorkspaceGroup.id == group_id, WorkspaceGroup.user_id == user_id)
            )
        )
        db_obj = result.scalars().first()
        if db_obj:
            update_data = obj_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_obj, field, value)
            await db.commit()
            await db.refresh(db_obj)
        return db_obj

    async def delete_workspace_group(
        self, db: AsyncSession, *, group_id: UUID, user_id: UUID
    ) -> bool:
        """Delete workspace group and its items."""
        result = await db.execute(
            select(WorkspaceGroup).filter(
                and_(WorkspaceGroup.id == group_id, WorkspaceGroup.user_id == user_id)
            )
        )
        db_obj = result.scalars().first()
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return True
        return False

    # Workspace Group Items CRUD
    async def add_item_to_group(
        self, db: AsyncSession, *, obj_in: WorkspaceGroupItemCreate, user_id: UUID
    ) -> WorkspaceGroupItem:
        """Add item to workspace group."""
        # Verify group belongs to user
        group_result = await db.execute(
            select(WorkspaceGroup).filter(
                and_(
                    WorkspaceGroup.id == obj_in.group_id,
                    WorkspaceGroup.user_id == user_id,
                )
            )
        )
        if not group_result.scalars().first():
            raise ValueError("Group not found or doesn't belong to user")

        db_obj = WorkspaceGroupItem(
            group_id=obj_in.group_id,
            item_type=obj_in.item_type,
            term_id=obj_in.term_id,
            glossary_name=obj_in.glossary_name,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove_item_from_group(
        self, db: AsyncSession, *, item_id: UUID, user_id: UUID
    ) -> bool:
        """Remove item from workspace group."""
        # Join with WorkspaceGroup to verify ownership
        result = await db.execute(
            select(WorkspaceGroupItem)
            .join(WorkspaceGroup)
            .filter(
                and_(
                    WorkspaceGroupItem.id == item_id, WorkspaceGroup.user_id == user_id
                )
            )
        )
        db_obj = result.scalars().first()
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
            return True
        return False

    # Search and Filter Operations
    async def search_bookmarked_terms(
        self, db: AsyncSession, *, user_id: UUID, request: SearchTermsRequest
    ) -> List[BookmarkedTerm]:
        """Search bookmarked terms with filters."""
        query = (
            select(BookmarkedTerm)
            .options(selectinload(BookmarkedTerm.term))
            .filter(BookmarkedTerm.user_id == user_id)
        )

        if request.search_query:
            # Search in term content and notes
            search_filter = or_(
                BookmarkedTerm.notes.ilike(f"%{request.search_query}%"),
                Term.term.ilike(f"%{request.search_query}%"),
                Term.definition.ilike(f"%{request.search_query}%"),
            )
            query = query.join(Term).filter(search_filter)

        if request.glossary_filter:
            query = query.join(Term).filter(
                Term.glossary_name == request.glossary_filter
            )

        if request.language_filter:
            query = query.join(Term).filter(
                Term.language_code == request.language_filter
            )

        if request.date_from:
            query = query.filter(BookmarkedTerm.created_at >= request.date_from)

        if request.date_to:
            query = query.filter(BookmarkedTerm.created_at <= request.date_to)

        # Apply sorting
        if request.sort_by == "date_asc":
            query = query.order_by(BookmarkedTerm.created_at.asc())
        elif request.sort_by == "date_desc":
            query = query.order_by(BookmarkedTerm.created_at.desc())
        elif request.sort_by == "alphabetical":
            query = query.join(Term).order_by(Term.term.asc())

        # Apply pagination
        query = query.offset(request.skip).limit(request.limit)

        result = await db.execute(query)
        return result.scalars().all()

    # Bulk Operations
    async def bulk_delete_bookmarked_terms(
        self, db: AsyncSession, *, user_id: UUID, request: BulkDeleteRequest
    ) -> int:
        """Bulk delete bookmarked terms."""
        if request.term_ids:
            result = await db.execute(
                select(BookmarkedTerm).filter(
                    and_(
                        BookmarkedTerm.user_id == user_id,
                        BookmarkedTerm.term_id.in_(request.term_ids),
                    )
                )
            )
            items = result.scalars().all()
            count = len(items)
            for item in items:
                await db.delete(item)
            await db.commit()
            return count
        return 0

    async def bulk_delete_bookmarked_glossaries(
        self, db: AsyncSession, *, user_id: UUID, request: BulkDeleteRequest
    ) -> int:
        """Bulk delete bookmarked glossaries."""
        if request.glossary_names:
            result = await db.execute(
                select(BookmarkedGlossary).filter(
                    and_(
                        BookmarkedGlossary.user_id == user_id,
                        BookmarkedGlossary.glossary_name.in_(request.glossary_names),
                    )
                )
            )
            items = result.scalars().all()
            count = len(items)
            for item in items:
                await db.delete(item)
            await db.commit()
            return count
        return 0

    # Analytics and Overview
    async def get_workspace_overview(
        self, db: AsyncSession, *, user_id: UUID
    ) -> Dict[str, Any]:
        """Get workspace overview statistics."""
        # Count bookmarked terms
        terms_result = await db.execute(
            select(func.count(BookmarkedTerm.id)).filter(
                BookmarkedTerm.user_id == user_id
            )
        )
        terms_count = terms_result.scalar()

        # Count bookmarked glossaries
        glossaries_result = await db.execute(
            select(func.count(BookmarkedGlossary.id)).filter(
                BookmarkedGlossary.user_id == user_id
            )
        )
        glossaries_count = glossaries_result.scalar()

        # Count workspace groups
        groups_result = await db.execute(
            select(func.count(WorkspaceGroup.id)).filter(
                WorkspaceGroup.user_id == user_id
            )
        )
        groups_count = groups_result.scalar()

        # Count unique languages in bookmarked terms
        languages_result = await db.execute(
            select(func.count(distinct(Term.language_code)))
            .select_from(BookmarkedTerm)
            .join(Term)
            .filter(BookmarkedTerm.user_id == user_id)
        )
        languages_count = languages_result.scalar()

        return {
            "bookmarked_terms": terms_count,
            "bookmarked_glossaries": glossaries_count,
            "workspace_groups": groups_count,
            "unique_languages": languages_count,
        }


# Create instance
workspace = CRUDWorkspace()
