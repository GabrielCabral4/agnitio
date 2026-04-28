"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Session } from "@/api/api";
import { Plus, FileText, Sparkles, Calendar, ChevronRight, Inbox } from "lucide-react";

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listSessions()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-6">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Agnitio
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Estude de forma inteligente
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Transforme qualquer conteúdo em flashcards, resumos e quizzes personalizados com inteligência artificial
        </p>
      </div>

      <div className="flex items-center justify-between mb-8 animate-slide-in-right">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Suas sessões</h2>
            <p className="text-sm text-muted-foreground">
              {sessions.length} {sessions.length === 1 ? "sessão" : "sessões"} criada{sessions.length === 1 ? "s" : "s"}
            </p>
          </div>
        </div>
        <Link
          href="/sessions/new"
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Nova sessão
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-20 animate-shimmer" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && sessions.length === 0 && (
        <div className="card p-16 text-center animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
            <Inbox className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhuma sessão ainda</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Crie sua primeira sessão para começar a estudar com flashcards, resumos e quizzes gerados por IA
          </p>
          <Link
            href="/sessions/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Criar primeira sessão
          </Link>
        </div>
      )}

      {/* Sessions List */}
      {!loading && sessions.length > 0 && (
        <ul className="space-y-3">
          {sessions.map((session, index) => (
            <li
              key={session.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Link
                href={`/sessions/${session.id}`}
                className="card p-5 block group hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      session.material
                        ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                        : "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                    }`}>
                      {session.material ? (
                        <Sparkles className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <FileText className="w-6 h-6 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          session.material
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}>
                          {session.material ? "Material gerado" : "Pendente"}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          {session.source_type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(session.created_at).toLocaleDateString("pt-BR")}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}