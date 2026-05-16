"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Session } from "@/api/api";
import { ArrowLeft, Sparkles, BookOpen, Brain, ChevronDown, RotateCcw, Info, X } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { toast } from "sonner";

export default function SessionDetail() {
  const { isLoading, isAuthenticated } = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [srsStats, setSrsStats] = useState<{
    total: number;
    due: number;
    new: number;
    mature: number;
    average_ease_factor: number;
    learned_percentage: number;
  } | null>(null);
  const [infoText, setInfoText] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    api.getSession(id)
      .then(setSession)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (session?.material) {
      api.getReviewStats(id)
        .then(setSrsStats)
        .catch((err) => console.error("Erro ao carregar stats SRS:", err));
    }
  }, [id, session?.material]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const updated = await api.generateMaterial(id, flashcardCount);
      setSession(updated);
      toast.success("Material gerado com sucesso!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar material";
      toast.error(message.includes("IA temporariamente")
        ? message
        : "Erro ao gerar material. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  function toggleFlip(index: number) {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  if (isLoading || !isAuthenticated || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
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
          className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate max-w-[200px] sm:max-w-xs md:max-w-md">{session.title}</h1>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {session.source_type}
              </span>
            </div>
          </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
              {session.material && (
                <button
                  onClick={() => router.push(`/sessions/${id}/quiz/setup`)}
                  className="flex-1 sm:flex-none items-center justify-center gap-2 cursor-pointer bg-linear-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:scale-95 active:opacity-90 transition-all"
                >
                  <Brain className="w-4 h-4" />
                  Fazer quiz
                </button>
              )}
              {session.material && (
                <button
                  onClick={() => router.push(`/sessions/${id}/review`)}
                  className="flex-1 sm:flex-none items-center justify-center gap-2 cursor-pointer bg-white border border-slate-200 text-slate-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all hover:-translate-y-0.5 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Revisar
                </button>
              )}
              {session.material && (
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("agnitio_token");
                      if (!token) {
                        toast.error("Você precisa estar autenticado para exportar");
                        return;
                      }

                      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${id}/export`, {
                        headers: {
                          "Authorization": `Bearer ${token}`
                        }
                      });

                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.detail || "Erro ao exportar PDF");
                      }

                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${session.title.replace(/\s+/g, "_").toLowerCase()}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      toast.success("Exportação iniciada!");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Erro ao exportar PDF");
                    }
                  }}
                  className="flex-1 sm:flex-none items-center justify-center gap-2 cursor-pointer bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all hover:-translate-y-0.5 shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  Exportar PDF
                </button>
              )}
            </div>
        </div>
      </div>

      {/* No Material State */}
      {!session.material && (
        <div className="card p-12 text-center border-dashed animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Pronto(a) para gerar seu material?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Gere flashcards e um resumo inteligente deste conteúdo usando IA
          </p>

          <div className="flex items-center justify-center gap-3 mb-6">
            <label htmlFor="card-count" className="text-sm font-medium text-muted-foreground">
              Quantidade de flashcards:
            </label>
            <input
              id="card-count"
              type="number"
              min="1"
              max="30"
              value={flashcardCount}
              onChange={(e) => setFlashcardCount(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
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
          {/* SRS Stats Section */}
          <section className="card p-6 animate-fade-in" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold">Estatísticas de Memorização</h2>
            </div>

            {srsStats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 border border-slate-200/50 relative group">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total de Cards</p>
                    <Info
                      className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-indigo-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoText("Quantidade total de flashcards gerados para esta sessão.");
                      }}
                    />
                  </div>
                  <p className="text-2xl font-bold">{srsStats.total}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-slate-200/50 relative group">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Pendentes</p>
                    <Info
                      className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-indigo-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoText("Cards que precisam de revisão hoje com base no algoritmo de repetição espaçada.");
                      }}
                    />
                  </div>
                  <p className="text-2xl font-bold text-amber-600">{srsStats.due}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-slate-200/50 relative group">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Erros</p>
                    <Info
                      className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-indigo-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoText("Cards que ainda não foram aprendidos de acordo com o algoritmo.");
                      }}
                    />
                  </div>
                  <p className="text-2xl font-bold text-red-500">{srsStats.new}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-slate-200/50 relative group">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Consolidados</p>
                    <Info
                      className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-indigo-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoText("Cards com intervalo de revisão superior a 21 dias, indicando forte memorização.");
                      }}
                    />
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">{srsStats.mature}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-slate-200/50 relative group">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Facilidade Média</p>
                    <Info
                      className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-indigo-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoText("Média de facilidade dos cards. Valores maiores indicam que o conteúdo é mais fácil de lembrar.");
                      }}
                    />
                  </div>
                  <p className="text-2xl font-bold text-blue-500">{srsStats.average_ease_factor}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-slate-200/50 relative group">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Progresso de Revisão</p>
                    <Info
                      className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-indigo-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoText("Percentual de cards que já foram revisados ao menos uma vez.");
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{srsStats.learned_percentage}%</p>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden ml-2">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${srsStats.learned_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground italic text-sm">
                Carregando estatísticas...
              </div>
            )}
          </section>

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
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">Flashcards</h2>
                <p className="text-xs text-muted-foreground">
                  {session.material.flashcards.length} cards • clique para revelar
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {session.material.flashcards.map((card, i) => (
                <div
                  key={i}
                  onClick={() => toggleFlip(i)}
                  className={`flip-card cursor-pointer ${flipped[i] ? 'flipped' : ''}`}
                >
                  <div className="flip-card-inner h-full">
                    {/* Front */}
                    <div className="flip-card-front card p-4 sm:p-5 min-h-[200px] sm:min-h-[220px] flex flex-col justify-center hover:border-indigo-500/30 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-full">
                          Frente
                        </span>
                      </div>
                      <p className="font-medium text-base line-clamp-4">{card.front}</p>
                      <div className="flex items-center gap-2 mt-auto pt-4 text-xs text-muted-foreground">
                        <ChevronDown className="w-4 h-4" />
                        Clique para ver a resposta
                      </div>
                    </div>
                    {/* Back */}
                    <div className="flip-card-back card p-5 min-h-[200px] sm:min-h-[220px] flex flex-col justify-center bg-linear-to-br from-indigo-500/5 to-purple-500/5 overflow-y-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                          Verso
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">{card.back}</p>
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

      {/* Info Modal */}
      {infoText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
            onClick={() => setInfoText(null)}
          />
          <div className="relative w-full max-w-md card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <Info className="w-5 h-5" />
                <span className="font-semibold">Informação</span>
              </div>
              <button
                onClick={() => setInfoText(null)}
                className="p-1 rounded-full hover:bg-slate-100 transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5 cursor-pointer" />
              </button>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {infoText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
