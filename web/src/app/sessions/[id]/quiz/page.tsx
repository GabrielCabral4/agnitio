"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, QuizQuestion } from "@/lib/api";
import { ArrowLeft, Brain, CheckCircle, XCircle, Trophy, RotateCcw, ArrowRight } from "lucide-react";

interface QuizAttempt {
  id: string;
  questions: QuizQuestion[];
  answers?: number[];
  score?: number;
  feedback?: string;
  created_at: string;
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.createQuiz(id)
      .then(setAttempt)
      .catch(() => setError("Erro ao gerar quiz."))
      .finally(() => setLoading(false));
  }, [id]);

  function selectAnswer(questionIndex: number, optionIndex: number) {
    if (attempt?.answers) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  }

  async function handleSubmit() {
    if (!attempt) return;
    const total = attempt.questions.length;
    if (Object.keys(answers).length < total) {
      setError(`Responda todas as ${total} questões antes de enviar.`);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const answerArray = attempt.questions.map((_, i) => answers[i]);
      const result = await api.submitQuiz(id, attempt.id, answerArray);
      setAttempt(result);
    } catch {
      setError("Erro ao enviar respostas. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const isFinished = !!attempt?.answers;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center animate-pulse">
            <Brain className="w-8 h-8 text-indigo-500" />
          </div>
          <p className="text-muted-foreground">Gerando quiz com IA...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card p-8 text-center border-red-500/20 bg-red-500/5">
          <p className="text-red-500">{error || "Erro ao carregar quiz."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10 animate-fade-in">
        <button
          onClick={() => router.push(`/sessions/${id}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a sessão
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quiz</h1>
              <p className="text-sm text-muted-foreground">
                {attempt.questions.length} questões
              </p>
            </div>
          </div>
          {isFinished && attempt.score !== undefined && (
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-xl font-semibold ${
                (attempt.score / attempt.questions.length) >= 0.7
                  ? "bg-emerald-500/10 text-emerald-500"
                  : (attempt.score / attempt.questions.length) >= 0.5
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-red-500/10 text-red-500"
              }`}>
                {attempt.score}/{attempt.questions.length} acertos
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Score Banner */}
      {isFinished && attempt.score !== undefined && (
        <div className="card p-6 mb-8 animate-scale-in">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              (attempt.score / attempt.questions.length) >= 0.7
                ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                : (attempt.score / attempt.questions.length) >= 0.5
                ? "bg-gradient-to-br from-amber-500 to-orange-500"
                : "bg-gradient-to-br from-red-500 to-pink-500"
            }`}>
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {(attempt.score / attempt.questions.length) >= 0.7
                  ? "Excelente!"
                  : (attempt.score / attempt.questions.length) >= 0.5
                  ? "Bom trabalho!"
                  : "Continue praticando!"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Você acertou {Math.round((attempt.score / attempt.questions.length) * 100)}% das questões
              </p>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {Math.round((attempt.score / attempt.questions.length) * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* AI Feedback */}
      {isFinished && attempt.feedback && (
        <div className="card p-6 mb-8 border-indigo-500/20 bg-indigo-500/5 animate-slide-in-right">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
              <Brain className="w-4 h-4 text-indigo-500" />
            </div>
            <h2 className="text-sm font-semibold">Feedback da IA</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{attempt.feedback}</p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {attempt.questions.map((q, qi) => {
          const selected = answers[qi];
          const correct = attempt.answers ? q.correct_index : null;
          const isAnswered = selected !== undefined;

          return (
            <div
              key={qi}
              className="card p-6 animate-fade-in"
              style={{ animationDelay: `${qi * 0.05}s` }}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-semibold ${
                  isFinished
                    ? q.correct_index === selected
                      ? "bg-emerald-500 text-white"
                      : "bg-red-500 text-white"
                    : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
                }`}>
                  {qi + 1}
                </span>
                <p className="font-medium pt-0.5">{q.question}</p>
              </div>
              <div className="space-y-2">
                {q.options.map((option, oi) => {
                  let style = "border-border hover:border-indigo-500/50 text-muted-foreground";
                  let icon = null;

                  if (isFinished) {
                    if (oi === correct) {
                      style = "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400";
                      icon = <CheckCircle className="w-5 h-5 text-emerald-500" />;
                    } else if (oi === selected && oi !== correct) {
                      style = "border-red-500 bg-red-500/5 text-red-600 dark:text-red-400";
                      icon = <XCircle className="w-5 h-5 text-red-500" />;
                    } else {
                      style = "border-border/50 text-muted-foreground/50";
                    }
                  } else if (selected === oi) {
                    style = "border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400";
                  }

                  return (
                    <button
                      key={oi}
                      onClick={() => selectAnswer(qi, oi)}
                      disabled={isFinished}
                      className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-xl border-2 transition-all ${style} ${
                        !isFinished ? "cursor-pointer hover:shadow-md" : ""
                      }`}
                    >
                      <span className="text-sm">{option}</span>
                      {icon}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!isFinished && (
        <div className="mt-8 animate-fade-in">
          {error && (
            <p className="text-sm text-red-500 mb-4 text-center bg-red-500/5 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl text-base font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Enviando...
              </span>
            ) : (
              "Enviar respostas"
            )}
          </button>
        </div>
      )}

      {/* Finished Actions */}
      {isFinished && (
        <div className="mt-8 flex gap-3 animate-scale-in">
          <button
            onClick={() => {
              setAnswers({});
              api.createQuiz(id).then(setAttempt);
              setLoading(false);
            }}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-border text-muted-foreground py-4 rounded-xl text-sm font-medium hover:border-indigo-500/50 hover:text-indigo-500 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </button>
          <button
            onClick={() => router.push(`/sessions/${id}`)}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
          >
            Voltar para sessão
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}