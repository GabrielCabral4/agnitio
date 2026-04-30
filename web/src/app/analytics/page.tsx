"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/api/api";
import {
  TrendingUp,
  BookOpen,
  Brain,
  Trophy,
  Calendar,
  Activity,
  Target,
  Flame,
  ArrowLeft
} from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    total_sessions: number;
    total_quizzes: number;
    total_flashcards: number;
    average_score: number;
    best_score: number;
    quizzes_today: number;
    quizzes_this_week: number;
    weekly_activity: { date: string; day: string; count: number }[];
    recent_sessions: { id: string; title: string; source_type: string; created_at: string; quiz_count: number }[];
  } | null>(null);

  useEffect(() => {
    api.getAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-32 animate-shimmer" />
          ))}
        </div>
        <div className="card h-64 animate-shimmer" style={{ animationDelay: "0.2s" }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="card p-8 text-center border-red-500/20 bg-red-500/5">
          <p className="text-red-500">Erro ao carregar analytics.</p>
        </div>
      </div>
    );
  }

  const maxWeeklyCount = Math.max(...data.weekly_activity.map(d => d.count), 1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10 animate-fade-in">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para home
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe sua evolução nos estudos
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Sessions */}
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="text-xs text-muted-foreground">Sessões</span>
          </div>
          <p className="text-3xl font-bold">{data.total_sessions}</p>
        </div>

        {/* Total Quizzes */}
        <div className="card p-5 animate-fade-in" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-500" />
            </div>
            <span className="text-xs text-muted-foreground">Quizzes</span>
          </div>
          <p className="text-3xl font-bold">{data.total_quizzes}</p>
        </div>

        {/* Total Flashcards */}
        <div className="card p-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs text-muted-foreground">Flashcards</span>
          </div>
          <p className="text-3xl font-bold">{data.total_flashcards}</p>
        </div>

        {/* Average Score */}
        <div className="card p-5 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-xs text-muted-foreground">Média</span>
          </div>
          <p className="text-3xl font-bold text-emerald-500">{data.average_score}%</p>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Best Score */}
        <div className="card p-5 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xs text-muted-foreground">Melhor Score</span>
          </div>
          <p className="text-2xl font-bold text-amber-500">{data.best_score}%</p>
        </div>

        {/* Quizzes Today */}
        <div className="card p-5 animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xs text-muted-foreground">Quizzes hoje</span>
          </div>
          <p className="text-2xl font-bold text-blue-500">{data.quizzes_today}</p>
        </div>

        {/* Quizzes This Week */}
        <div className="card p-5 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/10 to-pink-500/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <span className="text-xs text-muted-foreground">Quizzes esta semana</span>
          </div>
          <p className="text-2xl font-bold text-rose-500">{data.quizzes_this_week}</p>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="card p-6 mb-8 animate-fade-in" style={{ animationDelay: "0.35s" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Atividade Semanal de quizzes</h2>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </div>
        </div>

        <div className="flex items-end justify-between h-40 gap-2">
          {data.weekly_activity.map((day, i) => {
            const height = (day.count / maxWeeklyCount) * 100;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative flex items-end justify-center h-32">
                  <div
                    className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{
                      height: `${Math.max(height, 8)}%`,
                      opacity: height > 0 ? 1 : 0.3
                    }}
                  />
                  {day.count > 0 && (
                    <span className="absolute -top-6 text-xs font-semibold text-indigo-500">
                      {day.count}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card p-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Sessões Recentes</h2>
            <p className="text-xs text-muted-foreground">Últimas sessões criadas</p>
          </div>
        </div>

        <div className="space-y-3">
          {data.recent_sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma sessão criada ainda
            </p>
          ) : (
            data.recent_sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => router.push(`/sessions/${session.id}`)}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    session.source_type === "pdf"
                      ? "bg-gradient-to-br from-red-500/10 to-pink-500/10 text-red-500"
                      : "bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-500"
                  }`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{session.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString("pt-BR")} • {session.source_type.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-500">{session.quiz_count}</p>
                    <p className="text-xs text-muted-foreground">Quizzes</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
