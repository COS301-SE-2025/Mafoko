import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, join
from sqlalchemy.orm import selectinload

from mavito_common.models.achievement import Achievement, AchievementType
from mavito_common.models.user_achievement import UserAchievement
from mavito_common.models.user_xp import UserXP, XPSource
from mavito_common.models.term import Term
from mavito_common.models.term_application import TermApplication
from mavito_common.schemas.achievement import AchievementCreate
from mavito_common.schemas.user_achievement import UserAchievementCreate
from app.crud.crud_user_xp import crud_user_xp


class CRUDAchievement:
    async def get_achievement(
        self, db: AsyncSession, *, achievement_id: uuid.UUID
    ) -> Optional[Achievement]:
        """Get achievement by ID."""
        stmt = select(Achievement).where(Achievement.id == achievement_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_achievements(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[Achievement]:
        """Get all achievements."""
        stmt = (
            select(Achievement).where(Achievement.is_active).offset(skip).limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create_achievement(
        self, db: AsyncSession, *, obj_in: AchievementCreate
    ) -> Achievement:
        """Create new achievement."""
        db_obj = Achievement(
            name=obj_in.name,
            description=obj_in.description,
            achievement_type=obj_in.achievement_type,
            target_value=obj_in.target_value,
            is_active=obj_in.is_active,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_user_achievements(
        self, db: AsyncSession, *, user_id: uuid.UUID
    ) -> List[UserAchievement]:
        """Get all achievements earned by a user."""
        stmt = (
            select(UserAchievement)
            .options(selectinload(UserAchievement.achievement))
            .where(UserAchievement.user_id == user_id)
            .order_by(UserAchievement.earned_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def grant_achievement(
        self, db: AsyncSession, *, user_id: uuid.UUID, achievement_id: uuid.UUID
    ) -> UserAchievement:
        """Grant an achievement to a user and award XP for weekly goals."""
        existing_stmt = select(UserAchievement).where(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_id == achievement_id,
        )
        existing_result = await db.execute(existing_stmt)
        if existing_result.scalars().first():
            raise ValueError("User already has this achievement")

        achievement = await self.get_achievement(db=db, achievement_id=achievement_id)

        user_achievement_create = UserAchievementCreate(
            user_id=user_id, achievement_id=achievement_id
        )
        db_obj = UserAchievement(
            user_id=user_achievement_create.user_id,
            achievement_id=user_achievement_create.achievement_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        if achievement and self._is_weekly_goal(achievement):
            await self._award_weekly_goal_xp(
                db=db, user_id=user_id, achievement=achievement
            )

        return db_obj

    async def _award_weekly_goal_xp(
        self, db: AsyncSession, *, user_id: uuid.UUID, achievement: Achievement
    ) -> None:
        """Award XP for completing a weekly goal."""
        xp_bonus = self._extract_xp_reward(achievement)

        from mavito_common.schemas.user_xp import UserXPCreate
        from mavito_common.models.user_xp import XPSource

        clean_name = (
            achievement.name.split(" W")[0]
            if " W" in achievement.name
            else achievement.name
        )

        xp_create = UserXPCreate(
            user_id=user_id,
            xp_amount=xp_bonus,
            xp_source=XPSource.ACHIEVEMENT_BONUS,
            source_reference_id=achievement.id,
            description=f"Weekly goal completed: {clean_name}",
        )

        await crud_user_xp.create_xp_record(db=db, obj_in=xp_create)

        import logging

        logger = logging.getLogger(__name__)
        logger.info(f"Awarded {xp_bonus} XP for completing weekly goal: {clean_name}")

    async def check_and_grant_achievements(
        self, db: AsyncSession, *, user_id: uuid.UUID
    ) -> List[UserAchievement]:
        """Check user progress and grant any newly earned achievements."""
        newly_earned = []

        achievements = await self.get_achievements(db=db)

        user_achievements = await self.get_user_achievements(db=db, user_id=user_id)
        earned_achievement_ids = {ua.achievement_id for ua in user_achievements}

        for achievement in achievements:
            if achievement.id in earned_achievement_ids:
                continue
            if await self._check_achievement_criteria(
                db=db, user_id=user_id, achievement=achievement
            ):
                try:
                    new_achievement = await self.grant_achievement(
                        db=db, user_id=user_id, achievement_id=achievement.id
                    )
                    newly_earned.append(new_achievement)
                except ValueError:
                    continue

        return newly_earned

    async def get_user_achievement_progress(
        self, db: AsyncSession, *, user_id: uuid.UUID
    ) -> List[dict]:
        """Get progress for all achievements for a user."""
        achievements = await self.get_achievements(db=db)
        user_achievements = await self.get_user_achievements(db=db, user_id=user_id)
        earned_achievement_ids = {ua.achievement_id for ua in user_achievements}

        progress_list = []

        for achievement in achievements:
            is_earned = achievement.id in earned_achievement_ids
            current_progress = 0

            if not is_earned:
                current_progress = await self._get_achievement_progress(
                    db=db, user_id=user_id, achievement=achievement
                )

            progress_list.append(
                {
                    "id": str(achievement.id),
                    "name": achievement.name,
                    "description": achievement.description,
                    "achievement_type": achievement.achievement_type,
                    "target_value": achievement.target_value,
                    "current_progress": (
                        current_progress if not is_earned else achievement.target_value
                    ),
                    "is_earned": is_earned,
                    "progress_percentage": (
                        100.0
                        if is_earned
                        else min(
                            100.0, (current_progress / achievement.target_value) * 100.0
                        )
                    ),
                }
            )

        return progress_list

    async def _get_achievement_progress(
        self, db: AsyncSession, *, user_id: uuid.UUID, achievement: Achievement
    ) -> int:
        """Get current progress value for a specific achievement."""
        if achievement.achievement_type == AchievementType.XP_MILESTONE:
            stmt = select(func.sum(UserXP.xp_amount)).where(UserXP.user_id == user_id)
            result = await db.execute(stmt)
            return result.scalar() or 0

        elif achievement.achievement_type == AchievementType.COMMENT_COUNT:
            stmt = select(func.count(UserXP.id)).where(
                UserXP.user_id == user_id, UserXP.xp_source == XPSource.COMMENT
            )
            result = await db.execute(stmt)
            return result.scalar() or 0

        elif achievement.achievement_type == AchievementType.UPVOTE_COUNT:
            stmt = select(func.count(UserXP.id)).where(
                UserXP.user_id == user_id, UserXP.xp_source == XPSource.UPVOTE_RECEIVED
            )
            result = await db.execute(stmt)
            return result.scalar() or 0

        elif achievement.achievement_type == AchievementType.TERM_COUNT:
            if achievement.name == "Multilingual Master":
                stmt = (
                    select(func.count(func.distinct(Term.language)))
                    .select_from(
                        join(
                            UserXP,
                            TermApplication,
                            UserXP.source_reference_id == TermApplication.id,
                        ).join(Term, TermApplication.term_id == Term.id)
                    )
                    .where(
                        UserXP.user_id == user_id,
                        UserXP.xp_source == XPSource.TERM_ADDITION,
                        UserXP.source_reference_id.is_not(None),
                    )
                )
                result = await db.execute(stmt)
                return result.scalar() or 0

            elif achievement.name == "Language Guardian":
                stmt = select(func.count(UserXP.id)).where(
                    UserXP.user_id == user_id,
                    UserXP.description == "Term application approved by admin",
                )
                result = await db.execute(stmt)
                return result.scalar() or 0

            else:
                stmt = select(func.count(UserXP.id)).where(
                    UserXP.user_id == user_id,
                    UserXP.xp_source == XPSource.TERM_ADDITION,
                )
                result = await db.execute(stmt)
                return result.scalar() or 0

        elif achievement.achievement_type == AchievementType.FEEDBACK_COUNT:
            stmt = select(func.count(UserXP.id)).where(
                UserXP.user_id == user_id,
                UserXP.xp_source == XPSource.FEEDBACK_SUBMISSION,
            )
            result = await db.execute(stmt)
            return result.scalar() or 0

        elif achievement.achievement_type == AchievementType.LOGIN_STREAK:
            streak_data = await crud_user_xp.get_user_login_streak(
                db=db, user_id=user_id
            )
            return streak_data["current_streak"]

        return 0

    async def _check_achievement_criteria(
        self, db: AsyncSession, *, user_id: uuid.UUID, achievement: Achievement
    ) -> bool:
        """Check if user meets criteria for a specific achievement."""
        if achievement.achievement_type == AchievementType.XP_MILESTONE:
            stmt = select(func.sum(UserXP.xp_amount)).where(UserXP.user_id == user_id)
            result = await db.execute(stmt)
            total_xp = result.scalar() or 0
            return total_xp >= achievement.target_value

        elif achievement.achievement_type == AchievementType.COMMENT_COUNT:
            stmt = select(func.count(UserXP.id)).where(
                UserXP.user_id == user_id, UserXP.xp_source == XPSource.COMMENT
            )
            result = await db.execute(stmt)
            comment_count = result.scalar() or 0
            return comment_count >= achievement.target_value

        elif achievement.achievement_type == AchievementType.UPVOTE_COUNT:
            stmt = select(func.count(UserXP.id)).where(
                UserXP.user_id == user_id, UserXP.xp_source == XPSource.UPVOTE_RECEIVED
            )
            result = await db.execute(stmt)
            upvote_count = result.scalar() or 0
            return upvote_count >= achievement.target_value

        elif achievement.achievement_type == AchievementType.TERM_COUNT:
            if achievement.name == "Multilingual Master":
                stmt = (
                    select(func.count(func.distinct(Term.language)))
                    .select_from(
                        join(
                            UserXP,
                            TermApplication,
                            UserXP.source_reference_id == TermApplication.id,
                        ).join(Term, TermApplication.term_id == Term.id)
                    )
                    .where(
                        UserXP.user_id == user_id,
                        UserXP.xp_source == XPSource.TERM_ADDITION,
                        UserXP.source_reference_id.is_not(None),
                    )
                )
                result = await db.execute(stmt)
                language_count = result.scalar() or 0
                return language_count >= achievement.target_value

            elif achievement.name == "Language Guardian":
                stmt = select(func.count(UserXP.id)).where(
                    UserXP.user_id == user_id,
                    UserXP.description == "Term application approved by admin",
                )
                result = await db.execute(stmt)
                validated_count = result.scalar() or 0
                return validated_count >= achievement.target_value

            else:
                stmt = select(func.count(UserXP.id)).where(
                    UserXP.user_id == user_id,
                    UserXP.xp_source == XPSource.TERM_ADDITION,
                )
                result = await db.execute(stmt)
                term_count = result.scalar() or 0
                return term_count >= achievement.target_value

        elif achievement.achievement_type == AchievementType.FEEDBACK_COUNT:
            stmt = select(func.count(UserXP.id)).where(
                UserXP.user_id == user_id,
                UserXP.xp_source == XPSource.FEEDBACK_SUBMISSION,
            )
            result = await db.execute(stmt)
            feedback_count = result.scalar() or 0
            return feedback_count >= achievement.target_value

        elif achievement.achievement_type == AchievementType.LOGIN_STREAK:
            streak_data = await crud_user_xp.get_user_login_streak(
                db=db, user_id=user_id
            )
            current_streak = streak_data["current_streak"]
            return current_streak >= achievement.target_value

        return False

    def _is_weekly_goal(self, achievement: Achievement) -> bool:
        """Check if an achievement is a weekly goal based on naming convention."""
        import re

        return bool(re.search(r"\d{4}W\d{2}", achievement.name))

    def _extract_week_info(self, achievement: Achievement) -> tuple:
        """Extract week year and number from achievement name."""
        import re

        week_match = re.search(r"(\d{4})W(\d{2})", achievement.name)
        if week_match:
            week_year = int(week_match.group(1))
            week_number = int(week_match.group(2))
            return week_year, week_number
        return None, None

    def _extract_xp_reward(self, achievement: Achievement) -> int:
        """Extract XP reward from achievement description."""
        import re

        xp_match = re.search(r"\[XP: (\d+)\]", achievement.description)
        return int(xp_match.group(1)) if xp_match else 50

    def _clean_description(self, description: str) -> str:
        """Remove XP notation from achievement description."""
        import re

        return re.sub(r"\s*\[XP: \d+\]", "", description)

    async def _get_weekly_achievement_progress(
        self, db: AsyncSession, *, user_id: uuid.UUID, achievement: Achievement
    ) -> int:
        """Get progress for weekly goals by filtering XP records by week."""
        week_year, week_number = self._extract_week_info(achievement)
        if not week_year or not week_number:
            return 0

        from datetime import date, timedelta

        try:
            week_start = date.fromisocalendar(week_year, week_number, 1)
            week_end = week_start + timedelta(days=6)
        except ValueError:
            return 0

        if achievement.achievement_type == AchievementType.COMMENT_COUNT:
            stmt = select(func.count(UserXP.id)).where(
                UserXP.user_id == user_id,
                UserXP.xp_source == XPSource.COMMENT,
                func.date(UserXP.created_at) >= week_start,
                func.date(UserXP.created_at) <= week_end,
            )
        elif achievement.achievement_type == AchievementType.TERM_COUNT:
            stmt = select(func.count(UserXP.id)).where(
                UserXP.user_id == user_id,
                UserXP.xp_source == XPSource.TERM_ADDITION,
                func.date(UserXP.created_at) >= week_start,
                func.date(UserXP.created_at) <= week_end,
            )
        elif achievement.achievement_type == AchievementType.UPVOTE_COUNT:
            stmt = select(func.count(UserXP.id)).where(
                UserXP.user_id == user_id,
                UserXP.xp_source == XPSource.UPVOTE_RECEIVED,
                func.date(UserXP.created_at) >= week_start,
                func.date(UserXP.created_at) <= week_end,
            )
        elif achievement.achievement_type == AchievementType.FEEDBACK_COUNT:
            stmt = select(func.count(UserXP.id)).where(
                UserXP.user_id == user_id,
                UserXP.xp_source == XPSource.FEEDBACK_SUBMISSION,
                func.date(UserXP.created_at) >= week_start,
                func.date(UserXP.created_at) <= week_end,
            )
        elif achievement.achievement_type == AchievementType.LOGIN_STREAK:
            stmt = select(
                func.count(func.distinct(func.date(UserXP.created_at)))
            ).where(
                UserXP.user_id == user_id,
                UserXP.xp_source == XPSource.LOGIN_STREAK,
                func.date(UserXP.created_at) >= week_start,
                func.date(UserXP.created_at) <= week_end,
            )
        else:
            return 0

        result = await db.execute(stmt)
        return result.scalar() or 0

    async def get_user_weekly_goals(
        self, db: AsyncSession, *, user_id: uuid.UUID, week_id: Optional[str] = None
    ) -> list:
        """Get user's weekly goals with progress for a specific week."""
        if not week_id:
            from datetime import date

            today = date.today()
            week_year, week_number, _ = today.isocalendar()
            week_id = f"{week_year}W{week_number:02d}"

        all_achievements = await self.get_achievements(db=db)
        weekly_achievements = [a for a in all_achievements if week_id in a.name]

        user_achievements = await self.get_user_achievements(db=db, user_id=user_id)
        earned_achievement_ids = {ua.achievement_id for ua in user_achievements}

        weekly_goals = []
        for achievement in weekly_achievements:
            is_completed = achievement.id in earned_achievement_ids
            current_progress = 0

            if not is_completed:
                if self._is_weekly_goal(achievement):
                    current_progress = await self._get_weekly_achievement_progress(
                        db=db, user_id=user_id, achievement=achievement
                    )
                else:
                    current_progress = await self._get_achievement_progress(
                        db=db, user_id=user_id, achievement=achievement
                    )

            xp_reward = self._extract_xp_reward(achievement)
            clean_description = self._clean_description(achievement.description)

            weekly_goals.append(
                {
                    "id": str(achievement.id),
                    "name": achievement.name.replace(f" {week_id}", ""),
                    "description": clean_description,
                    "target_value": achievement.target_value,
                    "current_progress": (
                        current_progress
                        if not is_completed
                        else achievement.target_value
                    ),
                    "is_completed": is_completed,
                    "progress_percentage": (
                        100.0
                        if is_completed
                        else min(
                            100.0, (current_progress / achievement.target_value) * 100.0
                        )
                    ),
                    "xp_reward": xp_reward,
                }
            )

        return weekly_goals

    async def check_and_grant_weekly_achievements(
        self, db: AsyncSession, *, user_id: uuid.UUID, week_id: Optional[str] = None
    ) -> List[UserAchievement]:
        """Check and grant weekly achievements for a user."""
        if not week_id:
            from datetime import date

            today = date.today()
            week_year, week_number, _ = today.isocalendar()
            week_id = f"{week_year}W{week_number:02d}"

        all_achievements = await self.get_achievements(db=db)
        weekly_achievements = [a for a in all_achievements if week_id in a.name]

        user_achievements = await self.get_user_achievements(db=db, user_id=user_id)
        earned_achievement_ids = {ua.achievement_id for ua in user_achievements}

        newly_earned = []

        for achievement in weekly_achievements:
            if achievement.id in earned_achievement_ids:
                continue

            if self._is_weekly_goal(achievement):
                current_progress = await self._get_weekly_achievement_progress(
                    db=db, user_id=user_id, achievement=achievement
                )
                criteria_met = current_progress >= achievement.target_value
            else:
                criteria_met = await self._check_achievement_criteria(
                    db=db, user_id=user_id, achievement=achievement
                )

            if criteria_met:
                try:
                    new_achievement = await self.grant_achievement(
                        db=db, user_id=user_id, achievement_id=achievement.id
                    )
                    newly_earned.append(new_achievement)
                except ValueError:
                    continue

        return newly_earned


crud_achievement = CRUDAchievement()
