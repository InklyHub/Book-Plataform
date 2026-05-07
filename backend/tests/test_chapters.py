import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book import Book
from app.models.chapter import Chapter
from app.models.user import User


async def setup_book(db: AsyncSession, author_id) -> Book:
    book = Book(
        title="Libro con Capítulos",
        genre="Fantasy",
        category="platform-originals",
        author_id=author_id,
        status="published",
    )
    db.add(book)
    await db.flush()
    return book


@pytest.mark.asyncio
async def test_create_chapter(client: AsyncClient, writer_headers: dict, db: AsyncSession, writer_user: User):
    book = await setup_book(db, writer_user.id)

    response = await client.post(
        f"/api/chapters/book/{book.id}",
        json={"chapter_number": 1, "title": "Capítulo 1", "content": "Contenido del capítulo uno."},
        headers=writer_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["chapter_number"] == 1
    assert data["is_locked"] is False


@pytest.mark.asyncio
async def test_create_chapter_duplicate_number(client: AsyncClient, writer_headers: dict, db: AsyncSession, writer_user: User):
    book = await setup_book(db, writer_user.id)
    await client.post(
        f"/api/chapters/book/{book.id}",
        json={"chapter_number": 1, "title": "Cap 1", "content": "Texto"},
        headers=writer_headers,
    )
    response = await client.post(
        f"/api/chapters/book/{book.id}",
        json={"chapter_number": 1, "title": "Cap 1 duplicado", "content": "Texto"},
        headers=writer_headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_chapters(client: AsyncClient, db: AsyncSession, writer_user: User, reader_headers: dict):
    book = await setup_book(db, writer_user.id)
    from datetime import datetime, timezone
    chapter = Chapter(
        book_id=book.id, chapter_number=1, title="Cap 1", content="Texto",
        published_at=datetime.now(timezone.utc)
    )
    db.add(chapter)
    await db.flush()

    response = await client.get(f"/api/chapters/book/{book.id}", headers=reader_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_get_chapter_unlocked(client: AsyncClient, db: AsyncSession, writer_user: User, reader_headers: dict):
    book = await setup_book(db, writer_user.id)
    from datetime import datetime, timezone
    chapter = Chapter(
        book_id=book.id, chapter_number=1, title="Cap Libre", content="Contenido libre",
        is_locked=False, published_at=datetime.now(timezone.utc)
    )
    db.add(chapter)
    await db.flush()

    response = await client.get(f"/api/chapters/{chapter.id}", headers=reader_headers)
    assert response.status_code == 200
    assert response.json()["title"] == "Cap Libre"


@pytest.mark.asyncio
async def test_get_chapter_locked_without_purchase(client: AsyncClient, db: AsyncSession, writer_user: User, reader_headers: dict):
    book = await setup_book(db, writer_user.id)
    from datetime import datetime, timezone
    chapter = Chapter(
        book_id=book.id, chapter_number=2, title="Cap Bloqueado", content="Secreto",
        is_locked=True, price_coins=50, published_at=datetime.now(timezone.utc)
    )
    db.add(chapter)
    await db.flush()

    response = await client.get(f"/api/chapters/{chapter.id}", headers=reader_headers)
    assert response.status_code == 402


@pytest.mark.asyncio
async def test_toggle_like_chapter(client: AsyncClient, db: AsyncSession, writer_user: User, reader_headers: dict):
    book = await setup_book(db, writer_user.id)
    from datetime import datetime, timezone
    chapter = Chapter(
        book_id=book.id, chapter_number=1, title="Cap Like", content="Texto",
        published_at=datetime.now(timezone.utc)
    )
    db.add(chapter)
    await db.flush()

    # Like
    response = await client.post(f"/api/chapters/{chapter.id}/like", headers=reader_headers)
    assert response.status_code == 200
    assert response.json()["liked"] is True

    # Unlike
    response = await client.post(f"/api/chapters/{chapter.id}/like", headers=reader_headers)
    assert response.status_code == 200
    assert response.json()["liked"] is False


@pytest.mark.asyncio
async def test_save_reading_progress(client: AsyncClient, db: AsyncSession, writer_user: User, reader_headers: dict):
    book = await setup_book(db, writer_user.id)
    from datetime import datetime, timezone
    chapter = Chapter(
        book_id=book.id, chapter_number=1, title="Cap Progress", content="Texto",
        published_at=datetime.now(timezone.utc)
    )
    db.add(chapter)
    await db.flush()

    response = await client.post(
        f"/api/chapters/{chapter.id}/progress",
        json={"scroll_percent": 75, "completed": False},
        headers=reader_headers,
    )
    assert response.status_code == 200
    assert response.json()["scroll_percent"] == 75
