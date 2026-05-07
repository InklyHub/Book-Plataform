from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ChapterCreate(BaseModel):
    chapter_number: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=300)
    content: str = Field(min_length=1)
    is_locked: bool = False
    price_coins: int | None = Field(default=None, ge=1)


class ChapterUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    content: str | None = None
    is_locked: bool | None = None
    price_coins: int | None = None
    published_at: datetime | None = None


class ChapterOut(BaseModel):
    id: UUID
    book_id: UUID
    chapter_number: int
    title: str
    content: str
    is_locked: bool
    price_coins: int | None
    views_count: int
    likes_count: int
    published_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChapterListOut(BaseModel):
    id: UUID
    book_id: UUID
    chapter_number: int
    title: str
    is_locked: bool
    price_coins: int | None
    views_count: int
    likes_count: int
    published_at: datetime | None

    model_config = {"from_attributes": True}


class ReadingProgressIn(BaseModel):
    scroll_percent: int = Field(ge=0, le=100)
    completed: bool = False


class ReadingProgressOut(BaseModel):
    chapter_id: UUID
    scroll_percent: int
    completed: bool
    last_read_at: datetime

    model_config = {"from_attributes": True}


# ── Comments ──────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    parent_id: UUID | None = None


class CommentAuthorOut(BaseModel):
    id: UUID
    username: str
    avatar_url: str | None

    model_config = {"from_attributes": True}


class CommentOut(BaseModel):
    id: UUID
    chapter_id: UUID
    author: CommentAuthorOut
    parent_id: UUID | None
    text: str
    created_at: datetime
    replies: list["CommentOut"] = []

    model_config = {"from_attributes": True}
