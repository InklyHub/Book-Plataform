from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUser, DB
from app.models.chapter import Chapter
from app.models.comment import Comment
from app.schemas.chapter import CommentCreate, CommentOut

router = APIRouter()


@router.get("/chapter/{chapter_id}", response_model=list[CommentOut])
async def get_comments(
    chapter_id: UUID,
    db: DB,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=50),
):
    result = await db.execute(
        select(Comment)
        .where(Comment.chapter_id == chapter_id, Comment.parent_id.is_(None))
        .options(
            selectinload(Comment.author),
            selectinload(Comment.replies).options(selectinload(Comment.author)),
        )
        .order_by(Comment.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    return result.scalars().all()


@router.post("/chapter/{chapter_id}", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def create_comment(chapter_id: UUID, body: CommentCreate, current_user: CurrentUser, db: DB):
    chapter = await db.get(Chapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado")

    if body.parent_id:
        parent = await db.get(Comment, body.parent_id)
        if not parent or parent.chapter_id != chapter_id:
            raise HTTPException(status_code=400, detail="Comentario padre inválido")

    comment = Comment(
        chapter_id=chapter_id,
        user_id=current_user.id,
        parent_id=body.parent_id,
        text=body.text,
    )
    db.add(comment)
    await db.flush()

    result = await db.execute(
        select(Comment)
        .where(Comment.id == comment.id)
        .options(selectinload(Comment.author), selectinload(Comment.replies))
    )
    return result.scalar_one()


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(comment_id: UUID, current_user: CurrentUser, db: DB):
    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sin permiso para eliminar este comentario")
    await db.delete(comment)
