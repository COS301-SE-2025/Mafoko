from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
import uuid
from datetime import datetime

from mavito_common.models.feedback import Feedback, FeedbackStatus, FeedbackType
from mavito_common.schemas.feedback import FeedbackCreate, FeedbackUpdate


class CRUDFeedback:
    def __init__(self, model: type[Feedback]):
        self.model = model

    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: FeedbackCreate,
        user_id: Optional[uuid.UUID] = None
    ) -> Feedback:
        """Create new feedback entry."""
        db_obj = self.model(
            type=obj_in.type,
            message=obj_in.message,
            name=obj_in.name,
            email=obj_in.email,
            user_id=user_id,
            status=FeedbackStatus.open,
            created_at=datetime.utcnow(),
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[Feedback]:
        """Get feedback by ID."""
        result = await db.execute(
            select(self.model)
            .options(
                selectinload(self.model.user), selectinload(self.model.resolved_by)
            )
            .where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        status: Optional[FeedbackStatus] = None,
        feedback_type: Optional[FeedbackType] = None,
        user_id: Optional[uuid.UUID] = None
    ) -> List[Feedback]:
        """Get multiple feedback entries with optional filters."""
        query = select(self.model).options(
            selectinload(self.model.user), selectinload(self.model.resolved_by)
        )

        # Apply filters
        filters = []
        if status:
            filters.append(self.model.status == status)
        if feedback_type:
            filters.append(self.model.type == feedback_type)
        if user_id:
            filters.append(self.model.user_id == user_id)

        if filters:
            query = query.where(and_(*filters))

        query = query.order_by(self.model.created_at.desc()).offset(skip).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: Feedback,
        obj_in: FeedbackUpdate,
        admin_user_id: Optional[uuid.UUID] = None
    ) -> Feedback:
        """Update feedback entry (admin only)."""
        update_data = obj_in.model_dump(exclude_unset=True)

        # If status is being changed to resolved, set resolved_at and resolved_by
        if "status" in update_data and update_data["status"] == FeedbackStatus.resolved:
            if (
                db_obj.status != FeedbackStatus.resolved
            ):  # Only set if not already resolved
                update_data["resolved_at"] = datetime.utcnow()
                if admin_user_id:
                    update_data["resolved_by_user_id"] = admin_user_id

        # Update fields
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, *, id: uuid.UUID) -> Optional[Feedback]:
        """Delete feedback entry."""
        db_obj = await self.get(db, id)
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
        return db_obj

    async def get_stats(self, db: AsyncSession) -> Dict[str, Any]:
        """Get feedback statistics for admin dashboard."""
        # Count by status
        status_counts = await db.execute(
            select(
                self.model.status, func.count(self.model.id).label("count")
            ).group_by(self.model.status)
        )

        # Count by type
        type_counts = await db.execute(
            select(self.model.type, func.count(self.model.id).label("count")).group_by(
                self.model.type
            )
        )

        # Total count
        total_result = await db.execute(select(func.count(self.model.id)))
        total_count = total_result.scalar()

        # Recent feedback (last 10)
        recent_result = await db.execute(
            select(self.model)
            .options(
                selectinload(self.model.user), selectinload(self.model.resolved_by)
            )
            .order_by(self.model.created_at.desc())
            .limit(10)
        )
        recent_feedback = list(recent_result.scalars().all())

        # Build stats dict
        stats = {
            "total_feedback": total_count,
            "open_feedback": 0,
            "resolved_feedback": 0,
            "by_status": {},
            "by_type": {},
            "recent_feedback": recent_feedback,
        }

        # Process status counts
        for status, count in status_counts:
            stats["by_status"][status.value] = count
            if status == FeedbackStatus.open:
                stats["open_feedback"] = count
            elif status == FeedbackStatus.resolved:
                stats["resolved_feedback"] = count

        # Process type counts
        for feedback_type, count in type_counts:
            stats["by_type"][feedback_type.value] = count

        return stats

    async def search(
        self, db: AsyncSession, *, query: str, skip: int = 0, limit: int = 50
    ) -> List[Feedback]:
        """Search feedback by message content."""
        search_query = (
            select(self.model)
            .options(
                selectinload(self.model.user), selectinload(self.model.resolved_by)
            )
            .where(
                or_(
                    self.model.message.icontains(query),
                    self.model.admin_response.icontains(query),
                    self.model.name.icontains(query) if query else False,
                    self.model.email.icontains(query) if query else False,
                )
            )
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(search_query)
        return list(result.scalars().all())


# Create instance
crud_feedback = CRUDFeedback(Feedback)
