from uuid import UUID

from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUser, CurrentWriter, DB
from app.models.book import Book
from app.models.chapter import Chapter, ReadingProgress
from app.models.user import User
from app.schemas.book import BookListOut, BookOut

router = APIRouter()


@router.get("/books", response_model=list[BookOut])
async def get_my_books(current_user: CurrentWriter, db: DB):
    result = await db.execute(
        select(Book)
        .where(Book.author_id == current_user.id)
        .options(
            selectinload(Book.author),
            selectinload(Book.tags),
            selectinload(Book.chapters),
        )
        .order_by(Book.updated_at.desc())
    )
    books = result.scalars().all()
    out = []
    for book in books:
        b = BookOut.model_validate(book)
        b.tags = [t.tag for t in book.tags]
        b.chapters_count = len(book.chapters)
        out.append(b)
    return out


@router.get("/analytics/{book_id}")
async def get_book_analytics(book_id: UUID, current_user: CurrentWriter, db: DB):
    book = await db.get(Book, book_id)
    if not book or book.author_id != current_user.id:
        raise HTTPException(status_code=404, detail="Libro no encontrado o sin permiso")

    chapters_result = await db.execute(
        select(Chapter).where(Chapter.book_id == book_id).order_by(Chapter.chapter_number)
    )
    chapters = chapters_result.scalars().all()

    total_views = sum(c.views_count for c in chapters)
    total_likes = sum(c.likes_count for c in chapters)

    # Lectores únicos (por progreso de lectura)
    readers_result = await db.execute(
        select(func.count(func.distinct(ReadingProgress.user_id)))
        .join(Chapter, ReadingProgress.chapter_id == Chapter.id)
        .where(Chapter.book_id == book_id)
    )
    unique_readers = readers_result.scalar_one()

    return {
        "book_id": str(book_id),
        "title": book.title,
        "status": book.status,
        "rating_avg": float(book.rating_avg),
        "rating_count": book.rating_count,
        "total_views": book.views_count,
        "total_chapter_views": total_views,
        "total_likes": total_likes,
        "unique_readers": unique_readers,
        "chapters_count": len(chapters),
        "chapters": [
            {
                "id": str(c.id),
                "number": c.chapter_number,
                "title": c.title,
                "views": c.views_count,
                "likes": c.likes_count,
                "is_locked": c.is_locked,
            }
            for c in chapters
        ],
    }


@router.post("/switch-role")
async def switch_role(current_user: CurrentUser, db: DB):
    """
    Activa el modo escritor para un lector (0→2) o el modo lector para un escritor (1→2).
    """
    from app.schemas.user import ROLE_READER, ROLE_WRITER, ROLE_BOTH
    from app.core.security import create_access_token, create_refresh_token

    if current_user.role == ROLE_READER:
        current_user.role = ROLE_BOTH
        msg = "Modo escritor activado. Ahora eres lector y escritor."
    elif current_user.role == ROLE_WRITER:
        current_user.role = ROLE_BOTH
        msg = "Modo lector activado. Ahora eres escritor y lector."
    else:
        return {"message": "Ya tienes ambos roles activos", "role": current_user.role}

    await db.flush()
    return {
        "message": msg,
        "role": current_user.role,
        "access_token": create_access_token(str(current_user.id), str(current_user.role)),
        "refresh_token": create_refresh_token(str(current_user.id)),
    }


@router.post("/deactivate-role")
async def deactivate_role(current_user: CurrentUser, db: DB, target_role: str):
    """
    Cierra una cuenta parcial:
    - target_role='reader': si el usuario es ambos (2), pasa a escritor (1)
    - target_role='writer': si el usuario es ambos (2), pasa a lector (0)
    """
    from app.schemas.user import ROLE_READER, ROLE_WRITER, ROLE_BOTH
    from app.core.security import create_access_token, create_refresh_token

    if current_user.role != ROLE_BOTH:
        raise HTTPException(
            status_code=400,
            detail="Solo puedes desactivar un rol si tienes ambos activos"
        )

    if target_role == "reader":
        current_user.role = ROLE_WRITER
        msg = "Cuenta de lector desactivada. Ahora solo eres escritor."
    elif target_role == "writer":
        current_user.role = ROLE_READER
        msg = "Cuenta de escritor desactivada. Ahora solo eres lector."
    else:
        raise HTTPException(status_code=400, detail="target_role debe ser 'reader' o 'writer'")

    await db.flush()
    return {
        "message": msg,
        "role": current_user.role,
        "access_token": create_access_token(str(current_user.id), str(current_user.role)),
        "refresh_token": create_refresh_token(str(current_user.id)),
    }
