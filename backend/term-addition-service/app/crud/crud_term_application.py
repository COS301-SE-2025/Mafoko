from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func, insert
from typing import Optional, List
from uuid import UUID
import uuid
from datetime import datetime

from mavito_common.models.term import term_translations
from mavito_common.models.term_application import TermApplication
from mavito_common.models.term_application import TermApplicationVote
from mavito_common.models.user import User as UserModel
from mavito_common.models.user import UserRole as UserRoleEnum
from mavito_common.models.term_status import TermStatus
from mavito_common.schemas.term_application import TermApplicationCreate
from mavito_common.schemas.term import TermCreate

from app.crud.crud_term import crud_term


class CRUDTermApplication:
    async def create_term_application(
        self,
        db: AsyncSession,
        *,
        obj_in: TermApplicationCreate,
        submitted_by_user_id: UUID,
        submitted_by_user: UserModel,
        submitted_by_user_role: UserRoleEnum,
    ) -> TermApplication:
        """
        Creates a new TermApplication for either a new term submission or an edit request.
        """
        initial_status = TermStatus.PENDING_VERIFICATION
        if submitted_by_user_role == UserRoleEnum.linguist:
            initial_status = TermStatus.LINGUIST_VERIFIED

        is_edit = obj_in.original_term_id is not None
        term_id_to_associate = obj_in.original_term_id
        db_term = None

        if not is_edit:
            # Create a new Term record
            db_term = await crud_term.create_term(
                db,
                obj_in=obj_in,
                owner_id=submitted_by_user_id,
                initial_status=initial_status,
            )
            term_id_to_associate = db_term.id
        else:
            # Check if the term to be edited exists
            existing_term = await crud_term.get_term_by_id(
                db, term_id=obj_in.original_term_id
            )
            if not existing_term:
                raise ValueError("Original term for edit not found.")
            # No term is created here, so db_term remains None.

        proposed_content_dict = obj_in.model_dump(
            exclude={"original_term_id", "id"}, exclude_unset=True
        )

        # Fix: Ensure translations are correctly formatted for the database
        if (
            "translations" in proposed_content_dict
            and proposed_content_dict["translations"] is not None
        ):
            proposed_content_dict["translations"] = [
                str(uuid_obj) for uuid_obj in proposed_content_dict["translations"]
            ]

        db_application = TermApplication(
            term_id=term_id_to_associate,
            submitted_by_user_id=submitted_by_user_id,
            submitted_by_user=submitted_by_user,
            proposed_content=proposed_content_dict,
            status=initial_status,
            is_edit_for_term_id=obj_in.original_term_id,
        )

        if submitted_by_user_role == UserRoleEnum.linguist:
            db_application.linguist_verified_by_user_id = submitted_by_user_id

        # This adds both objects to the session.
        # It's an atomic transaction.
        db.add(db_application)
        if db_term:
            db.add(db_term)

        # The final commit saves both the term and the application at once.
        await db.commit()
        await db.refresh(db_application)

        return db_application

    async def get_application_by_id(
        self, db: AsyncSession, application_id: UUID
    ) -> Optional[TermApplication]:
        result = await db.execute(
            select(TermApplication)
            .filter(TermApplication.id == application_id)
            .options(
                selectinload(TermApplication.submitted_by_user),
                selectinload(TermApplication.linguist_verifier),
                selectinload(TermApplication.admin_approver),
                selectinload(TermApplication.term),
                selectinload(TermApplication.votes).selectinload(
                    TermApplicationVote.user
                ),
            )
        )
        return result.scalars().first()

    async def get_all_applications(self, db: AsyncSession) -> List[TermApplication]:
        result = await db.execute(
            select(TermApplication)
            .options(
                selectinload(TermApplication.submitted_by_user),
                selectinload(TermApplication.linguist_verifier),
                selectinload(TermApplication.admin_approver),
                selectinload(TermApplication.term),
                selectinload(TermApplication.votes),
            )
            .order_by(TermApplication.submitted_at.desc())
        )
        return result.scalars().unique().all()

    async def get_applications_pending_verification(
        self, db: AsyncSession
    ) -> List[TermApplication]:
        result = await db.execute(
            select(TermApplication)
            .filter(TermApplication.status == TermStatus.PENDING_VERIFICATION)
            .options(
                selectinload(TermApplication.submitted_by_user),
                selectinload(TermApplication.term),
                selectinload(TermApplication.votes),
            )
            .order_by(TermApplication.submitted_at.asc())
        )
        return result.scalars().unique().all()

    async def get_applications_pending_admin_approval(
        self, db: AsyncSession
    ) -> List[TermApplication]:
        result = await db.execute(
            select(TermApplication)
            .filter(
                TermApplication.status.in_(
                    [TermStatus.CROWD_VERIFIED, TermStatus.LINGUIST_VERIFIED]
                )
            )
            .options(
                selectinload(TermApplication.submitted_by_user),
                selectinload(TermApplication.linguist_verifier),
                selectinload(TermApplication.term),
                selectinload(TermApplication.votes),
            )
            .order_by(TermApplication.submitted_at.asc())
        )
        return result.scalars().unique().all()

    async def add_application_vote(
        self, db: AsyncSession, *, application_id: UUID, voter_id: UUID
    ) -> Optional[TermApplication]:
        application = await self.get_application_by_id(db, application_id)
        if not application:
            return None

        if application.submitted_by_user_id == voter_id:
            raise ValueError("You cannot vote on your own term submission.")

        for vote in application.votes:
            if vote.user_id == voter_id:
                raise ValueError("User has already voted on this application.")

        if application.status != TermStatus.PENDING_VERIFICATION:
            raise ValueError(
                "This application is not in the correct status for crowdsource voting."
            )

        db_vote = TermApplicationVote(application_id=application_id, user_id=voter_id)
        db.add(db_vote)

        CROWD_VERIFICATION_THRESHOLD = 2
        current_votes = len(application.votes) + 1
        if current_votes >= CROWD_VERIFICATION_THRESHOLD:
            application.status = TermStatus.CROWD_VERIFIED
            application.reviewed_at = datetime.utcnow()

            if application.is_edit_for_term_id is None:
                term_to_update = await crud_term.get_term_by_id(
                    db, term_id=application.term_id
                )
                if term_to_update:
                    term_to_update.status = TermStatus.CROWD_VERIFIED
                    db.add(term_to_update)

        db.add(application)
        await db.commit()
        await db.refresh(application)
        return application

    async def update_application_status_and_term(
        self,
        db: AsyncSession,
        *,
        application_id: UUID,
        new_status: TermStatus,
        reviewer_id: Optional[UUID] = None,
        is_linguist_verification: bool = False,
        is_admin_approval: bool = False,
        review: Optional[str] = None,
    ) -> Optional[TermApplication]:
        application = await self.get_application_by_id(db, application_id)
        if not application:
            return None

        if new_status == TermStatus.REJECTED and not review:
            raise ValueError("Rejection requires review feedback.")
        if review and len(review) < 10:
            raise ValueError("Review must be at least 10 characters long.")
        if new_status == TermStatus.ADMIN_APPROVED and application.status not in [
            TermStatus.CROWD_VERIFIED,
            TermStatus.LINGUIST_VERIFIED,
        ]:
            raise ValueError(
                "Cannot admin-approve an application not in crowd-verified or linguist-verified status."
            )
        if new_status == TermStatus.LINGUIST_VERIFIED and application.status not in [
            TermStatus.PENDING_VERIFICATION,
            TermStatus.CROWD_VERIFIED,
        ]:
            raise ValueError(
                "Cannot linguist-verify an application not in pending or crowd-verified status."
            )
        if application.status == TermStatus.ADMIN_APPROVED:
            raise ValueError("Cannot modify an already admin-approved application.")

        application.status = new_status
        application.reviewed_at = datetime.utcnow()
        if review:
            application.review = review

        if is_linguist_verification:
            application.linguist_verified_by_user_id = reviewer_id
        elif is_admin_approval:
            application.admin_approved_by_user_id = reviewer_id

        db.add(application)
        await db.commit()
        await db.refresh(application)

        term_to_update = await crud_term.get_term_by_id(db, term_id=application.term_id)
        if term_to_update:
            if new_status == TermStatus.ADMIN_APPROVED:
                update_fields = TermCreate.model_validate(
                    application.proposed_content
                ).model_dump(
                    exclude={"id", "upvotes", "downvotes", "comments"},
                    exclude_unset=True,
                )
                if "related_terms" in update_fields:
                    update_fields["related_terms_ids"] = update_fields.pop(
                        "related_terms"
                    )

                await crud_term.update_term(
                    db, db_obj=term_to_update, obj_in=update_fields
                )
                term_to_update.status = TermStatus.ADMIN_APPROVED
                db.add(term_to_update)
                await db.commit()
            elif (
                new_status == TermStatus.REJECTED
                and application.is_edit_for_term_id is None
            ):
                await crud_term.delete(db, term_id=term_to_update.id)

            elif application.is_edit_for_term_id is None:
                term_to_update.status = new_status
                db.add(term_to_update)
                await db.commit()
                await db.refresh(term_to_update)

        return application

    async def get_my_submitted_applications(
        self, db: AsyncSession, user_id: UUID
    ) -> List[TermApplication]:
        result = await db.execute(
            select(TermApplication)
            .filter(TermApplication.submitted_by_user_id == user_id)
            .options(
                selectinload(TermApplication.submitted_by_user),
                selectinload(TermApplication.linguist_verifier),
                selectinload(TermApplication.admin_approver),
                selectinload(TermApplication.term),
            )
            .order_by(TermApplication.submitted_at.desc())
        )
        return result.scalars().unique().all()

    async def get_rejected_applications_for_term(
        self, db: AsyncSession, *, term_id: UUID
    ) -> List[TermApplication]:
        result = await db.execute(
            select(TermApplication)
            .filter(
                TermApplication.term_id == term_id,
                TermApplication.status == TermStatus.REJECTED,
                TermApplication.review.is_not(None),
            )
            .options(
                selectinload(TermApplication.submitted_by_user),
                selectinload(TermApplication.linguist_verifier),
                selectinload(TermApplication.admin_approver),
                selectinload(TermApplication.term),
            )
            .order_by(TermApplication.reviewed_at.desc())
        )
        return result.scalars().all()

    async def get_application_vote_count(
        self, db: AsyncSession, application_id: UUID
    ) -> int:
        result = await db.execute(
            select(func.count()).filter(
                TermApplicationVote.application_id == application_id
            )
        )
        return result.scalar() or 0

    async def link_translation(
        self,
        db: AsyncSession,
        application_id: uuid.UUID,
        translation_term_id: uuid.UUID,
    ):
        application = await self.get_application_by_id(db, application_id)
        if not application:
            raise ValueError(f"Application {application_id} not found.")

        main_term_id = application.term_id

        stmt = (
            insert(term_translations)
            .values(term_id=main_term_id, translation_id=translation_term_id)
            .on_conflict_do_nothing()
        )

        await db.execute(stmt)
        await db.commit()

    async def delete_application_and_term(
        self,
        db: AsyncSession,
        *,
        application_id: UUID,
    ) -> bool:
        """
        Deletes a term application and the corresponding term record if it's a
        new term submission. Returns True if deletion was successful, False otherwise.
        """
        application = await self.get_application_by_id(db, application_id)
        if not application:
            return False

        # If it's a new term submission, delete the associated term record
        if application.is_edit_for_term_id is None and application.term_id:
            await crud_term.delete(db, term_id=application.term_id)

        # Now, delete the application record itself
        await db.delete(application)
        await db.commit()

        return True


crud_term_application = CRUDTermApplication()
