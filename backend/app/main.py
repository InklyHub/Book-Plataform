from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, books, chapters, library, comments, quizzes, writer, monetization, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: crear tablas si no existen (solo en desarrollo)
    if settings.ENVIRONMENT == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/api/auth",         tags=["Auth"])
app.include_router(users.router,        prefix="/api/users",        tags=["Users"])
app.include_router(books.router,        prefix="/api/books",        tags=["Books"])
app.include_router(chapters.router,     prefix="/api/chapters",     tags=["Chapters"])
app.include_router(library.router,      prefix="/api/library",      tags=["Library"])
app.include_router(comments.router,     prefix="/api/comments",     tags=["Comments"])
app.include_router(quizzes.router,      prefix="/api/quizzes",      tags=["Quizzes"])
app.include_router(writer.router,       prefix="/api/writer",       tags=["Writer"])
app.include_router(monetization.router, prefix="/api/monetization", tags=["Monetization"])


@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
