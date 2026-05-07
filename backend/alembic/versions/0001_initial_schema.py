"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Extensión para UUIDs
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    # ── users ──────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("password_hash", sa.Text, nullable=False),
        sa.Column("avatar_url", sa.Text),
        sa.Column("bio", sa.Text),
        sa.Column("role", sa.String(20), nullable=False, server_default="reader"),
        sa.Column("coins", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "user_preferred_genres",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("genre", sa.String(50), primary_key=True),
    )

    op.create_table(
        "user_reading_stats",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("books_read", sa.Integer, nullable=False, server_default="0"),
        sa.Column("reading_time_min", sa.Integer, nullable=False, server_default="0"),
        sa.Column("reading_streak", sa.Integer, nullable=False, server_default="0"),
        sa.Column("last_read_date", sa.DateTime(timezone=True)),
        sa.Column("followers", sa.Integer, nullable=False, server_default="0"),
    )

    op.create_table(
        "user_follows",
        sa.Column("follower_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("following_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── books ──────────────────────────────────────────────────────────────────
    op.create_table(
        "books",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("cover_url", sa.Text),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("genre", sa.String(50), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("age_restriction", sa.String(10)),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("is_monetized", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("views_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("rating_avg", sa.Numeric(3, 2), nullable=False, server_default="0"),
        sa.Column("rating_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_books_author_id", "books", ["author_id"])
    op.create_index("ix_books_genre_category", "books", ["genre", "category"])
    op.create_index("ix_books_status", "books", ["status"])
    op.execute(
        "CREATE INDEX ix_books_fts ON books USING GIN "
        "(to_tsvector('english', title || ' ' || COALESCE(description, '')))"
    )

    op.create_table(
        "book_tags",
        sa.Column("book_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag", sa.String(50), primary_key=True),
    )

    op.create_table(
        "book_ratings",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("book_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("score", sa.SmallInteger, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "user_library",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("book_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="reading"),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── chapters ───────────────────────────────────────────────────────────────
    op.create_table(
        "chapters",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("book_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chapter_number", sa.Integer, nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("is_locked", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("price_coins", sa.Integer),
        sa.Column("views_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("likes_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.UniqueConstraint("book_id", "chapter_number", name="uq_chapter_book_number"),
    )
    op.create_index("ix_chapters_book_id", "chapters", ["book_id", "chapter_number"])

    op.create_table(
        "reading_progress",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chapters.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("scroll_percent", sa.SmallInteger, nullable=False, server_default="0"),
        sa.Column("completed", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("last_read_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "chapter_likes",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chapters.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── comments ───────────────────────────────────────────────────────────────
    op.create_table(
        "comments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("comments.id", ondelete="CASCADE")),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_comments_chapter_id", "comments", ["chapter_id", "created_at"])

    # ── quizzes ────────────────────────────────────────────────────────────────
    op.create_table(
        "quizzes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("book_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chapters.id", ondelete="SET NULL")),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "quiz_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("quiz_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question", sa.Text, nullable=False),
        sa.Column("order_index", sa.Integer, nullable=False, server_default="0"),
    )

    op.create_table(
        "quiz_options",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("is_correct", sa.Boolean, nullable=False, server_default="false"),
    )

    op.create_table(
        "quiz_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quiz_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("score", sa.SmallInteger, nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_quiz_results_user_id", "quiz_results", ["user_id"])

    # ── monetization ───────────────────────────────────────────────────────────
    op.create_table(
        "monetization_settings",
        sa.Column("book_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("model", sa.String(30), nullable=False),
        sa.Column("price_per_chapter", sa.Numeric(8, 2)),
        sa.Column("coins_per_chapter", sa.Integer),
        sa.Column("platform_cut_pct", sa.SmallInteger, nullable=False, server_default="30"),
    )

    op.create_table(
        "coin_packages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("coins", sa.Integer, nullable=False),
        sa.Column("price", sa.Numeric(8, 2), nullable=False),
        sa.Column("bonus", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("price_monthly", sa.Numeric(8, 2), nullable=False),
        sa.Column("coins_per_month", sa.Integer, nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
    )

    op.create_table(
        "chapter_purchases",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("chapter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chapters.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("coins_spent", sa.Integer, nullable=False),
        sa.Column("purchased_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "coin_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Integer, nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("reference", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_coin_transactions_user_id", "coin_transactions", ["user_id", "created_at"])

    op.create_table(
        "user_subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subscription_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
    )
    op.create_index("ix_user_subscriptions_user_id", "user_subscriptions", ["user_id"])

    # ── achievements ───────────────────────────────────────────────────────────
    op.create_table(
        "achievements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("icon", sa.String(100), nullable=False),
        sa.Column("condition", postgresql.JSONB, nullable=False),
    )

    op.create_table(
        "user_achievements",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("achievement_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("achievements.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("earned_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # ── Seed data: logros iniciales ───────────────────────────────────────────
    op.execute("""
        INSERT INTO achievements (title, description, icon, condition) VALUES
        ('Primer Libro', 'Completaste tu primer libro', 'BookOpen', '{"type": "books_read", "threshold": 1}'),
        ('Lector Ávido', 'Completaste 5 libros', 'Library', '{"type": "books_read", "threshold": 5}'),
        ('Devorador de Libros', 'Completaste 20 libros', 'Trophy', '{"type": "books_read", "threshold": 20}'),
        ('Racha de 7 días', 'Leíste 7 días consecutivos', 'Flame', '{"type": "reading_streak", "threshold": 7}'),
        ('Racha de 30 días', 'Leíste 30 días consecutivos', 'Star', '{"type": "reading_streak", "threshold": 30}'),
        ('Lector de 10 horas', 'Leíste más de 10 horas en total', 'Clock', '{"type": "reading_time_hours", "threshold": 10}')
    """)

    # Seed data: paquetes de coins
    op.execute("""
        INSERT INTO coin_packages (coins, price, bonus) VALUES
        (100,   0.99,  0),
        (500,   3.99,  50),
        (1200,  7.99,  200),
        (3000, 14.99,  600)
    """)

    # Seed data: planes de suscripción
    op.execute("""
        INSERT INTO subscriptions (name, price_monthly, coins_per_month) VALUES
        ('Básico',   4.99,  300),
        ('Premium',  9.99,  800),
        ('VIP',     19.99, 2000)
    """)


def downgrade() -> None:
    tables = [
        "user_achievements", "achievements",
        "user_subscriptions", "coin_transactions", "chapter_purchases",
        "subscriptions", "coin_packages", "monetization_settings",
        "quiz_results", "quiz_options", "quiz_questions", "quizzes",
        "comments", "chapter_likes", "reading_progress", "chapters",
        "user_library", "book_ratings", "book_tags", "books",
        "user_follows", "user_reading_stats", "user_preferred_genres", "users",
    ]
    for table in tables:
        op.drop_table(table)
