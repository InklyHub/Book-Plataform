import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.user import User, UserReadingStats

# Base de datos en memoria para tests (SQLite async)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def reader_user(db: AsyncSession) -> User:
    user = User(
        email="lector@test.com",
        username="lector_test",
        password_hash=hash_password("password123"),
        role="reader",
    )
    db.add(user)
    db.add(UserReadingStats(user_id=user.id))
    await db.flush()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def writer_user(db: AsyncSession) -> User:
    user = User(
        email="escritor@test.com",
        username="escritor_test",
        password_hash=hash_password("password123"),
        role="writer",
    )
    db.add(user)
    db.add(UserReadingStats(user_id=user.id))
    await db.flush()
    await db.refresh(user)
    return user


@pytest.fixture
def reader_token(reader_user: User) -> str:
    return create_access_token(str(reader_user.id), reader_user.role)


@pytest.fixture
def writer_token(writer_user: User) -> str:
    return create_access_token(str(writer_user.id), writer_user.role)


@pytest.fixture
def reader_headers(reader_token: str) -> dict:
    return {"Authorization": f"Bearer {reader_token}"}


@pytest.fixture
def writer_headers(writer_token: str) -> dict:
    return {"Authorization": f"Bearer {writer_token}"}
