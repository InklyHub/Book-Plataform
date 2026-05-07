import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book import Book
from app.models.user import User


async def create_book(client: AsyncClient, headers: dict, **overrides) -> dict:
    payload = {
        "title": "El Libro de Prueba",
        "description": "Una descripción de prueba",
        "genre": "Fantasy",
        "category": "platform-originals",
        "tags": ["magia", "aventura"],
        **overrides,
    }
    response = await client.post("/api/books", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.asyncio
async def test_create_book_as_writer(client: AsyncClient, writer_headers: dict):
    book = await create_book(client, writer_headers)
    assert book["title"] == "El Libro de Prueba"
    assert book["genre"] == "Fantasy"
    assert book["status"] == "draft"
    assert "magia" in book["tags"]


@pytest.mark.asyncio
async def test_create_book_as_reader_forbidden(client: AsyncClient, reader_headers: dict):
    response = await client.post("/api/books", json={
        "title": "No permitido",
        "genre": "Fantasy",
        "category": "platform-originals",
    }, headers=reader_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_book_invalid_genre(client: AsyncClient, writer_headers: dict):
    response = await client.post("/api/books", json={
        "title": "Género inválido",
        "genre": "GeneroInexistente",
        "category": "platform-originals",
    }, headers=writer_headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_books_empty(client: AsyncClient):
    response = await client.get("/api/books")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_list_books_with_filter(client: AsyncClient, writer_headers: dict, db: AsyncSession, writer_user: User):
    # Publicar un libro directamente en DB para que aparezca en la lista
    book = Book(
        title="Libro Publicado",
        genre="Romance",
        category="platform-originals",
        author_id=writer_user.id,
        status="published",
    )
    db.add(book)
    await db.flush()

    response = await client.get("/api/books?genre=Romance")
    assert response.status_code == 200
    data = response.json()
    titles = [b["title"] for b in data["items"]]
    assert "Libro Publicado" in titles


@pytest.mark.asyncio
async def test_get_book_detail(client: AsyncClient, writer_headers: dict, db: AsyncSession, writer_user: User):
    book = Book(
        title="Detalle Test",
        genre="Sci-Fi",
        category="platform-originals",
        author_id=writer_user.id,
        status="published",
    )
    db.add(book)
    await db.flush()

    response = await client.get(f"/api/books/{book.id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Detalle Test"


@pytest.mark.asyncio
async def test_get_book_not_found(client: AsyncClient):
    response = await client.get("/api/books/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_book_as_owner(client: AsyncClient, writer_headers: dict):
    book = await create_book(client, writer_headers, title="Original")
    response = await client.patch(
        f"/api/books/{book['id']}",
        json={"title": "Actualizado", "status": "published"},
        headers=writer_headers,
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Actualizado"


@pytest.mark.asyncio
async def test_delete_book_as_owner(client: AsyncClient, writer_headers: dict):
    book = await create_book(client, writer_headers)
    response = await client.delete(f"/api/books/{book['id']}", headers=writer_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_rate_book(client: AsyncClient, reader_headers: dict, db: AsyncSession, writer_user: User):
    book = Book(
        title="Libro Rateable",
        genre="Drama",
        category="platform-originals",
        author_id=writer_user.id,
        status="published",
    )
    db.add(book)
    await db.flush()

    response = await client.post(
        f"/api/books/{book.id}/rate",
        json={"score": 4},
        headers=reader_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["rating_avg"] == 4.0
    assert data["rating_count"] == 1
