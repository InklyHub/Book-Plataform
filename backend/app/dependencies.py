from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User


def user_with_relations():
    return select(User).options(
        selectinload(User.preferred_genres),
        selectinload(User.reading_stats),
    )

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )

    user_id: str = payload.get("sub", "")
    result = await db.execute(user_with_relations().where(User.id == UUID(user_id), User.is_active == True))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")

    return user


async def get_current_writer(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    # rol 1 = escritor, rol 2 = ambos
    if current_user.role not in (1, 2):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido a escritores",
        )
    return current_user


async def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(HTTPBearer(auto_error=False))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        if not payload or payload.get("type") != "access":
            return None
        result = await db.execute(
            user_with_relations().where(User.id == UUID(payload["sub"]), User.is_active == True)
        )
        return result.scalar_one_or_none()
    except Exception:
        return None


# Tipos anotados para inyección rápida
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentWriter = Annotated[User, Depends(get_current_writer)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
DB = Annotated[AsyncSession, Depends(get_db)]
