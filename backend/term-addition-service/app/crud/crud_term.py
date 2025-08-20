from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from typing import Any, Dict, List, Optional
from mavito_common.models.term import Term as TermModel, term_translations
from mavito_common.models.term_status import TermStatus
from mavito_common.schemas.term import Term, TermCreate
from mavito_common.schemas.term import Term as TermSchema  # noqa: F401


class CRUDTerm:
    async def create_term(
        self,
        db: AsyncSession,
        *,
        obj_in: TermCreate,
        owner_id: UUID,
        initial_status: TermStatus
    ) -> TermModel:
        """
        Creates a new term and links its translations automatically.
        """
        # Create the new term object
        db_obj = TermModel(
            term=obj_in.term,
            definition=obj_in.definition,
            language=obj_in.language,
            domain=obj_in.domain,
            example=obj_in.example,
            owner_id=owner_id,
            status=initial_status,
        )
        db.add(db_obj)
        await db.flush()  # Flush to get the new term's ID

        # If translations are provided, link them directly via the association table
        if obj_in.translations:
            # Fetch the translation TermModels from the database
            translations_to_link_query = await db.execute(
                select(TermModel).filter(TermModel.id.in_(obj_in.translations))
            )
            translations_to_link = translations_to_link_query.scalars().all()

            # Prepare values for direct insertion into the association table
            association_values = [
                {"term_id": db_obj.id, "translation_id": translation.id}
                for translation in translations_to_link
            ]

            # Insert the relationships directly
            if association_values:
                await db.execute(term_translations.insert().values(association_values))

        await db.commit()
        await db.refresh(db_obj)

        # Re-fetch the object with translations eagerly loaded to return a complete response
        db_obj_with_translations = await self.get_term_with_translations(
            db, term_id=db_obj.id
        )

        if not db_obj_with_translations:
            raise Exception("Failed to retrieve newly created term with translations.")

        return db_obj_with_translations

    async def get_term_with_translations(
        self, db: AsyncSession, *, term_id: UUID
    ) -> Optional[TermModel]:
        """
        Retrieves a single term by ID, with its translations eagerly loaded.
        """
        result = await db.execute(
            select(TermModel)
            .filter(TermModel.id == term_id)
            .options(selectinload(TermModel.translations))
        )
        return result.scalars().first()

    async def get_term_by_id(
        self, db: AsyncSession, *, term_id: UUID
    ) -> Optional[TermModel]:
        result = await db.execute(
            select(TermModel)
            .filter(TermModel.id == term_id)
            .options(selectinload(TermModel.translations))
        )
        return result.scalars().first()

    async def get_term_by_name_and_language(
        self, db: AsyncSession, *, term_name: str, language: str
    ) -> Optional[TermModel]:
        result = await db.execute(
            select(TermModel).filter(
                func.lower(TermModel.term) == func.lower(term_name),
                TermModel.language == language,
            )
        )
        return result.scalars().first()

    async def get_non_final_terms(self, db: AsyncSession) -> List[TermModel]:
        """
        Retrieves all terms that are not yet finalized, with translations and the owner eagerly loaded.
        Other heavy relationships (e.g., comments, bookmarks) are left un-loaded.
        """
        result = await db.execute(
            select(TermModel)
            .filter(TermModel.status != TermStatus.ADMIN_APPROVED)
            .options(
                selectinload(TermModel.translations), selectinload(TermModel.owner)
            )
            .order_by(TermModel.term)
        )
        return result.scalars().unique().all()

    async def update_term(
        self, db: AsyncSession, *, db_obj: TermModel, obj_in: Dict[str, Any]
    ) -> TermModel:
        for field, value in obj_in.items():
            if field == "translations":
                if value is not None:
                    await db.execute(
                        term_translations.delete().where(
                            term_translations.c.term_id == db_obj.id
                        )
                    )
                    await db.flush()
                    for translation_id in value:
                        await db.execute(
                            term_translations.insert().values(
                                term_id=db_obj.id, translation_id=translation_id
                            )
                        )
            elif field in [
                "term",
                "definition",
                "language",
                "domain",
                "example",
                "related_terms_ids",
            ]:
                if value is not None:
                    setattr(db_obj, field, value)
            elif field in [
                "id",
                "upvotes",
                "downvotes",
                "comments",
                "original_term_id",
            ]:
                continue

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        db_obj = (
            await db.execute(
                select(TermModel)
                .filter(TermModel.id == db_obj.id)
                .options(selectinload(TermModel.translations))
            )
            .scalars()
            .first()
        )

        return db_obj

    async def read_all_editable_terms(
        self, db_session: AsyncSession, user_id: str
    ) -> List[Term]:
        stmt = select(TermModel).options(
            selectinload(TermModel.translations),
            selectinload(TermModel.comments),
            selectinload(TermModel.owner),
        )
        result = await db_session.execute(stmt)
        return result.scalars().unique().all()

    async def get_admin_verified_terms(self, db: AsyncSession) -> List[TermModel]:
        """
        Retrieves all terms that have been approved by an admin.
        Translations are NOT loaded to keep the query fast for the dropdown list.
        """
        result = await db.execute(
            select(TermModel)
            .filter(TermModel.status == TermStatus.ADMIN_APPROVED)
            .options(selectinload(TermModel.owner))
            .order_by(TermModel.term)
        )
        return result.scalars().unique().all()

    async def get_terms_by_ids(
        self, db: AsyncSession, term_ids: List[UUID]
    ) -> List[TermModel]:
        """
        Retrieves terms by a list of UUIDs, eagerly loading translations.
        """
        query = await db.execute(
            select(TermModel)
            .where(TermModel.id.in_(term_ids))
            .options(selectinload(TermModel.translations))
        )
        terms = query.scalars().unique().all()  # Use unique() to de-duplicate results

        return terms

    async def delete(self, db: AsyncSession, *, term_id: UUID) -> TermModel:
        """
        Deletes a term by its ID.
        """
        term = await db.get(TermModel, term_id)
        if term:
            await db.delete(term)
            await db.commit()
            return term
        return None


crud_term = CRUDTerm()
