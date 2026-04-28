@AGENTS.md
# Agnitio — Instructions for Claude

## Overview
Agnitio is an AI-powered study application. The user submits content (text or PDF),
and the AI generates flashcards, a summary, and a quiz with personalized feedback.

## Repository Structure
agnitio/
├── app/          # FastAPI backend
├── alembic/      # Database migrations
├── web/          # Next.js frontend
└── fix_files.py  # Encoding fix script (development only)

## Backend

### Stack
- Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic, Supabase (PostgreSQL)
- AI: Google Gemini via `google-genai`
- Package manager: `uv`

### Commands
```bash
# Install dependencies
uv sync

# Run development server
uvicorn app.main:app --reload

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

### Environment Variables (.env at root)
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...

### Architecture
- `app/models/` — SQLAlchemy tables (StudySession, StudyMaterial, QuizAttempt)
- `app/schemas/` — Pydantic request/response models
- `app/routers/` — FastAPI endpoints
- `app/services/ai.py` — Gemini integration (generate_study_material, generate_quiz, analyze_answers)
- `app/services/pdf.py` — PDF text extraction
- `app/database.py` — engine, SessionLocal, get_db
- `app/config.py` — settings via pydantic-settings

### AI Model
- Current model: `gemini-3.1-flash-lite-preview`
- To switch models, change `MODEL` in `app/services/ai.py`
- AI functions return structured JSON — any prompt changes must keep the output
  format compatible with the corresponding Pydantic schemas

### Conventions
- IDs are UUID strings
- Dates in UTC
- JSON columns for flexible fields (flashcards, questions, answers)
- Never expose GEMINI_API_KEY to the frontend

## Frontend

### Stack
- Next.js 15, React 18, TypeScript, Tailwind CSS, App Router

### Commands
```bash
cd web
npm run dev     # development
npm run build   # production build
npm run lint    # lint
```

### Environment Variables (web/.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000

### Architecture
- `web/src/lib/api.ts` — all backend calls centralized here
- `web/src/app/page.tsx` — home, session list
- `web/src/app/sessions/new/page.tsx` — session creation
- `web/src/app/sessions/[id]/page.tsx` — session detail, flashcards and summary
- `web/src/app/sessions/[id]/quiz/page.tsx` — quiz and feedback

### Conventions
- All page components are Client Components (`"use client"`)
- API calls always via `api.*` from `@/lib/api.ts`, never raw fetch in pages
- Tailwind for styling, no external CSS

## Encoding Warning (Windows/PyCharm)
Python files created by PyCharm may be saved as UTF-16, causing
`SyntaxError: source code string cannot contain null bytes`.
If this happens, use `fix_files.py` at the root to rewrite corrupted files in UTF-8.
