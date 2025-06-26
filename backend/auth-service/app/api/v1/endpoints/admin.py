from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.api import deps
from app.crud.crud_user import crud_user
from mavito_common.models.user import User as UserModel, UserRole
from mavito_common.db.session import get_db
from mavito_common.schemas.user import User as UserSchema
from typing import List
from app.utils.gcs import list_user_uploads, generate_download_url

router = APIRouter()


def require_admin(current_user: UserModel):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    return current_user


@router.put("/users/{user_id}/role", status_code=200)
async def update_user_role(
    user_id: UUID,
    new_role: UserRole,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_active_user),
):
    require_admin(current_user)

    user = await crud_user.get_user_by_uuid(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = await crud_user.update_user(
        db, db_obj=user, obj_in={"role": new_role}
    )
    return {
        "message": f"Role updated to {updated_user.role} for user {updated_user.email}"
    }


@router.get("/users", response_model=List[UserSchema])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(deps.get_current_active_admin),
):
    """
    Admin-only endpoint to fetch all users.
    """
    users = await crud_user.get_all_users(db)
    return [UserSchema.model_validate(user) for user in users]

@router.get("/users/{user_id}/uploads", response_model=List[str])
def get_user_uploads(
    user_id: UUID,
    current_user: UserModel = Depends(deps.get_current_active_admin),
):
    return list_user_uploads(str(user_id))

@router.get("/download-url", response_model=str)
def get_signed_download_url(
    gcs_key: str,
    current_user: UserModel = Depends(deps.get_current_active_admin),
):
    return generate_download_url(gcs_key)
