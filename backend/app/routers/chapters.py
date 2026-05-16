from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUser, CurrentWriter, DB, OptionalUser
from app.models.book import Book
from app.models.chapter import Chapter, ChapterLike, ReadingProgress
from app.models.monetization import ChapterPurchase
from app.schemas.chapter import (
    ChapterCreate,
    ChapterListOut,
    ChapterOut,
    ChapterUpdate,
    ReadingProgressIn,
    ReadingProgressOut,
)

router = APIRouter()


@router.get("/book/{book_id}", response_model=list[ChapterListOut])
async def list_chapters(book_id: UUID, db: DB, current_user: OptionalUser):
    result = await db.execute(
        select(Chapter)
        .where(Chapter.book_id == book_id, Chapter.published_at.isnot(None))
        .order_by(Chapter.chapter_number)
    )
    chapters = result.scalars().all()

    if current_user:
        # Capítulos que este usuario ya compró
        purchases_result = await db.execute(
            select(ChapterPurchase.chapter_id).where(
                ChapterPurchase.user_id == current_user.id,
                ChapterPurchase.chapter_id.in_([c.id for c in chapters]),
            )
        )
        purchased_ids = set(purchases_result.scalars().all())

        # El autor siempre puede leer sus propios capítulos
        book = await db.get(Book, book_id)
        is_author = book and book.author_id == current_user.id

        if purchased_ids or is_author:
            out = []
            for ch in chapters:
                item = ChapterListOut.model_validate(ch)
                if is_author or ch.id in purchased_ids:
                    item.is_locked = False
                out.append(item)
            return out

    return chapters


@router.get("/{chapter_id}", response_model=ChapterOut)
async def get_chapter(chapter_id: UUID, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Chapter).where(Chapter.id == chapter_id)
    )
    chapter = result.scalar_one_or_none()
    if not chapter:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado")

    # Verificar acceso a capítulos bloqueados
    if chapter.is_locked:
        book = await db.get(Book, chapter.book_id)
        is_author = book and book.author_id == current_user.id

        if not is_author:
            purchase = await db.execute(
                select(ChapterPurchase).where(
                    ChapterPurchase.user_id == current_user.id,
                    ChapterPurchase.chapter_id == chapter_id,
                )
            )
            if not purchase.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail=f"Capítulo bloqueado. Costo: {chapter.price_coins} coins",
                )

    # Incrementar vistas
    chapter.views_count += 1
    return chapter


@router.post("/book/{book_id}", response_model=ChapterOut, status_code=status.HTTP_201_CREATED)
async def create_chapter(book_id: UUID, body: ChapterCreate, current_user: CurrentWriter, db: DB):
    book = await db.get(Book, book_id)
    if not book or book.author_id != current_user.id:
        raise HTTPException(status_code=404, detail="Libro no encontrado o sin permiso")

    existing = await db.execute(
        select(Chapter).where(
            Chapter.book_id == book_id, Chapter.chapter_number == body.chapter_number
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Número de capítulo ya existe")

    chapter = Chapter(
        book_id=book_id,
        chapter_number=body.chapter_number,
        title=body.title,
        content=body.content,
        is_locked=body.is_locked,
        price_coins=body.price_coins,
        published_at=datetime.now(timezone.utc),
    )
    db.add(chapter)
    await db.flush()
    await db.refresh(chapter)
    return chapter


@router.patch("/{chapter_id}", response_model=ChapterOut)
async def update_chapter(chapter_id: UUID, body: ChapterUpdate, current_user: CurrentWriter, db: DB):
    result = await db.execute(
        select(Chapter)
        .where(Chapter.id == chapter_id)
        .options(selectinload(Chapter.book))
    )
    chapter = result.scalar_one_or_none()
    if not chapter or chapter.book.author_id != current_user.id:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado o sin permiso")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(chapter, field, value)
    return chapter


@router.delete("/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chapter(chapter_id: UUID, current_user: CurrentWriter, db: DB):
    result = await db.execute(
        select(Chapter)
        .where(Chapter.id == chapter_id)
        .options(selectinload(Chapter.book))
    )
    chapter = result.scalar_one_or_none()
    if not chapter or chapter.book.author_id != current_user.id:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado o sin permiso")
    await db.delete(chapter)


@router.post("/{chapter_id}/like")
async def toggle_like(chapter_id: UUID, current_user: CurrentUser, db: DB):
    chapter = await db.get(Chapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado")

    existing = await db.execute(
        select(ChapterLike).where(
            ChapterLike.user_id == current_user.id, ChapterLike.chapter_id == chapter_id
        )
    )
    like = existing.scalar_one_or_none()

    if like:
        await db.delete(like)
        chapter.likes_count = max(0, chapter.likes_count - 1)
        liked = False
    else:
        db.add(ChapterLike(user_id=current_user.id, chapter_id=chapter_id))
        chapter.likes_count += 1
        liked = True

    return {"liked": liked, "likes_count": chapter.likes_count}


@router.post("/{chapter_id}/progress", response_model=ReadingProgressOut)
async def save_progress(chapter_id: UUID, body: ReadingProgressIn, current_user: CurrentUser, db: DB):
    existing = await db.execute(
        select(ReadingProgress).where(
            ReadingProgress.user_id == current_user.id,
            ReadingProgress.chapter_id == chapter_id,
        )
    )
    progress = existing.scalar_one_or_none()

    if progress:
        progress.scroll_percent = body.scroll_percent
        progress.completed = body.completed
        progress.last_read_at = datetime.now(timezone.utc)
    else:
        progress = ReadingProgress(
            user_id=current_user.id,
            chapter_id=chapter_id,
            scroll_percent=body.scroll_percent,
            completed=body.completed,
        )
        db.add(progress)

    await db.flush()
    return progress
