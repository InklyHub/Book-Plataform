from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

VALID_GENRES = {
    "Romance", "Fantasy", "Sci-Fi", "Drama", "Horror",
    "Thriller", "Mystery", "Technical", "Adventure", "Historical",
}
VALID_CATEGORIES = {
    "platform-originals", "translations", "manga", "manhwa",
    "ai-generated", "technical", "nsfw",
}
VALID_STATUSES = {"draft", "published", "completed"}
VALID_LIBRARY_STATUSES = {"reading", "completed", "want_to_read"}


# ── Book ──────────────────────────────────────────────────────────────────────

class BookCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    genre: str
    category: str
    age_restriction: str | None = None
    tags: list[str] = []

    @field_validator("genre")
    @classmethod
    def validate_genre(cls, v: str) -> str:
        if v not in VALID_GENRES:
            raise ValueError(f"genre must be one of {VALID_GENRES}")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of {VALID_CATEGORIES}")
        return v

    @field_validator("age_restriction")
    @classmethod
    def validate_age(cls, v: str | None) -> str | None:
        if v is not None and v != "18+":
            raise ValueError("age_restriction must be '18+' or null")
        return v


class BookUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = None
    cover_url: str | None = None
    genre: str | None = None
    category: str | None = None
    age_restriction: str | None = None
    status: str | None = None
    tags: list[str] | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class AuthorOut(BaseModel):
    id: UUID
    username: str
    avatar_url: str | None

    model_config = {"from_attributes": True}


class BookOut(BaseModel):
    id: UUID
    title: str
    description: str | None
    cover_url: str | None
    author: AuthorOut
    genre: str
    category: str
    age_restriction: str | None
    status: str
    is_monetized: bool
    views_count: int
    rating_avg: float
    rating_count: int
    tags: list[str] = []
    chapters_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("tags", mode="before")
    @classmethod
    def coerce_tags(cls, v: list) -> list[str]:
        if v and not isinstance(v[0], str):
            return [item.tag for item in v]
        return v


class BookListOut(BaseModel):
    id: UUID
    title: str
    cover_url: str | None
    author: AuthorOut
    genre: str
    category: str
    age_restriction: str | None
    status: str
    rating_avg: float
    views_count: int
    tags: list[str] = []

    model_config = {"from_attributes": True}

    @field_validator("tags", mode="before")
    @classmethod
    def coerce_tags(cls, v: list) -> list[str]:
        if v and not isinstance(v[0], str):
            return [item.tag for item in v]
        return v


class BookRateIn(BaseModel):
    score: int = Field(ge=1, le=5)


# ── Library ───────────────────────────────────────────────────────────────────

class LibraryAddIn(BaseModel):
    book_id: UUID
    status: str = "reading"

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_LIBRARY_STATUSES:
            raise ValueError(f"status must be one of {VALID_LIBRARY_STATUSES}")
        return v


class LibraryUpdateIn(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_LIBRARY_STATUSES:
            raise ValueError(f"status must be one of {VALID_LIBRARY_STATUSES}")
        return v


class LibraryItemOut(BaseModel):
    book: BookListOut
    status: str
    added_at: datetime

    model_config = {"from_attributes": True}


# ── Pagination ────────────────────────────────────────────────────────────────

class PaginatedBooks(BaseModel):
    items: list[BookListOut]
    total: int
    page: int
    size: int
    pages: int
