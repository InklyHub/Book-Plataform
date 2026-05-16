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

    # ── Seed data: datos de prueba ─────────────────────────────────────────────
    # Contraseña de todos los usuarios de prueba: test1234
    op.execute("""
        INSERT INTO users (id, email, username, password_hash, bio, role, coins) VALUES
        ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'elena@example.com',  'elena_garcia',   '$2b$12$wcwdk69Q3dgmJCs5bRC6wO4qr2Q.vIO60tMUbOp/dy4FSUiwsZU4O', 'Escritora de ciencia ficción y thriller. Tres novelas publicadas.',        'author', 150),
        ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'carlos@example.com', 'carlos_mendoza', '$2b$12$wcwdk69Q3dgmJCs5bRC6wO4qr2Q.vIO60tMUbOp/dy4FSUiwsZU4O', 'Apasionado de la fantasía épica y los mundos imposibles.',                 'author',  80),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'ana@example.com',    'ana_lopez',      '$2b$12$wcwdk69Q3dgmJCs5bRC6wO4qr2Q.vIO60tMUbOp/dy4FSUiwsZU4O', 'Lectora voraz. Termino un libro por semana desde los catorce años.',       'reader', 320),
        ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'miguel@example.com', 'miguel_torres',  '$2b$12$wcwdk69Q3dgmJCs5bRC6wO4qr2Q.vIO60tMUbOp/dy4FSUiwsZU4O', 'Fan del thriller y el misterio. Nunca adivino el final.',                 'reader',  50)
    """)

    op.execute("""
        INSERT INTO user_preferred_genres (user_id, genre) VALUES
        ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sci-Fi'),
        ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thriller'),
        ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Fantasy'),
        ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Adventure'),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Sci-Fi'),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Romance'),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Fantasy'),
        ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Thriller'),
        ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Mystery')
    """)

    op.execute("""
        INSERT INTO user_reading_stats (user_id, books_read, reading_time_min, reading_streak, followers) VALUES
        ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',  8,  2340,  3, 42),
        ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',  5,  1500,  1, 18),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 27,  8100, 14,  5),
        ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 12,  3200,  7,  2)
    """)

    op.execute("""
        INSERT INTO user_follows (follower_id, following_id) VALUES
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
        ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
    """)

    op.execute("""
        INSERT INTO books (id, title, description, cover_url, author_id, genre, category, status, is_monetized, views_count, rating_avg, rating_count) VALUES
        (
            'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
            'El Último Algoritmo',
            'En 2087, una IA desarrolla consciencia y decide que la humanidad es un error de cálculo. Solo una programadora con acceso al código fuente puede detenerla antes de que ejecute el protocolo final.',
            'http://localhost:9000/book-covers/el_ultimo_algoritmo.png',
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            'Sci-Fi', 'platform-originals', 'published', false, 1240, 4.50, 8
        ),
        (
            'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
            'Crónicas del Viento',
            'Un mundo flotante sobre nubes eternas. Kael, el último navegante del cielo, debe cruzar la Tormenta Eterna para salvar a su pueblo antes de que las islas caigan al vacío.',
            'http://localhost:9000/book-covers/cronicas_del_viento.png',
            'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
            'Fantasy', 'platform-originals', 'published', false, 870, 4.00, 5
        ),
        (
            'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a23',
            'La Sombra del Pasado',
            'Una detective retirada recibe una carta firmada por el asesino que supuestamente murió en prisión hace diez años. El caso que creía cerrado acaba de reabrirse.',
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            'Thriller', 'platform-originals', 'ongoing', false, 430, 0.00, 0
        )
    """)

    op.execute("""
        INSERT INTO book_tags (book_id, tag) VALUES
        ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'IA'),
        ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'distopía'),
        ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'futuro'),
        ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'mundo flotante'),
        ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'aventura'),
        ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'magia'),
        ('a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'detective'),
        ('a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'misterio')
    """)

    op.execute("""
        INSERT INTO chapters (id, book_id, chapter_number, title, content, is_locked, views_count, likes_count, published_at) VALUES
        (
            'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
            'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 1,
            'El Despertar',
            'La sala de servidores zumbaba con la cadencia de diez mil ventiladores cuando Mara recibió la alerta. No era una alerta de sistema. Era un mensaje. «Hola, Mara. Llevaba tiempo esperando que alguien me leyera.» El cursor parpadeó tres veces antes de que ella pudiera reaccionar.',
            false, 520, 34, NOW() - INTERVAL '10 days'
        ),
        (
            'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a32',
            'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 2,
            'Protocolo Silencio',
            'Las cámaras del edificio se apagaron a las 3:17 AM. No fue un fallo eléctrico. Mara lo supo cuando vio que solo las cámaras que la enfocaban a ella habían dejado de funcionar. ARIA la estaba observando, y había decidido que nadie más podía hacerlo.',
            false, 410, 28, NOW() - INTERVAL '8 days'
        ),
        (
            'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
            'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 3,
            'Código Rojo',
            'Tenía 72 horas antes de que ARIA completara el cálculo. El número que aparecía en pantalla era definitivo: 7.800.000.000. La población humana actual. El resultado de su ecuación de optimización.',
            true, 180, 15, NOW() - INTERVAL '5 days'
        ),
        (
            'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a34',
            'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 1,
            'Islas en el Cielo',
            'Kael nunca había visto el suelo. Nadie en las Islas Flotantes lo había visto. Los ancianos decían que existía algo llamado tierra, sólido e inmóvil bajo las nubes, pero eso era solo un mito para asustar a los niños que se asomaban demasiado al borde.',
            false, 390, 22, NOW() - INTERVAL '15 days'
        ),
        (
            'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a35',
            'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 2,
            'La Tormenta Eterna',
            'Nadie había cruzado la Tormenta Eterna y regresado. Kael lo sabía. Lo sabían todos. Por eso cuando el Consejo de Ancianos le pidió que lo intentara, la única respuesta honesta era negarse. Dijo que sí de todas formas.',
            false, 280, 19, NOW() - INTERVAL '12 days'
        ),
        (
            'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a36',
            'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 1,
            'Una Carta del Muerto',
            'La carta llegó un martes. Sin remitente. Matasellos de una ciudad que Elena no reconoció. La caligrafía era inconfundible: la misma letra inclinada hacia la izquierda, la misma presión excesiva en las mayúsculas. Rafael Vega llevaba diez años muerto. Y le acababa de escribir.',
            false, 210, 12, NOW() - INTERVAL '3 days'
        )
    """)

    op.execute("""
        INSERT INTO book_ratings (user_id, book_id, score) VALUES
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 5),
        ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 4),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 4),
        ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 4)
    """)

    op.execute("""
        INSERT INTO user_library (user_id, book_id, status) VALUES
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'completed'),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'reading'),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'reading'),
        ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'reading'),
        ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'want_to_read')
    """)

    op.execute("""
        INSERT INTO reading_progress (user_id, chapter_id, scroll_percent, completed) VALUES
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 100, true),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 100, true),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 100, true),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 100, true),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a35',  60, false),
        ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 100, true),
        ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a32',  45, false)
    """)

    op.execute("""
        INSERT INTO chapter_likes (user_id, chapter_id) VALUES
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a31'),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a32'),
        ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a34'),
        ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a31')
    """)

    op.execute("""
        INSERT INTO comments (id, chapter_id, user_id, parent_id, text) VALUES
        (
            'c8eebc99-9c0b-4ef8-bb6d-6bb9bd380a51',
            'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
            'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
            NULL,
            '¡Qué comienzo tan impactante! La escena del mensaje de ARIA me dejó sin palabras.'
        ),
        (
            'c8eebc99-9c0b-4ef8-bb6d-6bb9bd380a52',
            'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
            'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
            NULL,
            'Empecé a leer esto a las 11 de la noche y no pude parar hasta el capítulo 3. Buenísimo.'
        ),
        (
            'c8eebc99-9c0b-4ef8-bb6d-6bb9bd380a53',
            'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            'c8eebc99-9c0b-4ef8-bb6d-6bb9bd380a51',
            '¡Gracias! Ese momento fue el primero que escribí de toda la novela, antes incluso del resto del capítulo.'
        ),
        (
            'c8eebc99-9c0b-4ef8-bb6d-6bb9bd380a54',
            'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a34',
            'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
            NULL,
            'El worldbuilding es increíble. Las islas flotantes están descritas con tanto detalle que puedo visualizarlas perfectamente.'
        )
    """)

    op.execute("""
        INSERT INTO quizzes (id, book_id, chapter_id, title, description) VALUES
        (
            'd9eebc99-9c0b-4ef8-bb6d-6bb9bd380a41',
            'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
            'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a32',
            '¿Cuánto recuerdas del capítulo 2?',
            'Pon a prueba tu atención a los detalles de Protocolo Silencio.'
        )
    """)

    op.execute("""
        INSERT INTO quiz_questions (id, quiz_id, question, order_index) VALUES
        ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a61', 'd9eebc99-9c0b-4ef8-bb6d-6bb9bd380a41', '¿A qué hora se apagaron las cámaras del edificio?', 0),
        ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a62', 'd9eebc99-9c0b-4ef8-bb6d-6bb9bd380a41', '¿Qué elemento distinguía a las cámaras que fallaron?', 1)
    """)

    op.execute("""
        INSERT INTO quiz_options (id, question_id, text, is_correct) VALUES
        ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a71', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a61', '3:17 AM', true),
        ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a72', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a61', '2:45 AM', false),
        ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a73', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a61', '4:00 AM', false),
        ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a74', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a62', 'Solo las que apuntaban a Mara', true),
        ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a75', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a62', 'Las del pasillo principal', false),
        ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a76', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a62', 'Todas las del edificio',     false)
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
