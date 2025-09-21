# gamification-service/app/services/default_achievements.py
from typing import List
from sqlalchemy import select, func

from mavito_common.models.achievement import Achievement, AchievementType
from mavito_common.schemas.achievement import AchievementCreate
from mavito_common.db.session import AsyncSessionLocal
from app.crud.crud_achievement import crud_achievement

# Default achievements to create on startup
DEFAULT_ACHIEVEMENTS = [
    {
        "name": "Term Pioneer",
        "description": "Add your first 10 terms to the dictionary",
        "achievement_type": AchievementType.TERM_COUNT,
        "target_value": 10,
        "is_active": True,
    },
    {
        "name": "Community Contributor",
        "description": "Make 25 comments on terms",
        "achievement_type": AchievementType.COMMENT_COUNT,
        "target_value": 25,
        "is_active": True,
    },
    {
        "name": "Crowd Favorite",
        "description": "Receive 100 upvotes on your contributions",
        "achievement_type": AchievementType.UPVOTE_COUNT,
        "target_value": 100,
        "is_active": True,
    },
    {
        "name": "Multilingual Master",
        "description": "Contribute to 5 different language dictionaries",
        "achievement_type": AchievementType.TERM_COUNT,
        "target_value": 5,
        "is_active": True,
    },
    {
        "name": "Consistency Champion",
        "description": "Be active for 30 consecutive days",
        "achievement_type": AchievementType.LOGIN_STREAK,
        "target_value": 30,
        "is_active": True,
    },
    {
        "name": "Language Guardian",
        "description": "Have 50 of your contributions validated by experts",
        "achievement_type": AchievementType.TERM_COUNT,
        "target_value": 50,
        "is_active": True,
    },
]


async def achievements_table_is_empty() -> bool:
    """Check if the achievements table is empty."""
    async with AsyncSessionLocal() as db:
        stmt = select(func.count(Achievement.id))
        result = await db.execute(stmt)
        count = result.scalar() or 0
        return count == 0


async def create_default_achievements() -> List[Achievement]:
    """Create default achievements in the database."""
    created_achievements = []

    async with AsyncSessionLocal() as db:
        for achievement_data in DEFAULT_ACHIEVEMENTS:
            try:
                achievement_create = AchievementCreate(**achievement_data)
                db_achievement = await crud_achievement.create_achievement(
                    db=db, obj_in=achievement_create
                )
                created_achievements.append(db_achievement)
                print(f"Created default achievement: {db_achievement.name}")
            except Exception as e:
                print(f"Failed to create achievement {achievement_data['name']}: {e}")

    return created_achievements


async def ensure_default_achievements() -> None:
    """Ensure default achievements exist, creating them if the table is empty."""
    try:
        if await achievements_table_is_empty():
            print("Achievements table is empty, creating default achievements...")
            achievements = await create_default_achievements()
            print(f"Created {len(achievements)} default achievements")
        else:
            print("ℹAchievements already exist, skipping default creation")
    except Exception as e:
        print(f"Error ensuring default achievements: {e}")
