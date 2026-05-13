const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const getAuthHeader = () => {
  const token = localStorage.getItem("agnitio_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

type AuthHeaders = Record<string, string>;

async function handleResponse(res: Response) {
  if (res.ok) return res.json();

  let detail = "Ocorreu um erro inesperado";
  try {
    const errorData = await res.json();
    if (errorData && typeof errorData.detail === "string") {
      detail = errorData.detail;
    }
  } catch (e) {
    // Response was not JSON
  }

  throw new Error(detail);
}

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
    const res = await fetch(`${API_URL}/sessions/`, {
      headers: getAuthHeader() as AuthHeaders,
    });
    return handleResponse(res);
  },

  async getSession(id: string): Promise<Session> {
    const res = await fetch(`${API_URL}/sessions/${id}`, {
      headers: getAuthHeader() as AuthHeaders,
    });
    return handleResponse(res);
  },

  async createSession(data: {
    title: string;
    content: string;
    source_type: string;
  }): Promise<Session> {
    const res = await fetch(`${API_URL}/sessions/`, {
      method: "POST",
      headers: { ...getAuthHeader(), "Content-Type": "application/json" } as AuthHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async uploadPDF(title: string, file: File): Promise<Session> {
    const form = new FormData();
    form.append("title", title);
    form.append("file", file);
    const res = await fetch(`${API_URL}/sessions/upload`, {
      method: "POST",
      headers: getAuthHeader() as AuthHeaders,
      body: form,
    });
    return handleResponse(res);
  },

  async generateMaterial(sessionId: string, flashcardCount: number): Promise<Session> {
    const res = await fetch(`${API_URL}/sessions/${sessionId}/generate?flashcard_count=${flashcardCount}`, {
      method: "POST",
      headers: getAuthHeader() as AuthHeaders,
    });
    if (res.status === 503) {
      throw new Error("Serviço de IA temporariamente indisponível. Tente novamente em instantes.");
    }
    return handleResponse(res);
  },

  async createQuiz(sessionId: string): Promise<QuizAttempt> {
    const res = await fetch(`${API_URL}/sessions/${sessionId}/quiz`, {
      method: "POST",
      headers: getAuthHeader() as AuthHeaders,
    });
    if (res.status === 503) {
      throw new Error("Serviço de IA temporariamente indisponível. Tente novamente em instantes.");
    }
    return handleResponse(res);
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
        headers: { ...getAuthHeader(), "Content-Type": "application/json" } as AuthHeaders,
        body: JSON.stringify({ answers }),
      }
    );
    if (res.status === 503) {
      throw new Error("Serviço de IA temporariamente indisponível. Tente novamente em instantes.");
    }
    return handleResponse(res);
  },

  async getQuizAttempts(sessionId: string): Promise<QuizAttempt[]> {
    const res = await fetch(`${API_URL}/sessions/${sessionId}/quiz-attempts`, {
      headers: getAuthHeader() as AuthHeaders,
    });
    return handleResponse(res);
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
  }> {
    const res = await fetch(`${API_URL}/sessions/analytics`, {
      headers: getAuthHeader() as AuthHeaders,
    });
    return handleResponse(res);
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
      headers: getAuthHeader() as AuthHeaders,
    });
    return handleResponse(res);
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
      headers: { ...getAuthHeader(), "Content-Type": "application/json" } as AuthHeaders,
      body: JSON.stringify({ card_index: cardIndex, rating, time_spent_ms: timeSpentMs }),
    });
    return handleResponse(res);
  },

  async getReviewStats(sessionId: string): Promise<{
    total: number;
    due: number;
    new: number;
    mature: number;
    average_ease_factor: number;
    learned_percentage: number;
  }> {
    const res = await fetch(`${API_URL}/sessions/${sessionId}/review/stats`, {
      headers: getAuthHeader() as AuthHeaders,
    });
    return handleResponse(res);
  },

  async deleteSession(sessionId: string): Promise<void> {
    const res = await fetch(`${API_URL}/sessions/${sessionId}`, {
      method: "DELETE",
      headers: getAuthHeader() as AuthHeaders,
    });
    if (!res.ok) throw new Error("Erro ao excluir sessão");
  },

  async login(data: { email: string; password: string }): Promise<{ access_token: string; token_type: string }> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async loginDemo(): Promise<{ access_token: string; token_type: string }> {
    const res = await fetch(`${API_URL}/auth/demo`, {
      method: "GET",
      headers: getAuthHeader() as AuthHeaders,
    });
    return handleResponse(res);
  },

  async signup(data: { email: string; password: string }): Promise<{ id: string; email: string; created_at: string }> {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};
