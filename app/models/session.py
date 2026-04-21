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
