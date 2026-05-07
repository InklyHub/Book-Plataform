from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import CurrentUser, CurrentWriter, DB
from app.models.book import Book
from app.models.quiz import Quiz, QuizOption, QuizQuestion, QuizResult
from app.schemas.quiz import (
    QuizCreate,
    QuizListOut,
    QuizOut,
    QuizResultOut,
    QuizSubmitIn,
)

router = APIRouter()


@router.get("/book/{book_id}", response_model=list[QuizListOut])
async def list_quizzes(book_id: UUID, db: DB):
    result = await db.execute(
        select(Quiz)
        .where(Quiz.book_id == book_id)
        .options(selectinload(Quiz.questions))
        .order_by(Quiz.created_at)
    )
    quizzes = result.scalars().all()
    return [
        QuizListOut(
            **{**q.__dict__, "question_count": len(q.questions)}
        )
        for q in quizzes
    ]


@router.get("/{quiz_id}", response_model=QuizOut)
async def get_quiz(quiz_id: UUID, db: DB):
    result = await db.execute(
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(
            selectinload(Quiz.questions).options(
                selectinload(QuizQuestion.options)
            )
        )
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz no encontrado")
    return quiz


@router.post("/book/{book_id}", response_model=QuizOut, status_code=status.HTTP_201_CREATED)
async def create_quiz(book_id: UUID, body: QuizCreate, current_user: CurrentWriter, db: DB):
    book = await db.get(Book, book_id)
    if not book or book.author_id != current_user.id:
        raise HTTPException(status_code=404, detail="Libro no encontrado o sin permiso")

    quiz = Quiz(
        book_id=book_id,
        chapter_id=body.chapter_id,
        title=body.title,
        description=body.description,
    )
    db.add(quiz)
    await db.flush()

    for q_data in body.questions:
        question = QuizQuestion(
            quiz_id=quiz.id,
            question=q_data.question,
            order_index=q_data.order_index,
        )
        db.add(question)
        await db.flush()

        for opt in q_data.options:
            db.add(QuizOption(
                question_id=question.id,
                text=opt.text,
                is_correct=opt.is_correct,
            ))

    await db.flush()

    result = await db.execute(
        select(Quiz)
        .where(Quiz.id == quiz.id)
        .options(
            selectinload(Quiz.questions).options(selectinload(QuizQuestion.options))
        )
    )
    return result.scalar_one()


@router.post("/{quiz_id}/submit", response_model=QuizResultOut)
async def submit_quiz(quiz_id: UUID, body: QuizSubmitIn, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(
            selectinload(Quiz.questions).options(selectinload(QuizQuestion.options))
        )
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz no encontrado")

    # Construir mapa de respuestas correctas
    correct_map: dict[UUID, UUID] = {}
    for question in quiz.questions:
        for option in question.options:
            if option.is_correct:
                correct_map[question.id] = option.id
                break

    correct_count = sum(
        1 for answer in body.answers
        if correct_map.get(answer.question_id) == answer.option_id
    )
    total = len(quiz.questions)
    score = round((correct_count / total) * 100) if total else 0

    quiz_result = QuizResult(
        user_id=current_user.id,
        quiz_id=quiz_id,
        score=score,
    )
    db.add(quiz_result)
    await db.flush()
    await db.refresh(quiz_result)

    return QuizResultOut(
        id=quiz_result.id,
        quiz_id=quiz_result.quiz_id,
        score=score,
        correct_count=correct_count,
        total_questions=total,
        completed_at=quiz_result.completed_at,
    )


@router.get("/me/results")
async def get_my_results(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(QuizResult)
        .where(QuizResult.user_id == current_user.id)
        .options(selectinload(QuizResult.quiz))
        .order_by(QuizResult.completed_at.desc())
        .limit(50)
    )
    return result.scalars().all()
