# Inkly — Book Platform

Plataforma de lectura y escritura de libros con sistema de monetización, quizzes y logros.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular 19 + Tailwind CSS 3 |
| Backend | FastAPI + Python 3.12 |
| Base de datos | PostgreSQL 16 |
| Almacenamiento | MinIO (S3-compatible) |
| ORM | SQLAlchemy 2 (async) |
| Migraciones | Alembic |

## Estructura del proyecto

```
book-platform/
├── backend/          # API REST con FastAPI
│   ├── app/
│   │   ├── core/     # Config, DB, seguridad
│   │   ├── models/   # Modelos SQLAlchemy
│   │   ├── routers/  # Endpoints
│   │   ├── schemas/  # Schemas Pydantic
│   │   └── services/ # Lógica de negocio
│   └── alembic/      # Migraciones
├── frontend/         # SPA Angular
│   └── src/app/
│       ├── core/     # Guards, interceptors, servicios
│       ├── features/ # Páginas (auth, reader, writer)
│       └── shared/   # Componentes reutilizables
├── docker-compose.yml      # Producción
└── docker-compose.dev.yml  # Desarrollo local
```

## Desarrollo local

### Requisitos
- Python 3.12+
- Node.js 20+
- Docker Desktop

### 1. Levantar infraestructura

```bash
docker compose -f docker-compose.dev.yml up -d
```

Esto arranca PostgreSQL en el puerto `5432` y MinIO en el `9000`.

### 2. Backend

```bash
cd backend
python3 -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Linux/Mac

pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

API disponible en `http://localhost:8000`
Documentación interactiva en `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm install -D tailwindcss@3 autoprefixer
npm start
```

Aplicación disponible en `http://localhost:4200`

## Producción

Crea un fichero `.env` en la raíz con las variables de entorno:

```env
DB_PASSWORD=contraseña_segura
SECRET_KEY=clave_secreta_larga
MINIO_USER=admin
MINIO_PASSWORD=contraseña_minio
ALLOWED_ORIGINS=https://tudominio.com
```

Lanza todo el stack con:

```bash
docker compose up -d --build
```

## Esquema de base de datos

```mermaid
erDiagram
    users {
        uuid id PK
        string email
        string username
        string password_hash
        string role
        int coins
        string avatar_url
        string bio
        bool is_active
        datetime created_at
    }
    user_preferred_genres {
        uuid user_id PK,FK
        string genre PK
    }
    user_reading_stats {
        uuid user_id PK,FK
        int books_read
        int reading_time_min
        int reading_streak
        int followers
        datetime last_read_date
    }
    user_follows {
        uuid follower_id PK,FK
        uuid following_id PK,FK
    }
    books {
        uuid id PK
        uuid author_id FK
        string title
        string genre
        string category
        string status
        bool is_monetized
        float rating_avg
        int views_count
        datetime created_at
    }
    book_tags {
        uuid book_id PK,FK
        string tag PK
    }
    book_ratings {
        uuid user_id PK,FK
        uuid book_id PK,FK
        int score
    }
    user_library {
        uuid user_id PK,FK
        uuid book_id PK,FK
        string status
        datetime added_at
    }
    chapters {
        uuid id PK
        uuid book_id FK
        int chapter_number
        string title
        text content
        bool is_locked
        int price_coins
        int views_count
        int likes_count
    }
    reading_progress {
        uuid user_id PK,FK
        uuid chapter_id PK,FK
        int scroll_percent
        bool completed
        datetime last_read_at
    }
    chapter_likes {
        uuid user_id PK,FK
        uuid chapter_id PK,FK
    }
    comments {
        uuid id PK
        uuid chapter_id FK
        uuid user_id FK
        text text
        datetime created_at
    }
    monetization_settings {
        uuid book_id PK,FK
        string model
        float price_per_chapter
        int coins_per_chapter
        int platform_cut_pct
    }
    coin_packages {
        uuid id PK
        int coins
        float price
        int bonus
        bool is_active
    }
    coin_transactions {
        uuid id PK
        uuid user_id FK
        int amount
        string type
        datetime created_at
    }
    chapter_purchases {
        uuid user_id PK,FK
        uuid chapter_id PK,FK
        int coins_spent
        datetime purchased_at
    }
    subscriptions {
        uuid id PK
        string name
        float price_monthly
        int coins_per_month
    }
    user_subscriptions {
        uuid id PK
        uuid user_id FK
        uuid subscription_id FK
        datetime expires_at
        bool is_active
    }
    quizzes {
        uuid id PK
        uuid book_id FK
        uuid chapter_id FK
        string title
    }
    quiz_questions {
        uuid id PK
        uuid quiz_id FK
        text question
        int order_index
    }
    quiz_options {
        uuid id PK
        uuid question_id FK
        text text
        bool is_correct
    }
    quiz_results {
        uuid id PK
        uuid user_id FK
        uuid quiz_id FK
        int score
        datetime completed_at
    }
    achievements {
        uuid id PK
        string title
        string description
        jsonb condition
    }
    user_achievements {
        uuid user_id PK,FK
        uuid achievement_id PK,FK
        datetime earned_at
    }

    users ||--o{ user_preferred_genres : "tiene"
    users ||--o| user_reading_stats : "tiene"
    users ||--o{ user_follows : "sigue"
    users ||--o{ books : "escribe"
    users ||--o{ book_ratings : "valora"
    users ||--o{ user_library : "guarda"
    users ||--o{ reading_progress : "progresa"
    users ||--o{ chapter_likes : "da like"
    users ||--o{ comments : "comenta"
    users ||--o{ coin_transactions : "tiene"
    users ||--o{ chapter_purchases : "compra"
    users ||--o{ user_subscriptions : "suscribe"
    users ||--o{ user_achievements : "gana"
    books ||--o{ book_tags : "tiene"
    books ||--o{ book_ratings : "recibe"
    books ||--o{ user_library : "en"
    books ||--o{ chapters : "contiene"
    books ||--o{ quizzes : "tiene"
    books ||--o| monetization_settings : "configura"
    chapters ||--o{ reading_progress : "tiene"
    chapters ||--o{ chapter_likes : "recibe"
    chapters ||--o{ comments : "tiene"
    chapters ||--o{ chapter_purchases : "vendido"
    chapters ||--o{ quizzes : "tiene"
    quizzes ||--o{ quiz_questions : "contiene"
    quiz_questions ||--o{ quiz_options : "tiene"
    quizzes ||--o{ quiz_results : "genera"
    subscriptions ||--o{ user_subscriptions : "contratada"
    achievements ||--o{ user_achievements : "otorgada"
```

## Funcionalidades

- Registro e inicio de sesión con JWT
- Roles: lector y escritor
- Editor de libros con capítulos
- Sistema de coins y monetización
- Quizzes por libro
- Logros y estadísticas de lectura
- Biblioteca personal
- Comentarios y valoraciones
