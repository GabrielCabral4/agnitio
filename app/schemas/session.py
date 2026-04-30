from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class SessionCreate(BaseModel):
    title: str
    content: str
    source_type: str = "text"


class AnalyticsData(BaseModel):
    total_sessions: int
    total_quizzes: int
    total_flashcards: int
    average_score: float
    best_score: float
    quizzes_today: int
    quizzes_this_week: int
    weekly_activity: List[Dict[str, Any]]
    recent_sessions: List[Dict[str, Any]]


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


class FlashCardReviewResponse(BaseModel):
    id: str
    card_index: int
    front: str
    back: str
    ease_factor: int
    interval: int
    repetitions: int
    next_review_at: datetime
    last_review_at: datetime = None

    class Config:
        from_attributes = True


class ReviewSessionResponse(BaseModel):
    id: str
    material_id: str
    cards_due: list[FlashCardReviewResponse]
    total_due: int
    stats: dict

    class Config:
        from_attributes = True


class ReviewSubmit(BaseModel):
    card_index: int
    rating: str  # "again", "hard", "good", "easy"
    time_spent_ms: int = 0
