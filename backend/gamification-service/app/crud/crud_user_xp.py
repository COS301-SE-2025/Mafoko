import uuid
from typing import List, Dict
from datetime import date, timedelta, datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from mavito_common.models.user_xp import UserXP, XPSource
from mavito_common.schemas.user_xp import UserXPCreate


class CRUDUserXP:
    async def create_xp_record(
        self, db: AsyncSession, *, obj_in: UserXPCreate
    ) -> UserXP:
        """Create a new XP record for a user."""
        db_obj = UserXP(
            user_id=obj_in.user_id,
            xp_amount=obj_in.xp_amount,
            xp_source=obj_in.xp_source,
            source_reference_id=obj_in.source_reference_id,
            description=obj_in.description,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_user_xp_records(
        self, db: AsyncSession, *, user_id: uuid.UUID
    ) -> List[UserXP]:
        """Get all XP records for a user, ordered by creation date (newest first)."""
        stmt = (
            select(UserXP)
            .where(UserXP.user_id == user_id)
            .order_by(desc(UserXP.created_at))
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_user_login_streak(
        self, db: AsyncSession, *, user_id: uuid.UUID
    ) -> dict:
        """Calculate user's current login streak from LOGIN_STREAK XP records."""
        stmt = (
            select(func.date(UserXP.created_at).label("login_date"))
            .where(UserXP.user_id == user_id, UserXP.xp_source == XPSource.LOGIN_STREAK)
            .distinct()
            .order_by(desc(func.date(UserXP.created_at)))
        )
        result = await db.execute(stmt)
        login_dates = [row[0] for row in result.fetchall()]

        if not login_dates:
            return {"current_streak": 0, "longest_streak": 0, "last_login_date": None}

        current_streak = 0
        today = date.today()
        expected_date = today

        for login_date in login_dates:
            if login_date == expected_date:
                current_streak += 1
                expected_date -= timedelta(days=1)
            else:
                break

        longest_streak = 0
        temp_streak = 1

        for i in range(1, len(login_dates)):
            if login_dates[i - 1] - login_dates[i] == timedelta(days=1):
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
        longest_streak = max(longest_streak, temp_streak)

        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "last_login_date": login_dates[0] if login_dates else None,
        }

    async def get_user_daily_xp(
        self, db: AsyncSession, *, user_id: uuid.UUID, days: int = 365
    ) -> List[Dict]:
        """Get daily XP totals for a user over the last 365 days."""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        stmt = (
            select(
                func.date(UserXP.created_at).label("date"),
                func.sum(UserXP.xp_amount).label("total_xp"),
            )
            .where(UserXP.user_id == user_id, UserXP.created_at >= start_date)
            .group_by(func.date(UserXP.created_at))
            .order_by(func.date(UserXP.created_at))
        )

        result = await db.execute(stmt)
        daily_data = [{"date": row[0], "xp": int(row[1])} for row in result.fetchall()]

        data_dict = {item["date"]: item["xp"] for item in daily_data}
        complete_data = []

        current_date = start_date.date()
        end_date = datetime.now(timezone.utc).date()

        while current_date <= end_date:
            complete_data.append(
                {"date": current_date.isoformat(), "xp": data_dict.get(current_date, 0)}
            )
            current_date += timedelta(days=1)

        return complete_data


crud_user_xp = CRUDUserXP()
