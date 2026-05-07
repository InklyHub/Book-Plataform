from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class QuizOptionCreate(BaseModel):
    text: str = Field(min_length=1)
    is_correct: bool = False


class QuizQuestionCreate(BaseModel):
    question: str = Field(min_length=1)
    order_index: int = Field(default=0, ge=0)
    options: list[QuizOptionCreate] = Field(min_length=2)


class QuizCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    chapter_id: UUID | None = None
    questions: list[QuizQuestionCreate] = Field(min_length=1)


class QuizOptionOut(BaseModel):
    id: UUID
    text: str

    model_config = {"from_attributes": True}


class QuizOptionFullOut(BaseModel):
    id: UUID
    text: str
    is_correct: bool

    model_config = {"from_attributes": True}


class QuizQuestionOut(BaseModel):
    id: UUID
    question: str
    order_index: int
    options: list[QuizOptionOut]

    model_config = {"from_attributes": True}


class QuizOut(BaseModel):
    id: UUID
    book_id: UUID
    chapter_id: UUID | None
    title: str
    description: str | None
    questions: list[QuizQuestionOut]
    created_at: datetime

    model_config = {"from_attributes": True}


class QuizListOut(BaseModel):
    id: UUID
    book_id: UUID
    chapter_id: UUID | None
    title: str
    description: str | None
    question_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Submit ────────────────────────────────────────────────────────────────────

class QuizAnswerIn(BaseModel):
    question_id: UUID
    option_id: UUID


class QuizSubmitIn(BaseModel):
    answers: list[QuizAnswerIn] = Field(min_length=1)


class QuizResultOut(BaseModel):
    id: UUID
    quiz_id: UUID
    score: int  # 0-100
    correct_count: int
    total_questions: int
    completed_at: datetime

    model_config = {"from_attributes": True}
