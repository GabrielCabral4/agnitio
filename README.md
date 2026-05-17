# Agnitio — Artificial Intelligence for Active Learning 🧠

Agnitio is a high-performance learning platform that uses Artificial Intelligence to transform passive content (texts and PDFs) into active study materials, fighting the forgetting curve and optimizing knowledge retention.

## 🚀 Main Features

### 🤖 Intelligent Material Generation
- **Content Transformation**: Upload PDFs or paste text that is processed by LLMs to extract key concepts.
- **Asynchronous Workflow**: Background material generation, allowing users to keep browsing while the AI processes the content.
- **Structured Summaries**: Generation of condensed, well-organized summaries for quick review.
- **Automatic Flashcards**: Creation of question/answer pairs focused on the most important points in the content.

### 📈 Retention and Performance System
- **Spaced Repetition (SRS)**: Implementation of the **SM-2** algorithm to schedule flashcard reviews based on user performance (Again, Hard, Good, Easy), optimizing long-term memorization.
- **Adaptive Quizzes**: Generation of multiple-choice tests with immediate, educational AI feedback.
- **Analytics Dashboard**: Full progress tracking, including memorization statistics, weekly activity, and performance score.
- **AI Feedback**: Personalized analysis of quiz performance, suggesting areas for improvement.

### 🛠️ Productivity Tools
- **PDF Export**: Generation of complete study guides in PDF format, including summaries, flashcards, and quiz question banks.
- **Session Management**: Organization of different study topics into independent sessions.
- **Secure Authentication**: Account system for persistence of progress and data synchronization.

## 🛠️ Tech Stack

### Backend
- **Language**: Python 3.11+
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (high-performance REST API)
- **AI**: [Google Gemini](https://ai.google.dev/) via `google-genai`
- **Database**: PostgreSQL (via [Supabase](https://supabase.com/))
- **ORM & Migrations**: SQLAlchemy 2.0 and Alembic
- **Package Manager**: `uv`

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components & Icons**: Lucide React, Sonner (Toasts)

## 📐 Architecture and Technical Decisions

The project was designed with robustness and user experience in mind:

- **Resilient AI**: Implementation of a model priority list (fallback), retries with exponential backoff for 429/503 errors, and parallel processing of AI tasks to reduce latency.
- **Structured Output (LLM)**: Implementation of strict prompts and validation via Pydantic to ensure the AI returns predictable JSON.
- **Data Strategy**: Use of JSON columns in PostgreSQL to store flashcards and questions, balancing the flexibility of non-relational schemas with SQL consistency.
- **SM-2 Algorithm**: Rigorous implementation of the spaced repetition logic to automate the review schedule.
- **Modern UX/UI**: Responsive interface optimized for mobile devices, with fluid animations and instant feedback.

## 🎯 Technical Challenges Overcome

- **AI Consistency**: Overcoming the non-deterministic nature of LLMs through *few-shot prompting* and schema validation.
- **PDF Performance**: Implementation of efficient text extraction to handle large documents without degrading API performance.
- **State Synchronization**: Complex frontend state management to handle switching between card view, quizzes, and real-time statistics.

## 🛠️ CI/CD and Code Quality

To ensure project stability and code quality, I implemented a **Continuous Integration (CI)** pipeline via GitHub Actions:

- **Backend**: Automatic execution of integration tests with `pytest` on every push or pull request.
- **Frontend**: Type checking (TypeScript) and automatic linting to ensure consistency and prevent runtime bugs.
- **Validation**: Blocking merges that break tests or the frontend build.

## ⚙️ How to Run the Project

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Google Gemini API key

### Step by Step

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/agnitio.git
   cd agnitio
   ```

2. **Backend setup**
   ```bash
   # Install uv
   curl -LsSf https://astral.sh/uv/install.sh | sh
   
   # Install dependencies
   uv sync
   
   # Configure environment variables in the .env file
   # DATABASE_URL=...
   # GEMINI_API_KEY=...
   
   # Run database migrations
   uv run alembic upgrade head
   
   # Start the server
   uv run uvicorn app.main:app --reload
   ```

3. **Frontend setup**
   ```bash
   cd web
   npm install
   
   # Configure .env.local
   # NEXT_PUBLIC_API_URL=http://localhost:8000

   npm run dev
   ```

## 📌 Project Status
✅ MVP Complete | 🔄 Evolving (SRS, Analytics, and PDF Export systems implemented)
---
**Software Engineering**, **LLM Integration** e **Fullstack Development**.
