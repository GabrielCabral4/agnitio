from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import StudySession, StudyMaterial, QuizAttempt
from app.schemas.session import (
    SessionCreate, SessionResponse,
    QuizAttemptResponse, QuizSubmit
)
from app.services.ai import generate_study_material, generate_quiz, analyze_answers
import io

try:
    from PyPDF2 import PdfReader
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/", response_model=SessionResponse)
def create_session(session: SessionCreate, db: Session = Depends(get_db)):
    db_session = StudySession(
        title=session.title,
        source_type=session.source_type,
        raw_content=session.content,
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
):
    if not PDF_SUPPORT:
        raise HTTPException(status_code=500, detail="Suporte a PDF não disponível")
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")

    contents = await file.read()
    reader = PdfReader(io.BytesIO(contents))
    text = "\\n".join(page.extract_text() or "" for page in reader.pages)

    if not text.strip():
        raise HTTPException(status_code=400, detail="Não foi possível extrair texto do PDF")

    db_session = StudySession(
        title=title,
        source_type="pdf",
        raw_content=text,
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.post("/{session_id}/generate", response_model=SessionResponse)
def generate_material(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    if db_session.material:
        raise HTTPException(status_code=400, detail="Material já gerado para esta sessão")

    result = generate_study_material(db_session.raw_content)

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
def create_quiz(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    questions = generate_quiz(db_session.raw_content)

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
):
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.session_id == session_id,
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
def list_sessions(db: Session = Depends(get_db)):
    return db.query(StudySession).order_by(StudySession.created_at.desc()).all()


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    return db_session