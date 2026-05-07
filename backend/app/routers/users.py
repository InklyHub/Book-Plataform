from uuid import UUID

from fastapi import APIRouter, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUser, DB
from app.models.user import User, UserPreferredGenre
from app.models.achievement import Achievement, UserAchievement
from app.schemas.user import UserOut, UserPublicOut, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserOut)
async def get_me(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(User)
        .where(User.id == current_user.id)
        .options(
            selectinload(User.preferred_genres),
            selectinload(User.reading_stats),
        )
    )
    user = result.scalar_one()
    # Serializar géneros como lista de strings
    user.preferred_genres = [g.genre for g in user.preferred_genres]  # type: ignore[assignment]
    return user


@router.patch("/me", response_model=UserOut)
async def update_me(body: UserUpdate, current_user: CurrentUser, db: DB):
    if body.username:
        dup = await db.execute(
            select(User).where(User.username == body.username, User.id != current_user.id)
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username ya en uso")
        current_user.username = body.username

    if body.bio is not None:
        current_user.bio = body.bio

    if body.preferred_genres is not None:
        existing = await db.execute(
            select(UserPreferredGenre).where(UserPreferredGenre.user_id == current_user.id)
        )
        for row in existing.scalars().all():
            await db.delete(row)
        for genre in body.preferred_genres:
            db.add(UserPreferredGenre(user_id=current_user.id, genre=genre))

    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserPublicOut)
async def get_user_profile(user_id: UUID, db: DB):
    result = await db.execute(
        select(User)
        .where(User.id == user_id, User.is_active == True)
        .options(selectinload(User.reading_stats))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.get("/me/achievements")
async def get_my_achievements(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(UserAchievement)
        .where(UserAchievement.user_id == current_user.id)
        .options(selectinload(UserAchievement.achievement))
    )
    earned = result.scalars().all()
    earned_ids = {ua.achievement_id for ua in earned}

    all_achievements = await db.execute(select(Achievement))
    return [
        {
            "id": str(a.id),
            "title": a.title,
            "description": a.description,
            "icon": a.icon,
            "earned": a.id in earned_ids,
            "earned_date": next(
                (ua.earned_at for ua in earned if ua.achievement_id == a.id), None
            ),
        }
        for a in all_achievements.scalars().all()
    ]
