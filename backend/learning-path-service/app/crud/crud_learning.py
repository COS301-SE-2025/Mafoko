from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct
from sqlalchemy.orm import selectinload
from sqlalchemy.dialects.postgresql import insert
from typing import List, Dict, Any
from uuid import UUID

from mavito_common.models.learning_path import LearningPath, LearningPathGlossary
from mavito_common.models.user_learning_progress import UserLearningProgress
from mavito_common.models.user_glossary_progress import UserGlossaryProgress
from mavito_common.schemas.learning_path import LearningPathCreate
from mavito_common.models.term import Term


class CRUDLearning:
    # --- Private Helper Function ---
    async def _process_terms_with_translations(
        self, terms: List[Term]
    ) -> List[Dict[str, Any]]:
        words_with_translations = []
        for term in terms:
            english_translation = None
            for t in term.translations:
                if t.language.lower() == "english":
                    english_translation = t.term
                    break
            words_with_translations.append(
                {
                    "id": term.id,
                    "term": term.term,
                    "definition": term.definition,
                    "english_translation": english_translation,
                }
            )
        return words_with_translations

    # --- Learning Path Management ---
    async def create_learning_path(
        self, db: AsyncSession, *, user_id: UUID, obj_in: LearningPathCreate
    ) -> Dict[str, Any]:
        db_path = LearningPath(
            path_name=obj_in.path_name,
            language_name=obj_in.language_name,
            user_id=user_id,
        )
        db_glossaries = [
            LearningPathGlossary(glossary_name=name) for name in obj_in.glossary_names
        ]
        db_path.selected_glossaries.extend(db_glossaries)
        db.add(db_path)
        await db.commit()
        await db.refresh(db_path, attribute_names=["selected_glossaries"])
        return {
            "id": db_path.id,
            "path_name": db_path.path_name,
            "language_name": db_path.language_name,
            "selected_glossaries": db_path.selected_glossaries,
            "completedPercentage": 0,
        }

    async def get_learning_paths_for_user(
        self, db: AsyncSession, *, user_id: UUID
    ) -> List[Dict[str, Any]]:
        paths_query = (
            select(LearningPath)
            .where(LearningPath.user_id == user_id)
            .options(selectinload(LearningPath.selected_glossaries))
            .order_by(LearningPath.path_name)
        )
        result = await db.execute(paths_query)
        user_paths = result.scalars().unique().all()
        if not user_paths:
            return []

        known_words_query = select(UserLearningProgress.term_id).where(
            UserLearningProgress.user_id == user_id
        )
        known_words_result = await db.execute(known_words_query)
        known_words_set = {row[0] for row in known_words_result.all()}

        paths_with_progress = []
        for path in user_paths:
            glossary_names = [g.glossary_name for g in path.selected_glossaries]
            total_terms_count = 0
            if glossary_names:
                total_terms_query = select(func.count(Term.id)).where(
                    Term.language == path.language_name, Term.domain.in_(glossary_names)
                )
                total_terms_count = await db.scalar(total_terms_query) or 0

            known_terms_count = 0
            if glossary_names and known_words_set:
                known_terms_in_path_query = select(func.count(Term.id)).where(
                    Term.id.in_(known_words_set),
                    Term.language == path.language_name,
                    Term.domain.in_(glossary_names),
                )
                known_terms_count = await db.scalar(known_terms_in_path_query) or 0

            percentage = (
                int((known_terms_count / total_terms_count) * 100)
                if total_terms_count > 0
                else 0
            )

            paths_with_progress.append(
                {
                    "id": path.id,
                    "path_name": path.path_name,
                    "language_name": path.language_name,
                    "selected_glossaries": path.selected_glossaries,
                    "completedPercentage": percentage,
                }
            )
        return paths_with_progress

    async def update_learning_path(
        self, db: AsyncSession, *, path_id: UUID, glossary_names: List[str]
    ) -> LearningPath | None:
        db_path = await db.get(
            LearningPath,
            path_id,
            options=[selectinload(LearningPath.selected_glossaries)],
        )
        if not db_path:
            return None

        db_path.selected_glossaries.clear()
        new_glossaries = [
            LearningPathGlossary(glossary_name=name) for name in glossary_names
        ]
        db_path.selected_glossaries.extend(new_glossaries)

        db.add(db_path)
        await db.commit()
        await db.refresh(db_path, attribute_names=["selected_glossaries"])
        return db_path

    async def delete_learning_path(
        self, db: AsyncSession, *, path_id: UUID
    ) -> LearningPath | None:
        path_to_delete = await db.get(LearningPath, path_id)
        if not path_to_delete:
            return None
        await db.delete(path_to_delete)
        await db.commit()
        return path_to_delete

    # --- Word/Term Progress and Data Fetching ---
    async def update_progress(
        self, db: AsyncSession, *, user_id: UUID, term_id: UUID
    ) -> None:
        stmt = (
            insert(UserLearningProgress)
            .values(user_id=user_id, term_id=term_id)
            .on_conflict_do_nothing(index_elements=["user_id", "term_id"])
        )
        await db.execute(stmt)
        await db.commit()

    async def get_word_counts_for_glossaries(
        self, db: AsyncSession, *, language_name: str, glossary_names: List[str]
    ) -> Dict[str, int]:
        """Efficiently gets the term count for a list of glossaries in a specific language."""
        if not glossary_names:
            return {}

        counts_query = (
            select(Term.domain, func.count(Term.id))
            .where(Term.language == language_name, Term.domain.in_(glossary_names))
            .group_by(Term.domain)
        )
        result = await db.execute(counts_query)
        return {domain: count for domain, count in result.all()}

    async def get_words_for_glossary(
        self, db: AsyncSession, *, user_id: UUID, language_name: str, glossary_name: str
    ) -> Dict[str, Any]:
        """
        Gets all terms for a glossary and their English translations, with robust cleaning.
        """
        # Clean the input from the URL to be safe
        clean_glossary_name = glossary_name.strip().lower()

        terms_query = (
            select(Term)
            .where(
                Term.language == language_name,
                # Clean the database column value before comparing
                func.lower(func.trim(Term.domain)) == clean_glossary_name,
            )
            .options(selectinload(Term.translations))
            .order_by(Term.term)
            .distinct()
        )

        terms_result = await db.execute(terms_query)
        all_terms = terms_result.scalars().all()

        if not all_terms:
            # If still not found, try replacing non-breaking spaces as a fallback
            terms_query_fallback = (
                select(Term)
                .where(
                    Term.language == language_name,
                    func.lower(func.trim(func.replace(Term.domain, "\xa0", " ")))
                    == clean_glossary_name,
                )
                .options(selectinload(Term.translations))
                .order_by(Term.term)
                .distinct()
            )
            terms_result = await db.execute(terms_query_fallback)
            all_terms = terms_result.scalars().all()

        if not all_terms:
            return {"words": [], "knownWordIds": [], "lastCardIndex": 0}

        processed_words = await self._process_terms_with_translations(all_terms)
        all_term_ids = [word["id"] for word in processed_words]

        known_words_query = select(UserLearningProgress.term_id).where(
            UserLearningProgress.user_id == user_id,
            UserLearningProgress.term_id.in_(all_term_ids),
        )
        known_words_result = await db.execute(known_words_query)
        known_word_ids = [kid for kid, in known_words_result.all()]

        progress = await self.get_session_progress(
            db,
            user_id=user_id,
            language_name=language_name,
            glossary_name=glossary_name,
        )
        return {
            "words": processed_words,
            "knownWordIds": known_word_ids,
            "lastCardIndex": progress.get("last_card_index", 0),
            "retryPileIds": progress.get("retry_pile_ids", []),
        }

    async def get_random_terms_for_language(
        self, db: AsyncSession, *, language_name: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        random_terms_query = (
            select(Term)
            .where(Term.language == language_name)
            .options(selectinload(Term.translations))
            .order_by(func.random())
            .limit(limit)
        )
        result = await db.execute(random_terms_query)
        terms = result.scalars().unique().all()
        return await self._process_terms_with_translations(terms)

    # --- Session Resumption ---
    async def get_session_progress(
        self, db: AsyncSession, *, user_id: UUID, language_name: str, glossary_name: str
    ) -> Dict[str, Any]:
        progress_query = select(UserGlossaryProgress).where(
            UserGlossaryProgress.user_id == user_id,
            UserGlossaryProgress.language_name == language_name,
            UserGlossaryProgress.glossary_name == glossary_name,
        )
        result = await db.execute(progress_query)
        progress = result.scalar_one_or_none()
        if not progress:
            return {"last_card_index": 0, "retry_pile_ids": []}
        return {
            "last_card_index": progress.last_card_index,
            "retry_pile_ids": progress.retry_pile_ids or [],
        }

    async def update_session_progress(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        language_name: str,
        glossary_name: str,
        last_card_index: int,
        retry_pile_ids: List[UUID]
    ):
        stmt = (
            insert(UserGlossaryProgress)
            .values(
                user_id=user_id,
                language_name=language_name,
                glossary_name=glossary_name,
                last_card_index=last_card_index,
                retry_pile_ids=retry_pile_ids,
            )
            .on_conflict_do_update(
                index_elements=["user_id", "language_name", "glossary_name"],
                set_={
                    "last_card_index": last_card_index,
                    "retry_pile_ids": retry_pile_ids,
                },
            )
        )
        await db.execute(stmt)
        await db.commit()

    async def get_progress_for_glossaries(
        self, db: AsyncSession, *, user_id: UUID, language_name: str
    ) -> List[Dict[str, Any]]:
        """Performs the database queries to calculate user progress for all glossaries in a language."""
        glossaries_query = select(distinct(Term.domain)).where(
            Term.language == language_name
        )
        glossaries_result = await db.execute(glossaries_query)
        available_glossaries = [g for g, in glossaries_result.all()]
        glossary_data = []
        for glossary_name in available_glossaries:
            total_terms_query = select(func.count(Term.id)).where(
                Term.language == language_name, Term.domain == glossary_name
            )
            total_terms_count = await db.scalar(total_terms_query) or 0
            if total_terms_count == 0:
                continue

            known_terms_query = (
                select(func.count(UserLearningProgress.term_id))
                .join(Term, UserLearningProgress.term_id == Term.id)
                .where(
                    UserLearningProgress.user_id == user_id,
                    Term.language == language_name,
                    Term.domain == glossary_name,
                )
            )
            known_terms_count = await db.scalar(known_terms_query) or 0

            percentage = (
                int((known_terms_count / total_terms_count) * 100)
                if total_terms_count > 0
                else 0
            )

            glossary_data.append(
                {
                    "id": glossary_name,
                    "name": glossary_name,
                    "words": total_terms_count,
                    "completedPercentage": percentage,
                }
            )
        return glossary_data

    # --- Global Dashboard (For Future Use) ---
    async def get_dashboard_progress(
        self, db: AsyncSession, *, user_id: UUID
    ) -> List[Dict[str, Any]]:
        languages_query = select(distinct(Term.language))
        languages_result = await db.execute(languages_query)
        available_languages = [lang for lang, in languages_result.all()]
        dashboard_data = []
        for lang in available_languages:
            total_terms_query = select(func.count(Term.id)).where(Term.language == lang)
            total_terms_count = await db.scalar(total_terms_query) or 0
            if total_terms_count == 0:
                continue

            known_terms_query = (
                select(func.count(UserLearningProgress.term_id))
                .join(Term, UserLearningProgress.term_id == Term.id)
                .where(UserLearningProgress.user_id == user_id, Term.language == lang)
            )
            known_terms_count = await db.scalar(known_terms_query) or 0

            percentage = (
                int((known_terms_count / total_terms_count) * 100)
                if total_terms_count > 0
                else 0
            )

            dashboard_data.append(
                {
                    "code": lang[:2].upper(),
                    "name": lang,
                    "totalWords": total_terms_count,
                    "completedPercentage": percentage,
                }
            )
        return dashboard_data


crud_learning = CRUDLearning()
