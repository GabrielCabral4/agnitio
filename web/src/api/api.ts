const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface FlashCard {
  front: string;
  back: string;
}

export interface StudyMaterial {
  id: string;
  flashcards: FlashCard[];
  summary: string;
  created_at: string;
}

export interface Session {
  id: string;
  title: string;
  source_type: string;
  created_at: string;
  material?: StudyMaterial;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

export interface QuizAttempt {
  id: string;
  questions: QuizQuestion[];
  answers?: number[];
  score?: number;
  feedback?: string;
  created_at: string;
}

export const api = {
  async listSessions(): Promise<Session[]> {
    const res = await fetch(`${API_URL}/sessions/`);
    if (!res.ok) throw new Error("Erro ao listar sessões");
    return res.json();
  },

  async getSession(id: string): Promise<Session> {
    const res = await fetch(`${API_URL}/sessions/${id}`);
    if (!res.ok) throw new Error("Sessão não encontrada");
    return res.json();
  },

  async createSession(data: {
    title: string;
    content: string;
    source_type: string;
  }): Promise<Session> {
    const res = await fetch(`${API_URL}/sessions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao criar sessão");
    return res.json();
  },

  async uploadPDF(title: string, file: File): Promise<Session> {
    const form = new FormData();
    form.append("title", title);
    form.append("file", file);
    const res = await fetch(`${API_URL}/sessions/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Erro ao fazer upload do PDF");
    return res.json();
  },

  async generateMaterial(sessionId: string): Promise<Session> {
    const res = await fetch(`${API_URL}/sessions/${sessionId}/generate`, {
      method: "POST",
    });
    if (res.status === 503) {
      throw new Error("Serviço de IA temporariamente indisponível. Tente novamente em instantes.");
    }
    if (!res.ok) throw new Error("Erro ao gerar material");
    return res.json();
  },

  async createQuiz(sessionId: string): Promise<QuizAttempt> {
    const res = await fetch(`${API_URL}/sessions/${sessionId}/quiz`, {
      method: "POST",
    });
    if (res.status === 503) {
      throw new Error("Serviço de IA temporariamente indisponível. Tente novamente em instantes.");
    }
    if (!res.ok) throw new Error("Erro ao gerar quiz");
    return res.json();
  },

  async submitQuiz(
    sessionId: string,
    attemptId: string,
    answers: number[]
  ): Promise<QuizAttempt> {
    const res = await fetch(
      `${API_URL}/sessions/${sessionId}/quiz/${attemptId}/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      }
    );
    if (res.status === 503) {
      throw new Error("Serviço de IA temporariamente indisponível. Tente novamente em instantes.");
    }
    if (!res.ok) throw new Error("Erro ao submeter quiz");
    return res.json();
  },

  async getQuizAttempts(sessionId: string): Promise<QuizAttempt[]> {
    const res = await fetch(`${API_URL}/sessions/${sessionId}/quiz-attempts`);
    if (!res.ok) throw new Error("Erro ao carregar histórico de quiz");
    return res.json();
  },

  async getAnalytics(): Promise<{
    total_sessions: number;
    total_quizzes: number;
    total_flashcards: number;
    average_score: number;
    best_score: number;
    quizzes_today: number;
    quizzes_this_week: number;
    weekly_activity: { date: string; day: string; count: number }[];
    recent_sessions: { id: string; title: string; source_type: string; created_at: string; quiz_count: number }[];
  }> {
    const res = await fetch(`${API_URL}/sessions/analytics`);
    if (!res.ok) throw new Error("Erro ao carregar analytics");
    return res.json();
  },

  async createReviewSession(sessionId: string): Promise<{
    id: string;
    material_id: string;
    cards_due: {
      id: string;
      card_index: number;
      front: string;
      back: string;
      ease_factor: number;
      interval: number;
      repetitions: number;
      next_review_at: string;
      last_review_at: string | null;
    }[];
    total_due: number;
    stats: {
      total: number;
      due: number;
      new: number;
      mature: number;
      average_ease_factor: number;
      learned_percentage: number;
    };
  }> {
    const res = await fetch(`${API_URL}/sessions/${sessionId}/review`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Erro ao criar sessão de revisão");
    return res.json();
  },

  async submitCardReview(
    sessionId: string,
    cardIndex: number,
    rating: "again" | "hard" | "good" | "easy",
    timeSpentMs: number = 0
  ): Promise<{
    id: string;
    card_index: number;
    front: string;
    back: string;
    ease_factor: number;
    interval: number;
    repetitions: number;
    next_review_at: string;
    last_review_at: string | null;
  }> {
    const res = await fetch(`${API_URL}/sessions/${sessionId}/review/${cardIndex}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card_index: cardIndex, rating, time_spent_ms: timeSpentMs }),
    });
    if (!res.ok) throw new Error("Erro ao submeter revisão");
    return res.json();
  },

  async getReviewStats(sessionId: string): Promise<{
    total: number;
    due: number;
    new: number;
    mature: number;
    average_ease_factor: number;
    learned_percentage: number;
  }> {
    const res = await fetch(`${API_URL}/sessions/${sessionId}/review/stats`);
    if (!res.ok) throw new Error("Erro ao carregar estatísticas de revisão");
    return res.json();
  },
};