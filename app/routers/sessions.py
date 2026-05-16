from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import Response, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.database import get_db
from app.models.session import StudySession, StudyMaterial, QuizAttempt, FlashCardReview
from app.schemas.session import (
    SessionCreate, SessionUpdate, SessionResponse,
    QuizAttemptResponse, QuizSubmit,
    FlashCardReviewResponse, ReviewSessionResponse, ReviewSubmit
)
from app.services.ai import generate_study_material, generate_quiz, analyze_answers
from app.routers.auth import get_current_user
from app.services import srs
from app.services.pdf_export import generate_session_pdf
from datetime import datetime, timedelta, timezone
import io

try:
    from PyPDF2 import PdfReader
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.post("/", response_model=SessionResponse)
def create_session(session: SessionCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_session = StudySession(
        title=session.title,
        source_type=session.source_type,
        raw_content=session.content,
        user_id=current_user.id,
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.post("/upload", response_model=SessionResponse)
async def create_session_from_pdf(
        title: str = Form(...),
        file: UploadFile = File(...),
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user),
):
    if not PDF_SUPPORT:
        raise HTTPException(status_code=500, detail="Suporte a PDF não disponível")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")

    contents = await file.read()
    reader = PdfReader(io.BytesIO(contents))

    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    text = text.replace("\x00", "")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Não foi possível extrair texto do PDF")

    db_session = StudySession(
        title=title,
        source_type="pdf",
        raw_content=text,
        user_id=current_user.id,
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/analytics", response_model=dict)
def get_analytics(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Retorna estatísticas gerais da plataforma para o dashboard de analytics.
    """
    now_local = datetime.now()
    today_start = now_local.replace(hour=0, minute=0, second=0, microsecond=0)

    today_start_utc = today_start.astimezone(timezone.utc).replace(tzinfo=None)
    week_start_utc = today_start_utc - timedelta(days=7)

    now = datetime.now(timezone.utc)

    # Total sessions (filtered by user)
    total_sessions = db.query(StudySession).filter(StudySession.user_id == current_user.id).count()

    # Total quizzes (completed and filtered by user)
    total_quizzes = db.query(QuizAttempt).join(StudySession).filter(
        StudySession.user_id == current_user.id,
        QuizAttempt.answers.isnot(None)
    ).count()

    # Total flashcards (filtered by user)
    materials = db.query(StudyMaterial).join(StudySession).filter(StudySession.user_id == current_user.id).all()
    total_flashcards = sum(len(m.flashcards) for m in materials if m.flashcards)

    # Average and best score
    completed_quizzes = db.query(QuizAttempt).join(StudySession).filter(
        StudySession.user_id == current_user.id,
        QuizAttempt.answers.isnot(None),
        QuizAttempt.score.isnot(None)
    ).all()

    if completed_quizzes:
        scores = []
        for q in completed_quizzes:
            questions = q.questions if isinstance(q.questions, list) else []
            if len(questions) > 0:
                percentage = (q.score or 0) / len(questions) * 100
                scores.append(percentage)

        average_score = sum(scores) / len(scores) if scores else 0
        best_score = max(scores) if scores else 0
    else:
        average_score = 0
        best_score = 0

    # Quizzes today
    quizzes_today = db.query(QuizAttempt).join(StudySession).filter(
        StudySession.user_id == current_user.id,
        QuizAttempt.answers.isnot(None),
        QuizAttempt.created_at >= today_start_utc
    ).count()

    # Quizzes this week
    quizzes_this_week = db.query(QuizAttempt).join(StudySession).filter(
        StudySession.user_id == current_user.id,
        QuizAttempt.answers.isnot(None),
        QuizAttempt.created_at >= week_start_utc
    ).count()

    # Weekly activity (last 7 days)
    weekly_activity = []
    for i in range(6, -1, -1):
        day_start_local = today_start - timedelta(days=i)
        day_end_local = day_start_local + timedelta(days=1)

        day_start_utc = day_start_local.astimezone(timezone.utc).replace(tzinfo=None)
        day_end_utc = day_end_local.astimezone(timezone.utc).replace(tzinfo=None)

        count = db.query(QuizAttempt).join(StudySession).filter(
            StudySession.user_id == current_user.id,
            QuizAttempt.answers.isnot(None),
            QuizAttempt.created_at >= day_start_utc,
            QuizAttempt.created_at < day_end_utc
        ).count()
        weekly_activity.append({
            "date": day_start_local.strftime("%Y-%m-%d"),
            "day": day_start_local.strftime("%a"),
            "count": count
        })

    due_sessions_count = db.query(StudySession).join(StudyMaterial).join(FlashCardReview).filter(StudySession.user_id == current_user.id, FlashCardReview.next_review_at <= now).distinct().count()

    # Recent sessions
    recent_sessions = []
    for s in db.query(StudySession).filter(StudySession.user_id == current_user.id).order_by(StudySession.created_at.desc()).limit(5).all():
        quiz_count = db.query(QuizAttempt).filter(
            QuizAttempt.session_id == s.id,
            QuizAttempt.answers.isnot(None)
        ).count()
        recent_sessions.append({
            "id": s.id,
            "title": s.title,
            "source_type": s.source_type,
            "created_at": s.created_at.isoformat(),
            "quiz_count": quiz_count
        })

    return {
        "total_sessions": total_sessions,
        "total_quizzes": total_quizzes,
        "total_flashcards": total_flashcards,
        "average_score": round(average_score, 1),
        "best_score": best_score,
        "quizzes_today": quizzes_today,
        "quizzes_this_week": quizzes_this_week,
        "weekly_activity": weekly_activity,
        "recent_sessions": recent_sessions,
        "due_sessions_count": due_sessions_count
    }

@router.post("/{session_id}/review", response_model=ReviewSessionResponse)
def create_review_session(session_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Create a new review session for a study session.
    Returns flashcards that are due for review based on SM-2 algorithm.
    """
    # Get the study session
    db_session = db.query(StudySession).filter(StudySession.id == session_id, StudySession.user_id == current_user.id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    if not db_session.material:
        raise HTTPException(status_code=400, detail="Material ainda não gerado para esta sessão")

    # Get or create flashcard reviews for this material
    existing_reviews = db.query(FlashCardReview).filter(
        FlashCardReview.material_id == db_session.material.id
    ).all()

    # If no reviews exist, create them from the flashcards
    if not existing_reviews:
        for i, card in enumerate(db_session.material.flashcards):
            stmt = pg_insert(FlashCardReview).values(
                material_id=db_session.material.id,
                card_index=i,
                front=card["front"],
                back=card["back"],
                ease_factor=250,
                interval=0,
                repetitions=0,
                next_review_at=datetime.now(timezone.utc)
            ).on_conflict_do_nothing(
                index_elements=['material_id', 'card_index']
            )
            db.execute(stmt)
        db.commit()

        existing_reviews = db.query(FlashCardReview).filter(
            FlashCardReview.material_id == db_session.material.id
        ).all()

    # Get cards due for review
    due_cards = srs.get_cards_due_for_review(existing_reviews, limit=20)

    # Get study stats
    stats = srs.get_study_stats(existing_reviews)

    return {
        "id": db_session.material.id,
        "material_id": db_session.material.id,
        "cards_due": due_cards,
        "total_due": len(due_cards),
        "stats": stats
    }

@router.post("/{session_id}/review/{card_index}/submit", response_model=FlashCardReviewResponse)
def submit_card_review(
    session_id: str,
    card_index: int,
    payload: ReviewSubmit,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Submit a review for a specific flashcard and update its SM-2 parameters.
    """
    # Get the study session
    db_session = db.query(StudySession).filter(StudySession.id == session_id, StudySession.user_id == current_user.id).first()
    if not db_session or not db_session.material:
        raise HTTPException(status_code=404, detail="Sessão ou material não encontrado")

    # Get the flashcard review
    review = db.query(FlashCardReview).filter(
        FlashCardReview.material_id == db_session.material.id,
        FlashCardReview.card_index == card_index
    ).first()

    if not review:
        raise HTTPException(status_code=404, detail="Flashcard não encontrado")

    # Process the review using SM-2 algorithm
    quality = srs.get_quality_from_rating(payload.rating)
    result = srs.process_review(
        ease_factor=review.ease_factor,
        interval=review.interval,
        repetitions=review.repetitions,
        quality=quality
    )

    # Update the review record
    review.ease_factor = result.ease_factor
    review.interval = result.interval
    review.repetitions = result.repetitions
    review.next_review_at = result.next_review_at
    review.last_review_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(review)

    return review

@router.get("/{session_id}/review/stats", response_model=dict)
def get_review_stats(session_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Get SRS statistics for a study session.
    """
    db_session = db.query(StudySession).filter(StudySession.id == session_id, StudySession.user_id == current_user.id).first()
    if not db_session or not db_session.material:
        raise HTTPException(status_code=404, detail="Sessão ou material não encontrado")

    reviews = db.query(FlashCardReview).filter(
        FlashCardReview.material_id == db_session.material.id
    ).all()

    if not reviews:
        return {
            "total": 0,
            "due": 0,
            "new": 0,
            "mature": 0,
            "average_ease_factor": 2.5,
            "learned_percentage": 0
        }

    stats = srs.get_study_stats(reviews)
    return stats

@router.post("/{session_id}/generate", response_model=SessionResponse)
def generate_material(session_id: str, flashcard_count: Optional[int] = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_session = db.query(StudySession).filter(StudySession.id == session_id, StudySession.user_id == current_user.id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    if db_session.material:
        raise HTTPException(status_code=400, detail="Material já gerado para esta sessão")

    result = generate_study_material(db_session.raw_content, flashcard_count=flashcard_count)

    material = StudyMaterial(
        session_id=session_id,
        flashcards=result["flashcards"],
        summary=result["summary"],
    )
    db.add(material)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.post("/{session_id}/quiz", response_model=QuizAttemptResponse)
def create_quiz(session_id: str, quiz_count: Optional[int] = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_session = db.query(StudySession).filter(StudySession.id == session_id, StudySession.user_id == current_user.id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    questions = generate_quiz(db_session.raw_content, quiz_count=quiz_count)

    attempt = QuizAttempt(
        session_id=session_id,
        questions=questions,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt

@router.post("/{session_id}/quiz/{attempt_id}/submit", response_model=QuizAttemptResponse)
def submit_quiz(
    session_id: str,
    attempt_id: str,
    payload: QuizSubmit,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    attempt = db.query(QuizAttempt).join(StudySession).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.session_id == session_id,
        StudySession.user_id == current_user.id
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Tentativa não encontrada")
    if attempt.answers is not None:
        raise HTTPException(status_code=400, detail="Quiz já submetido")

    result = analyze_answers(attempt.questions, payload.answers)

    attempt.answers = payload.answers
    attempt.score = result["score"]
    attempt.feedback = result["feedback"]
    db.commit()
    db.refresh(attempt)
    return attempt

@router.get("/", response_model=list[SessionResponse])
def list_sessions(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(StudySession).filter(StudySession.user_id == current_user.id).order_by(StudySession.created_at.desc()).all()

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Deletes a study session.
    """
    db_session = db.query(StudySession).filter(StudySession.id == session_id, StudySession.user_id == current_user.id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    db.delete(db_session)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_session = db.query(StudySession).filter(StudySession.id == session_id, StudySession.user_id == current_user.id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    return db_session


@router.patch("/{session_id}", response_model=SessionResponse)
def update_session(session_id: str, session_update: SessionUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_session = db.query(StudySession).filter(StudySession.id == session_id, StudySession.user_id == current_user.id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    db_session.title = session_update.title
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/{session_id}/export")
def export_session_pdf(
    session_id: str,
    db: Session = Depends(get_db),
    token: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    """
    Generates and returns a PDF study guide for the session.
    """
    # If token is provided in query, we can manually verify it if get_current_user is failing
    # because of the way browser window.open works (doesn't send Auth headers).
    # However, get_current_user already handles the Authorization header.
    # If the user is calling this via window.open, they must provide the token.

    db_session = db.query(StudySession).filter(StudySession.id == session_id, StudySession.user_id == current_user.id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    try:
        pdf_bytes = generate_session_pdf(db_session)
        filename = db_session.title.replace(" ", "_").lower()
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}.pdf"},
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@router.get("/{session_id}/quiz-attempts", response_model=list[QuizAttemptResponse])
def list_quiz_attempts(session_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    attempts = (
        db.query(QuizAttempt).join(StudySession).filter(
            QuizAttempt.session_id == session_id,
            StudySession.user_id == current_user.id,
            QuizAttempt.answers.isnot(None)
        )
        .order_by(QuizAttempt.created_at.asc())
        .all()
    )
    return attempts
