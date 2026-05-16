from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserPreferredGenre, UserReadingStats
from app.schemas.user import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    OnboardingGenres,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserLogin,
    UserOut,
    UserRegister,
)
from app.dependencies import CurrentUser, DB
from app.services.email_service import send_password_reset_email

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: UserRegister, db: DB):
    from app.schemas.user import ROLE_READER, ROLE_WRITER, ROLE_BOTH

    # Verificar si el email ya existe
    existing_email = await db.execute(select(User).where(User.email == body.email))
    user_by_email = existing_email.scalar_one_or_none()

    if user_by_email:
        # El email ya existe: solo permitir upgrade de rol
        current_role = user_by_email.role
        new_role = body.role
        upgraded = False

        # 0 → 2 (lector quiere ser también escritor)
        if current_role == ROLE_READER and new_role in (ROLE_WRITER, ROLE_BOTH):
            user_by_email.role = ROLE_BOTH
            upgraded = True
        # 1 → 2 (escritor quiere ser también lector)
        elif current_role == ROLE_WRITER and new_role in (ROLE_READER, ROLE_BOTH):
            user_by_email.role = ROLE_BOTH
            upgraded = True
        # Ya es ambos o mismo rol → error
        else:
            raise HTTPException(
                status_code=400,
                detail="El email ya está registrado y no se puede cambiar el rol en este momento"
            )

        if not upgraded:
            raise HTTPException(status_code=400, detail="Email ya en uso")

        await db.flush()
        return TokenResponse(
            access_token=create_access_token(str(user_by_email.id), str(user_by_email.role)),
            refresh_token=create_refresh_token(str(user_by_email.id)),
        )

    # Verificar duplicado de username
    existing_username = await db.execute(select(User).where(User.username == body.username))
    if existing_username.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username ya en uso")

    user = User(
        email=body.email,
        username=body.username,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    await db.flush()  # obtener el id antes de crear stats

    stats = UserReadingStats(user_id=user.id)
    db.add(stats)

    return TokenResponse(
        access_token=create_access_token(str(user.id), str(user.role)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: DB):
    result = await db.execute(select(User).where(User.email == body.email, User.is_active == True))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    return TokenResponse(
        access_token=create_access_token(str(user.id), str(user.role)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: DB):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token inválido")

    result = await db.execute(
        select(User).where(User.id == payload["sub"], User.is_active == True)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return TokenResponse(
        access_token=create_access_token(str(user.id), str(user.role)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(body: ForgotPasswordRequest, db: DB):
    result = await db.execute(
        select(User).where(User.email == body.email, User.is_active == True)
    )
    user = result.scalar_one_or_none()

    if not user:
        return ForgotPasswordResponse(
            message="Si el email está registrado, recibirás un enlace de recuperación."
        )

    reset_token = create_password_reset_token(str(user.id))
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    await send_password_reset_email(to_email=user.email, reset_url=reset_url)

    dev_token = reset_token if settings.ENVIRONMENT == "development" else None

    return ForgotPasswordResponse(
        message="Si el email está registrado, recibirás un enlace de recuperación.",
        reset_token=dev_token,
    )


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: DB):
    payload = decode_token(body.token)
    if not payload or payload.get("type") != "password_reset":
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    result = await db.execute(
        select(User).where(User.id == payload["sub"], User.is_active == True)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    user.password_hash = hash_password(body.new_password)
    return {"message": "Contraseña actualizada correctamente"}


@router.post("/onboarding", response_model=UserOut)
async def save_preferred_genres(body: OnboardingGenres, current_user: CurrentUser, db: DB):
    # Eliminar preferencias anteriores
    existing = await db.execute(
        select(UserPreferredGenre).where(UserPreferredGenre.user_id == current_user.id)
    )
    for row in existing.scalars().all():
        await db.delete(row)

    for genre in body.genres:
        db.add(UserPreferredGenre(user_id=current_user.id, genre=genre))

    await db.flush()
    result = await db.execute(
        select(User)
        .options(selectinload(User.preferred_genres), selectinload(User.reading_stats))
        .where(User.id == current_user.id)
    )
    return result.scalar_one()
