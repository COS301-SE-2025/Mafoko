import uuid
from typing import List, Optional, Dict, Any  # noqa: F401

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_  # noqa: F401
from sqlalchemy.orm import selectinload

from mavito_common.models.comment import Comment
from mavito_common.models.comment_vote import CommentVote, VoteType  # noqa: F401
from mavito_common.models.user import User as UserModel  # noqa: F401

from mavito_common.schemas.comment import (
    CommentCreate,
    CommentUpdate,
    CommentResponse,
    UserBase,
)
from profanity_check import predict


class CRUDComment:
    async def create_comment(
        self, db: AsyncSession, *, obj_in: CommentCreate, user_id: uuid.UUID
    ) -> Comment:
        if predict([obj_in.content])[0]:
            obj_in.content = "[CONTENT REMOVED DUE TO PROFANITY]"

        db_obj = Comment(
            term_id=obj_in.term_id,
            user_id=user_id,
            content=obj_in.content,
            parent_id=obj_in.parent_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj, attribute_names=["user", "votes"])

        fully_loaded_comment = await self.get_comment(db, comment_id=db_obj.id)
        if fully_loaded_comment:
            return fully_loaded_comment
        else:
            return db_obj

    async def get_comment(
        self, db: AsyncSession, *, comment_id: uuid.UUID
    ) -> Optional[Comment]:
        stmt = (
            select(Comment)
            .where(Comment.id == comment_id, Comment.tombstone.is_(False))
            .options(
                selectinload(Comment.user),
                selectinload(Comment.votes),
                selectinload(Comment.replies).selectinload(Comment.user),
                selectinload(Comment.replies).selectinload(Comment.votes),
                selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.user),
                selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.votes),
                selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.user),
                selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.votes),
            )
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_comments_for_term(
        self,
        db: AsyncSession,
        *,
        term_id: uuid.UUID,
        current_user_id: Optional[uuid.UUID] = None
    ) -> List[CommentResponse]:
        stmt = (
            select(Comment)
            .where(
                Comment.term_id == term_id,
                Comment.parent_id.is_(None),
                Comment.tombstone.is_(False),
            )
            .options(
                selectinload(Comment.user),
                selectinload(Comment.votes),
                selectinload(Comment.replies).selectinload(Comment.user),
                selectinload(Comment.replies).selectinload(Comment.votes),
                selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.user),
                selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.votes),
                selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.user),
                selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.votes),
                selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.user),
                selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.votes),
                selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.user),
                selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.replies)
                .selectinload(Comment.votes),
            )
            .order_by(desc(Comment.date_posted))
        )
        result = await db.execute(stmt)
        top_level_comments = result.scalars().unique().all()

        comment_responses: List[CommentResponse] = []
        for comment in top_level_comments:
            comment_data = await self._build_comment_response(
                db, comment, current_user_id
            )
            comment_responses.append(comment_data)

        return comment_responses

    async def _build_comment_response(
        self, db: AsyncSession, comment: Comment, current_user_id: Optional[uuid.UUID]
    ) -> CommentResponse:

        if comment.user is None:
            user_data = UserBase(
                id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
                first_name="Deleted",
                last_name="User",
                profile_pic_url=None,
            )
        else:
            user_data = UserBase.model_validate(comment.user)

        upvotes = sum(1 for vote in comment.votes if vote.vote == VoteType.upvote)
        downvotes = sum(1 for vote in comment.votes if vote.vote == VoteType.downvote)

        user_vote_status: Optional[str] = None
        if current_user_id:
            for vote in comment.votes:
                if vote.user_id == current_user_id:
                    user_vote_status = vote.vote.value
                    break

        replies_responses: List[CommentResponse] = []

        if comment.replies:
            sorted_replies = sorted(comment.replies, key=lambda r: r.date_posted)
            for reply in sorted_replies:
                if not reply.tombstone:
                    replies_responses.append(
                        await self._build_comment_response(db, reply, current_user_id)
                    )

        return CommentResponse(
            id=comment.id,
            term_id=comment.term_id,
            user_id=comment.user_id,
            content=comment.content,
            created_at=comment.date_posted,
            updated_at=comment.date_posted,
            parent_id=comment.parent_id,
            is_deleted=comment.tombstone,
            user=user_data,
            upvotes=upvotes,
            downvotes=downvotes,
            user_vote=user_vote_status,
            replies=replies_responses,
        )

    async def update_comment(
        self, db: AsyncSession, *, db_obj: Comment, obj_in: CommentUpdate
    ) -> Comment:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        if "content" in update_data and predict([update_data["content"]])[0]:
            update_data["content"] = "[CONTENT REMOVED DUE TO PROFANITY]"

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete_comment(self, db: AsyncSession, *, comment: Comment) -> Comment:
        comment.tombstone = True
        await db.commit()
        await db.refresh(comment)
        return comment


crud_comment = CRUDComment()
