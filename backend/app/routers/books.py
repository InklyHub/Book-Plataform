import math
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, status
from app.services.storage_service import upload_cover as storage_upload_cover
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUser, CurrentWriter, DB, OptionalUser
from app.models.book import Book, BookRating, BookTag
from app.models.chapter import Chapter
from app.schemas.book import (
    BookCreate,
    BookListOut,
    BookOut,
    BookRateIn,
    BookUpdate,
    PaginatedBooks,
)

router = APIRouter()


@router.get("", response_model=PaginatedBooks)
async def list_books(
    db: DB,
    category: str | None = Query(default=None),
    genre: str | None = Query(default=None),
    q: str | None = Query(default=None),
    status: str | None = Query(default="published"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
):
    query = (
        select(Book)
        .where(Book.status == status)
        .options(selectinload(Book.author), selectinload(Book.tags))
    )
    if category:
        query = query.where(Book.category == category)
    if genre:
        query = query.where(Book.genre == genre)
    if q:
        query = query.where(Book.title.ilike(f"%{q}%"))

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar_one()

    books_result = await db.execute(
        query.order_by(Book.views_count.desc()).offset((page - 1) * size).limit(size)
    )
    books = books_result.scalars().all()

    items = [BookListOut.model_validate(book) for book in books]

    return PaginatedBooks(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total else 0,
    )


@router.get("/{book_id}", response_model=BookOut)
async def get_book(book_id: UUID, db: DB, current_user: OptionalUser):
    result = await db.execute(
        select(Book)
        .where(Book.id == book_id)
        .options(
            selectinload(Book.author),
            selectinload(Book.tags),
            selectinload(Book.chapters),
        )
    )
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado")

    # Incrementar vistas (solo si no es el autor)
    if not current_user or current_user.id != book.author_id:
        book.views_count += 1

    out = BookOut.model_validate(book)
    out.tags = [t.tag for t in book.tags]
    out.chapters_count = len([c for c in book.chapters if c.published_at is not None])
    return out


@router.post("", response_model=BookOut, status_code=status.HTTP_201_CREATED)
async def create_book(body: BookCreate, current_user: CurrentWriter, db: DB):
    book = Book(
        title=body.title,
        description=body.description,
        genre=body.genre,
        category=body.category,
        age_restriction=body.age_restriction,
        author_id=current_user.id,
    )
    db.add(book)
    await db.flush()

    for tag in set(body.tags):
        db.add(BookTag(book_id=book.id, tag=tag))

    await db.refresh(book, attribute_names=['author', 'tags'])
    out = BookOut.model_validate(book)
    out.tags = body.tags
    out.chapters_count = 0
    return out


@router.patch("/{book_id}", response_model=BookOut)
async def update_book(book_id: UUID, body: BookUpdate, current_user: CurrentWriter, db: DB):
    result = await db.execute(
        select(Book)
        .where(Book.id == book_id, Book.author_id == current_user.id)
        .options(selectinload(Book.tags))
    )
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado o sin permiso")

    for field, value in body.model_dump(exclude_none=True).items():
        if field == "tags":
            continue
        setattr(book, field, value)

    if body.tags is not None:
        existing_tags = await db.execute(select(BookTag).where(BookTag.book_id == book.id))
        for tag in existing_tags.scalars().all():
            await db.delete(tag)
        for tag in set(body.tags):
            db.add(BookTag(book_id=book.id, tag=tag))

    await db.flush()
    await db.refresh(book, attribute_names=['author', 'tags'])
    out = BookOut.model_validate(book)
    out.tags = body.tags if body.tags is not None else [t.tag for t in book.tags]
    return out


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: UUID, current_user: CurrentWriter, db: DB):
    result = await db.execute(
        select(Book).where(Book.id == book_id, Book.author_id == current_user.id)
    )
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado o sin permiso")
    await db.delete(book)


@router.post("/{book_id}/cover")
async def upload_book_cover(
    book_id: UUID,
    current_user: CurrentWriter,
    db: DB,
    file: UploadFile = File(...),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")

    result = await db.execute(
        select(Book).where(Book.id == book_id, Book.author_id == current_user.id)
    )
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado o sin permiso")

    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB")

    try:
        url = storage_upload_cover(str(book_id), data, file.content_type)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    book.cover_url = url
    await db.flush()
    return {"cover_url": url}


@router.post("/{book_id}/rate")
async def rate_book(book_id: UUID, body: BookRateIn, current_user: CurrentUser, db: DB):
    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado")

    existing = await db.execute(
        select(BookRating).where(
            BookRating.user_id == current_user.id, BookRating.book_id == book_id
        )
    )
    rating = existing.scalar_one_or_none()

    if rating:
        old_score = rating.score
        rating.score = body.score
        book.rating_avg = (book.rating_avg * book.rating_count - old_score + body.score) / book.rating_count
    else:
        db.add(BookRating(user_id=current_user.id, book_id=book_id, score=body.score))
        total = book.rating_avg * book.rating_count + body.score
        book.rating_count += 1
        book.rating_avg = total / book.rating_count

    return {"rating_avg": round(float(book.rating_avg), 2), "rating_count": book.rating_count}
