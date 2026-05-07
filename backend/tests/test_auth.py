import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    response = await client.post("/api/auth/register", json={
        "email": "nuevo@test.com",
        "username": "nuevo_user",
        "password": "password123",
        "role": "reader",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@test.com", "username": "dup1", "password": "password123"}
    await client.post("/api/auth/register", json=payload)

    response = await client.post("/api/auth/register", json={**payload, "username": "dup2"})
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "user1@test.com", "username": "mismo_user", "password": "password123"
    })
    response = await client.post("/api/auth/register", json={
        "email": "user2@test.com", "username": "mismo_user", "password": "password123"
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "login@test.com", "username": "login_user", "password": "secret123"
    })
    response = await client.post("/api/auth/login", json={
        "email": "login@test.com", "password": "secret123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "wrong@test.com", "username": "wrong_user", "password": "correct123"
    })
    response = await client.post("/api/auth/login", json={
        "email": "wrong@test.com", "password": "incorrect"
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    response = await client.post("/api/auth/login", json={
        "email": "noexiste@test.com", "password": "cualquier"
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    reg = await client.post("/api/auth/register", json={
        "email": "refresh@test.com", "username": "refresh_user", "password": "password123"
    })
    refresh_token = reg.json()["refresh_token"]

    response = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_refresh_invalid_token(client: AsyncClient):
    response = await client.post("/api/auth/refresh", json={"refresh_token": "token.invalido.xxx"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient, reader_headers: dict):
    response = await client.get("/api/users/me", headers=reader_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "lector@test.com"
    assert data["role"] == "reader"


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient):
    response = await client.get("/api/users/me")
    assert response.status_code == 403
