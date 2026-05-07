"""
Lógica de negocio para libros: búsqueda full-text, recomendaciones y trending.
"""
import math
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.book import Book, BookTag
from app.models.chapter import Chapter


class BookService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def full_text_search(
        self, query: str, page: int = 1, size: int = 20
    ) -> dict:
        """Búsqueda full-text usando índice GIN de PostgreSQL."""
        tsquery = func.plainto_tsquery("english", query)
        tsvector = func.to_tsvector("english", Book.title + " " + func.coalesce(Book.description, ""))

        stmt = (
            select(Book)
            .where(
                Book.status == "published",
                tsvector.op("@@")(tsquery),
            )
            .options(selectinload(Book.author), selectinload(Book.tags))
            .order_by(func.ts_rank(tsvector, tsquery).desc())
        )

        total_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(total_stmt)).scalar_one()

        books = (await self.db.execute(stmt.offset((page - 1) * size).limit(size))).scalars().all()

        return {
            "items": books,
            "total": total,
            "page": page,
            "size": size,
            "pages": math.ceil(total / size) if total else 0,
        }

    async def get_trending(self, limit: int = 10) -> list[Book]:
        """Los libros con más vistas de los últimos 7 días."""
        result = await self.db.execute(
            select(Book)
            .where(Book.status == "published")
            .options(selectinload(Book.author), selectinload(Book.tags))
            .order_by(Book.views_count.desc(), Book.rating_avg.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def get_recommended(self, genres: list[str], limit: int = 10) -> list[Book]:
        """Recomendaciones basadas en géneros preferidos del usuario."""
        if not genres:
            return await self.get_trending(limit)

        result = await self.db.execute(
            select(Book)
            .where(Book.status == "published", Book.genre.in_(genres))
            .options(selectinload(Book.author), selectinload(Book.tags))
            .order_by(Book.rating_avg.desc(), Book.views_count.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_author(self, author_id: UUID, include_drafts: bool = False) -> list[Book]:
        query = select(Book).where(Book.author_id == author_id)
        if not include_drafts:
            query = query.where(Book.status == "published")
        result = await self.db.execute(
            query.options(selectinload(Book.author), selectinload(Book.tags))
            .order_by(Book.created_at.desc())
        )
        return result.scalars().all()

    async def get_next_chapter_number(self, book_id: UUID) -> int:
        result = await self.db.execute(
            select(func.max(Chapter.chapter_number)).where(Chapter.book_id == book_id)
        )
        max_num = result.scalar_one_or_none()
        return (max_num or 0) + 1
