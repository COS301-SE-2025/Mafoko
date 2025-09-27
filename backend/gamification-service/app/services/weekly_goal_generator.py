import asyncio
import random
import logging
from datetime import date
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_achievement import crud_achievement
from mavito_common.schemas.achievement import AchievementCreate
from mavito_common.models.achievement import AchievementType

logger = logging.getLogger(__name__)

# Per-week locks to prevent race conditions during concurrent requests
_generation_locks = {}


class WeeklyGoalTemplate:
    """Template for generating randomized weekly goals."""

    def __init__(
        self,
        name: str,
        description: str,
        achievement_type: AchievementType,
        min_target: int,
        max_target: int,
        base_xp: int,
        xp_variance: int,
    ):
        self.name = name
        self.description = description
        self.achievement_type = achievement_type
        self.min_target = min_target
        self.max_target = max_target
        self.base_xp = base_xp
        self.xp_variance = xp_variance


WEEKLY_GOAL_TEMPLATES = [
    WeeklyGoalTemplate(
        name="Active Commenter",
        description="Write {target} comments on terms this week",
        achievement_type=AchievementType.COMMENT_COUNT,
        min_target=3,
        max_target=8,
        base_xp=120,
        xp_variance=30,
    ),
    WeeklyGoalTemplate(
        name="Term Creator",
        description="Submit {target} new terms this week",
        achievement_type=AchievementType.TERM_COUNT,
        min_target=2,
        max_target=6,
        base_xp=150,
        xp_variance=40,
    ),
    WeeklyGoalTemplate(
        name="Community Favorite",
        description="Get {target} upvotes on your contributions this week",
        achievement_type=AchievementType.UPVOTE_COUNT,
        min_target=5,
        max_target=15,
        base_xp=110,
        xp_variance=25,
    ),
    WeeklyGoalTemplate(
        name="Consistent User",
        description="Log in on {target} different days this week",
        achievement_type=AchievementType.LOGIN_STREAK,
        min_target=3,
        max_target=7,
        base_xp=130,
        xp_variance=35,
    ),
    WeeklyGoalTemplate(
        name="Streak Keeper",
        description="Maintain a login streak of {target} consecutive days",
        achievement_type=AchievementType.LOGIN_STREAK,
        min_target=2,
        max_target=4,
        base_xp=140,
        xp_variance=30,
    ),
]


def get_current_week_id() -> str:
    """Get the current ISO week identifier (e.g., '2025W03')."""
    today = date.today()
    week_year, week_number, _ = today.isocalendar()
    return f"{week_year}W{week_number:02d}"


async def check_weekly_goals_exist(
    db: AsyncSession, week_id: Optional[str] = None
) -> bool:
    """Check if weekly goals already exist for week."""
    if not week_id:
        week_id = get_current_week_id()

    existing_goals = await crud_achievement.get_achievements(db=db)
    return any(week_id in goal.name for goal in existing_goals)


async def generate_random_weekly_goals(
    db: AsyncSession, num_goals: int = 3, week_id: Optional[str] = None
) -> List[Dict]:
    """Generate random weekly goals for week."""
    if not week_id:
        week_id = get_current_week_id()

    if await check_weekly_goals_exist(db, week_id):
        logger.info(f"Weekly goals already exist for {week_id}")
        return []

    if num_goals > len(WEEKLY_GOAL_TEMPLATES):
        num_goals = len(WEEKLY_GOAL_TEMPLATES)

    selected_templates = random.sample(WEEKLY_GOAL_TEMPLATES, num_goals)
    created_goals = []

    for template in selected_templates:

        target_value = random.randint(template.min_target, template.max_target)

        xp_reward = template.base_xp + random.randint(
            -template.xp_variance, template.xp_variance
        )
        xp_reward = max(100, xp_reward)  # Minimum 100 XP reward

        goal_data = {
            "name": f"{template.name} {week_id}",
            "description": f"{template.description.format(target=target_value)} [XP: {xp_reward}]",
            "achievement_type": template.achievement_type,
            "target_value": target_value,
            "is_active": True,
        }

        try:
            goal_create = AchievementCreate(**goal_data)
            achievement = await crud_achievement.create_achievement(
                db=db, obj_in=goal_create
            )

            created_goals.append(
                {
                    "achievement": achievement,
                    "xp_reward": xp_reward,
                    "week_id": week_id,
                }
            )

            logger.info(
                f"Created weekly goal: {achievement.name} "
                f"(Target: {target_value}, XP: {xp_reward})"
            )

        except Exception as e:
            logger.error(f"Failed to create weekly goal {template.name}: {e}")
            continue

    logger.info(
        f"Successfully generated {len(created_goals)} weekly goals for {week_id}"
    )
    return created_goals


async def ensure_weekly_goals_exist(
    db: AsyncSession, week_id: Optional[str] = None
) -> List:
    """
    Thread-safe lazy generation of weekly goals.

    This function ensures weekly goals exist for the current week,
    generating them if necessary. Uses locks to prevent race conditions
    when multiple users request goals simultaneously.
    """
    if not week_id:
        week_id = get_current_week_id()

    if week_id not in _generation_locks:
        _generation_locks[week_id] = asyncio.Lock()

    async with _generation_locks[week_id]:
        existing_goals = await crud_achievement.get_achievements(db=db)
        current_week_goals = [goal for goal in existing_goals if week_id in goal.name]

        if current_week_goals:
            logger.debug(f"Weekly goals already exist for {week_id}")
            return current_week_goals

        logger.info(f"Generating new weekly goals for {week_id}")
        goal_results = await generate_random_weekly_goals(
            db=db, num_goals=3, week_id=week_id
        )

        cleanup_old_locks(week_id)

        return [goal["achievement"] for goal in goal_results]


def cleanup_old_locks(current_week_id: str) -> None:
    """Remove locks for weeks older than the current week to free memory."""
    try:
        old_locks = [k for k in _generation_locks.keys() if k < current_week_id]
        for old_week in old_locks:
            del _generation_locks[old_week]

        if old_locks:
            logger.debug(f"Cleaned up {len(old_locks)} old week locks")
    except Exception as e:
        logger.warning(f"Failed to cleanup old locks: {e}")


async def get_weekly_goals_for_week(
    db: AsyncSession, week_id: Optional[str] = None
) -> List:
    """Get weekly goals for a specific week without generating new ones."""
    if not week_id:
        week_id = get_current_week_id()

    existing_goals = await crud_achievement.get_achievements(db=db)
    return [goal for goal in existing_goals if week_id in goal.name]
