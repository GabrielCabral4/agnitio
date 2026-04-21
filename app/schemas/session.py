from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SessionCreate(BaseModel):
    title: str
    content: str
    source_type: str = "text"


class FlashCard(BaseModel):
    front: str
    back: str


class StudyMaterialResponse(BaseModel):
    id: str
    flashcards: list[FlashCard]
    summary: str
    created_at: datetime

    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    id: str
    title: str
    source_type: str
    created_at: datetime
    material: Optional[StudyMaterialResponse] = None

    class Config:
        from_attributes = True


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_index: int


class QuizAttemptResponse(BaseModel):
    id: str
    questions: list[QuizQuestion]
    answers: Optional[list[int]] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QuizSubmit(BaseModel):
    answers: list[int]
