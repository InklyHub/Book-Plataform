"""
Lógica de negocio para lectores: estadísticas, racha de lectura y logros.
"""
from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.achievement import Achievement, UserAchievement
from app.models.chapter import ReadingProgress
from app.models.user import User, UserReadingStats


class ReaderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_reading_session(self, user: User, reading_minutes: int) -> UserReadingStats:
        """Actualiza estadísticas y calcula racha de lectura."""
        stats = user.reading_stats
        if not stats:
            stats = UserReadingStats(user_id=user.id)
            self.db.add(stats)

        today = date.today()
        stats.reading_time_min += reading_minutes

        if stats.last_read_date:
            last_date = stats.last_read_date.date() if isinstance(stats.last_read_date, datetime) else stats.last_read_date
            delta = (today - last_date).days
            if delta == 1:
                stats.reading_streak += 1
            elif delta > 1:
                stats.reading_streak = 1
            # delta == 0: mismo día, no cambiar racha
        else:
            stats.reading_streak = 1

        stats.last_read_date = datetime.now(timezone.utc)
        await self.db.flush()
        await self._check_achievements(user, stats)
        return stats

    async def mark_book_completed(self, user: User) -> None:
        stats = user.reading_stats
        if stats:
            stats.books_read += 1
            await self.db.flush()
            await self._check_achievements(user, stats)

    async def _check_achievements(self, user: User, stats: UserReadingStats) -> None:
        """Evalúa y otorga logros según las condiciones definidas en JSONB."""
        all_achievements = (await self.db.execute(select(Achievement))).scalars().all()
        earned_ids = {
            ua.achievement_id
            for ua in (
                await self.db.execute(
                    select(UserAchievement).where(UserAchievement.user_id == user.id)
                )
            ).scalars().all()
        }

        for achievement in all_achievements:
            if achievement.id in earned_ids:
                continue

            condition = achievement.condition
            cond_type = condition.get("type")
            threshold = condition.get("threshold", 0)

            earned = False
            if cond_type == "books_read" and stats.books_read >= threshold:
                earned = True
            elif cond_type == "reading_streak" and stats.reading_streak >= threshold:
                earned = True
            elif cond_type == "reading_time_hours" and stats.reading_time_min >= threshold * 60:
                earned = True

            if earned:
                self.db.add(UserAchievement(user_id=user.id, achievement_id=achievement.id))

        await self.db.flush()

    async def get_reading_progress_summary(self, user_id: UUID) -> dict:
        """Resumen del progreso de lectura del usuario."""
        completed = await self.db.execute(
            select(func.count(ReadingProgress.chapter_id))
            .where(ReadingProgress.user_id == user_id, ReadingProgress.completed == True)
        )
        in_progress = await self.db.execute(
            select(func.count(ReadingProgress.chapter_id))
            .where(ReadingProgress.user_id == user_id, ReadingProgress.completed == False)
        )
        return {
            "chapters_completed": completed.scalar_one(),
            "chapters_in_progress": in_progress.scalar_one(),
        }
