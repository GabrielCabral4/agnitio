"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Session } from "@/lib/api";
import { ArrowLeft, Sparkles, BookOpen, Brain, ChevronDown, RotateCcw } from "lucide-react";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    api.getSession(id)
      .then(setSession)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const updated = await api.generateMaterial(id);
      setSession(updated);
    } catch {
      setError("Erro ao gerar material. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  function toggleFlip(index: number) {
    console.log("Flipping card:", index, "current state:", flipped[index]);
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="card h-12 w-32 animate-shimmer mb-8" />
        <div className="space-y-4">
          <div className="card h-32 animate-shimmer" />
          <div className="card h-32 animate-shimmer" style={{ animationDelay: "0.2s" }} />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="card p-8 text-center border-red-500/20 bg-red-500/5">
          <p className="text-red-500">Sessão não encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10 animate-fade-in">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{session.title}</h1>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {session.source_type}
              </span>
            </div>
          </div>
          {session.material && (
            <button
              onClick={() => router.push(`/sessions/${id}/quiz`)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
            >
              <Brain className="w-4 h-4" />
              Fazer quiz
            </button>
          )}
        </div>
      </div>

      {/* No Material State */}
      {!session.material && (
        <div className="card p-12 text-center border-dashed animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Material não gerado</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Gere flashcards e um resumo inteligente deste conteúdo usando nossa IA
          </p>
          {error && (
            <p className="text-sm text-red-500 mb-4 bg-red-500/5 px-4 py-2 rounded-lg inline-block">
              {error}
            </p>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Gerando com IA...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Gerar flashcards e resumo
              </>
            )}
          </button>
        </div>
      )}

      {/* Material Content */}
      {session.material && (
        <div className="space-y-10">
          {/* Summary Section */}
          <section className="card p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold">Resumo</h2>
            </div>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-xl p-5">
              {session.material.summary}
            </div>
          </section>

          {/* Flashcards Section */}
          <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Flashcards</h2>
                <p className="text-xs text-muted-foreground">
                  {session.material.flashcards.length} cards • clique para revelar
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {session.material.flashcards.map((card, i) => (
                <div
                  key={i}
                  onClick={() => toggleFlip(i)}
                  className={`flip-card h-40 cursor-pointer ${flipped[i] ? 'flipped' : ''}`}
                >
                  <div className="flip-card-inner h-full">
                    {/* Front */}
                    <div className="flip-card-front card p-5 h-full flex flex-col justify-center hover:border-indigo-500/30 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-full">
                          Frente
                        </span>
                      </div>
                      <p className="font-medium text-base">{card.front}</p>
                      <div className="flex items-center gap-2 mt-auto pt-4 text-xs text-muted-foreground">
                        <ChevronDown className="w-4 h-4" />
                        Clique para ver a resposta
                      </div>
                    </div>
                    {/* Back */}
                    <div className="flip-card-back card p-5 h-full flex flex-col justify-center bg-linear-to-br from-indigo-500/5 to-purple-500/5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                          Verso
                        </span>
                      </div>
                      <p className="text-muted-foreground">{card.back}</p>
                      <div className="flex items-center gap-1 mt-auto pt-4 text-xs text-indigo-500">
                        <RotateCcw className="w-3 h-3" />
                        Ocultar resposta
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}