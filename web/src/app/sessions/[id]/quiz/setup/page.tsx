"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Brain, Sparkles } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { api, Session } from "@/api/api";
import { useEffect } from "react";

export default function QuizSetupPage() {
  const { isLoading, isAuthenticated } = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [quizCount, setQuizCount] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSession(id)
      .then(setSession)
      .finally(() => setLoading(false));
  }, [id]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card h-64 w-full animate-shimmer" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card p-8 text-center border-red-500/20 bg-red-500/5">
          <p className="text-red-500">Sessão não encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-10 animate-fade-in">
        <button
          onClick={() => router.push(`/sessions/${id}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a sessão
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configurar Quiz</h1>
            <p className="text-sm text-muted-foreground">
              Sessão: {session.title}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-12 text-center border-dashed animate-scale-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
          <Brain className="w-10 h-10 text-indigo-500" />
        </div>

        <h2 className="text-xl font-semibold mb-2">Personalize seu desafio</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Escolha a quantidade de questões que deseja responder para testar seus conhecimentos sobre este conteúdo.
        </p>

        <div className="flex items-center justify-center gap-3 mb-8">
          <label htmlFor="quiz-count" className="text-sm font-medium text-muted-foreground">
            Quantidade de questões:
          </label>
          <input
            id="quiz-count"
            type="number"
            min="1"
            max="30"
            value={quizCount}
            onChange={(e) => setQuizCount(parseInt(e.target.value) || 1)}
            className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center"
          />
        </div>

        <button
          onClick={() => router.push(`/sessions/${id}/quiz?count=${quizCount}`)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          Começar Quiz
        </button>
      </div>
    </div>
  );
}
