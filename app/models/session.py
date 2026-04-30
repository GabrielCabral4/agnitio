from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    source_type = Column(String(10), nullable=False)
    raw_content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    material = relationship("StudyMaterial", back_populates="session", uselist=False)
    quiz_attempts = relationship("QuizAttempt", back_populates="session")


class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("study_sessions.id"), nullable=False)
    flashcards = Column(JSON, nullable=False)
    summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("StudySession", back_populates="material")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("study_sessions.id"), nullable=False)
    questions = Column(JSON, nullable=False)
    answers = Column(JSON, nullable=True)
    score = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("StudySession", back_populates="quiz_attempts")


class FlashCardReview(Base):
    __tablename__ = "flashcard_reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    material_id = Column(String, ForeignKey("study_materials.id"), nullable=False)
    card_index = Column(Integer, nullable=False)  # Index of the card in the flashcards JSON array
    front = Column(String(500), nullable=False)
    back = Column(Text, nullable=False)

    # SM-2 Algorithm fields
    ease_factor = Column(Integer, default=250)  # EF * 100 to avoid floats (2.5 -> 250)
    interval = Column(Integer, default=0)  # Days until next review
    repetitions = Column(Integer, default=0)  # Consecutive correct answers
    next_review_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_review_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    material = relationship("StudyMaterial", back_populates="flashcard_reviews")


# Add reverse relationship to StudyMaterial
StudyMaterial.flashcard_reviews = relationship(
    "FlashCardReview",
    back_populates="material",
    cascade="all, delete-orphan"
)
