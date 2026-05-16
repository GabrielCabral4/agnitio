"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/api/api";
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  Clock,
  TrendingUp,
  BookOpen,
  Brain,
  Calendar,
  Flame,
  Info
} from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface FlashCard {
  id: string;
  card_index: number;
  front: string;
  back: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review_at: string;
  last_review_at: string | null;
}

interface ReviewSession {
  id: string;
  material_id: string;
  cards_due: FlashCard[];
  total_due: number;
  stats: {
    total: number;
    due: number;
    new: number;
    mature: number;
    average_ease_factor: number;
    learned_percentage: number;
  };
}

type Rating = "again" | "hard" | "good" | "easy";

export default function ReviewPage() {
  const { isLoading, isAuthenticated } = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [infoText, setInfoText] = useState<string | null>(null);

  useEffect(() => {
    api.createReviewSession(id)
      .then((data) => {
        setSession(data);
        if (data.cards_due.length === 0) {
          setCompleted(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const currentCard = session?.cards_due[currentIndex];

  async function handleRating(rating: Rating) {
    if (!currentCard || !session) return;

    const timeSpentMs = Date.now() - startTime;

    try {
      await api.submitCardReview(id, currentCard.card_index, rating, timeSpentMs);
      setReviewedCount((prev) => prev + 1);

      // Move to next card or finish
      if (currentIndex < session.cards_due.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setStartTime(Date.now());
      } else {
        const updatedSession = await api.createReviewSession(id);
        setSession(updatedSession);
        setCompleted(true);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  }

  function getMaturityColor(interval: number): string {
    if (interval === 0) return "bg-blue-500/10 text-blue-500";
    if (interval < 2) return "bg-amber-500/10 text-amber-500";
    if (interval < 7) return "bg-orange-500/10 text-orange-500";
    if (interval < 30) return "bg-emerald-500/10 text-emerald-500";
    return "bg-purple-500/10 text-purple-500";
  }

  function getMaturityLabel(interval: number): string {
    if (interval === 0) return "Novo";
    if (interval < 2) return "Aprendendo";
    if (interval < 7) return "Jovem";
    if (interval < 30) return "Maduro";
    return "Muito Maduro";
  }

  function getEaseFactorLabel(factor: number): { label: string; color: string } {
    if (factor < 2.0) return { label: "Desafiador", color: "text-red-500" };
    if (factor < 2.5) return { label: "Equilibrado", color: "text-amber-500" };
    return { label: "Fácil", color: "text-emerald-500" };
  }


  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card h-64 animate-shimmer mb-4" />
        <div className="flex justify-center gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-12 w-24 animate-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!session || completed) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card p-12 text-center animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {session?.cards_due.length === 0
              ? "Tudo em dia! 🚀"
              : "Revisão completa!"}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {session?.cards_due.length === 0
              ? "O sistema de repetição espaçada (SRS) utiliza o algoritmo SM-2 para estimar sua curva de retenção. Como a probabilidade de lembrança ainda é alta, o algoritmo agenda a próxima revisão apenas quando você está prestes a esquecer. Isso evita o cansaço, otimiza o aprendizado e maximiza a memória de longo prazo. Você verá um alerta no seu dashboard assim que houver novos cards para revisar."
              : `Você revisou ${reviewedCount} flashcard${reviewedCount === 1 ? "" : "s"}.`}
          </p>

          {session && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-muted/50 rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <Info
                    className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-indigo-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInfoText("Quantidade total de flashcards gerados para esta sessão.");
                    }}
                  />
                </div>
                <p className="text-2xl font-bold">{session.stats.total}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Aprendidos</p>
                  <Info
                    className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-indigo-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInfoText("Percentual de cards que já foram revisados ao menos uma vez.");
                    }}
                  />
                </div>
                <p className="text-2xl font-bold text-emerald-500">{session.stats.learned_percentage}%</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Maduros</p>
                  <Info
                    className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-indigo-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInfoText("Cards com intervalo de revisão longo, indicando forte memorização.");
                    }}
                  />
                </div>
                <p className="text-2xl font-bold text-purple-500">{session.stats.mature}</p>
              </div>
                <div className="bg-muted/50 rounded-xl p-4 relative">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">Facilidade Média</p>
                    <Info
                      className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-indigo-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoText("Média de facilidade dos cards (SM-2). 2.5 é o padrão: valores acima indicam que o conteúdo é fácil de lembrar, enquanto valores abaixo indicam que é mais desafiador.");
                      }}
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-indigo-500">{session.stats.average_ease_factor}</p>
                    <span className={`text-xs font-medium ${getEaseFactorLabel(session.stats.average_ease_factor).color}`}>
                      {getEaseFactorLabel(session.stats.average_ease_factor).label}
                    </span>
                  </div>
                </div>
            </div>
          )}

          {infoText && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
              onClick={() => setInfoText(null)}
            >
              <div
                className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-scale-in p-6 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <Info className="w-6 h-6 text-indigo-500" />
                </div>
                <p className="text-muted-foreground mb-6">
                  {infoText}
                </p>
                <button
                  onClick={() => setInfoText(null)}
                  className="cursor-pointer w-full py-2 text-sm font-medium bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all"
                >
                  Entendido
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/sessions/${id}`)}
              className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
            >
              <ArrowLeft className="w-4 h-4 cursor-pointer" />
              Voltar para sessão
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex) / session.cards_due.length) * 100;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <button
          onClick={() => router.push(`/sessions/${id}`)}
          className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 cursor-pointer" />
          Voltar para sessão
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Revisão de Flashcards</h1>
              <p className="text-sm text-muted-foreground">
                {session.cards_due.length} card{session.cards_due.length === 1 ? "" : "s"} para revisar
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Progresso</p>
            <p className="text-lg font-semibold text-indigo-500">
              {currentIndex + 1} / {session.cards_due.length}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 mb-6 animate-fade-in">
        <div className="card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BookOpen className="w-3 h-3 text-blue-500" />
            <span className="text-xs text-muted-foreground">Novos</span>
          </div>
          <p className="text-lg font-bold text-blue-500">{session.stats.new}</p>
        </div>
        <div className="card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span className="text-xs text-muted-foreground">Jovens</span>
          </div>
          <p className="text-lg font-bold text-amber-500">{session.stats.total - session.stats.new - session.stats.mature}</p>
        </div>
        <div className="card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Maduros</span>
          </div>
          <p className="text-lg font-bold text-emerald-500">{session.stats.mature}</p>
        </div>
        <div className="card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="w-3 h-3 text-purple-500" />
            <span className="text-xs text-muted-foreground">Facilidade</span>
          </div>
          <p className="text-lg font-bold text-purple-500">{session.stats.average_ease_factor}</p>
        </div>
      </div>

      {/* Flashcard */}
      {currentCard && (
        <div className="card p-8 mb-6 animate-fade-in" style={{ animationDelay: `${currentIndex * 0.1}s` }}>
          {/* Card Info */}
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${getMaturityColor(currentCard.interval)}`}>
              {getMaturityLabel(currentCard.interval)}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                Intervalo: {currentCard.interval === 0 ? "-" : `${currentCard.interval}d`}
              </span>
              <span className="mx-1">•</span>
              <Brain className="w-3 h-3" />
              <span>Repetições: {currentCard.repetitions}</span>
            </div>
          </div>

          {/* Card Content */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[200px] flex flex-col items-center justify-center text-center cursor-pointer py-8"
          >
            {!isFlipped ? (
              <>
                <span className="text-xs font-medium text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full mb-4">
                  Frente
                </span>
                <p className="text-xl font-medium text-foreground">{currentCard.front}</p>
                <p className="text-sm text-muted-foreground mt-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Clique para ver a resposta
                </p>
              </>
            ) : (
              <>
                <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full mb-4">
                  Verso
                </span>
                <p className="text-lg text-muted-foreground leading-relaxed">{currentCard.back}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rating Buttons */}
      {isFlipped && (
        <div className="grid grid-cols-4 gap-3 animate-scale-in">
          <button
            onClick={() => handleRating("again")}
            className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 border-red-500/30 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500 transition-all group"
          >
            <span className="text-sm font-semibold text-red-500">Errei</span>
          </button>
          <button
            onClick={() => handleRating("hard")}
            className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500 transition-all group"
          >
            <span className="text-sm font-semibold text-amber-500">Difícil</span>
          </button>
          <button
            onClick={() => handleRating("good")}
            className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500 transition-all group"
          >
            <span className="text-sm font-semibold text-emerald-500">Bom</span>
          </button>
          <button
            onClick={() => handleRating("easy")}
            className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500 transition-all group"
          >
            <span className="text-sm font-semibold text-purple-500">Fácil</span>
          </button>
        </div>
      )}

      {/* Instructions when not flipped */}
      {!isFlipped && (
        <p className="text-center text-sm text-muted-foreground animate-fade-in">
          Leia a pergunta e tente responder mentalmente antes de virar o card
        </p>
      )}
    </div>
  );
}
