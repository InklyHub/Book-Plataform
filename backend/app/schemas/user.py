from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


VALID_ROLES = {"reader", "writer"}
VALID_GENRES = {
    "Romance", "Fantasy", "Sci-Fi", "Drama", "Horror",
    "Thriller", "Mystery", "Technical", "Adventure", "Historical",
}


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="reader")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in VALID_ROLES:
            raise ValueError(f"role must be one of {VALID_ROLES}")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Profile ───────────────────────────────────────────────────────────────────

class ReadingStatsOut(BaseModel):
    books_read: int
    reading_time_min: int
    reading_streak: int
    followers: int
    last_read_date: datetime | None

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    username: str
    role: str
    avatar_url: str | None
    bio: str | None
    coins: int
    preferred_genres: list[str] = []
    reading_stats: ReadingStatsOut | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPublicOut(BaseModel):
    id: UUID
    username: str
    avatar_url: str | None
    bio: str | None
    role: str
    reading_stats: ReadingStatsOut | None = None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    bio: str | None = None
    preferred_genres: list[str] | None = None

    @field_validator("preferred_genres")
    @classmethod
    def validate_genres(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            invalid = set(v) - VALID_GENRES
            if invalid:
                raise ValueError(f"Invalid genres: {invalid}")
        return v


class OnboardingGenres(BaseModel):
    genres: list[str] = Field(min_length=1)

    @field_validator("genres")
    @classmethod
    def validate_genres(cls, v: list[str]) -> list[str]:
        invalid = set(v) - VALID_GENRES
        if invalid:
            raise ValueError(f"Invalid genres: {invalid}")
        return v
