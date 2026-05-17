import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text)
    bio: Mapped[str | None] = mapped_column(Text)
    role: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    coins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    preferred_genres: Mapped[list["UserPreferredGenre"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    reading_stats: Mapped["UserReadingStats | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    books: Mapped[list["Book"]] = relationship(back_populates="author")  # type: ignore[name-defined]
    library: Mapped[list["UserLibrary"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # type: ignore[name-defined]
    achievements: Mapped[list["UserAchievement"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # type: ignore[name-defined]
    subscriptions: Mapped[list["UserSubscription"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # type: ignore[name-defined]


class UserPreferredGenre(Base):
    __tablename__ = "user_preferred_genres"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    genre: Mapped[str] = mapped_column(String(50), primary_key=True)

    user: Mapped["User"] = relationship(back_populates="preferred_genres")


class UserReadingStats(Base):
    __tablename__ = "user_reading_stats"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    books_read: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reading_time_min: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reading_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_read_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    followers: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    user: Mapped["User"] = relationship(back_populates="reading_stats")


class UserFollow(Base):
    __tablename__ = "user_follows"

    follower_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    following_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
