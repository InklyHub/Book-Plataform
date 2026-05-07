from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUser, DB
from app.models.book import Book, UserLibrary
from app.schemas.book import LibraryAddIn, LibraryItemOut, LibraryUpdateIn

router = APIRouter()


@router.get("", response_model=list[LibraryItemOut])
async def get_library(current_user: CurrentUser, db: DB, lib_status: str | None = None):
    query = (
        select(UserLibrary)
        .where(UserLibrary.user_id == current_user.id)
        .options(
            selectinload(UserLibrary.book).options(
                selectinload(Book.author),
                selectinload(Book.tags),
            )
        )
        .order_by(UserLibrary.added_at.desc())
    )
    if lib_status:
        query = query.where(UserLibrary.status == lib_status)

    result = await db.execute(query)
    items = result.scalars().all()

    return [
        LibraryItemOut(
            book={
                **item.book.__dict__,
                "tags": [t.tag for t in item.book.tags],
            },
            status=item.status,
            added_at=item.added_at,
        )
        for item in items
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_to_library(body: LibraryAddIn, current_user: CurrentUser, db: DB):
    book = await db.get(Book, body.book_id)
    if not book or book.status != "published":
        raise HTTPException(status_code=404, detail="Libro no encontrado")

    existing = await db.execute(
        select(UserLibrary).where(
            UserLibrary.user_id == current_user.id, UserLibrary.book_id == body.book_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Libro ya está en tu biblioteca")

    db.add(UserLibrary(user_id=current_user.id, book_id=body.book_id, status=body.status))
    return {"message": "Libro añadido a la biblioteca"}


@router.patch("/{book_id}")
async def update_library_status(book_id: UUID, body: LibraryUpdateIn, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(UserLibrary).where(
            UserLibrary.user_id == current_user.id, UserLibrary.book_id == book_id
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Libro no está en tu biblioteca")

    entry.status = body.status
    return {"message": "Estado actualizado", "status": body.status}


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_library(book_id: UUID, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(UserLibrary).where(
            UserLibrary.user_id == current_user.id, UserLibrary.book_id == book_id
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Libro no está en tu biblioteca")
    await db.delete(entry)
