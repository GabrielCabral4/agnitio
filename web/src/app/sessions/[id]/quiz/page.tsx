"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, QuizAttempt } from "@/lib/api";

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
      <main className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-sm text-gray-400">Gerando quiz com IA...</p>
      </main>
    );
  }

  if (!attempt) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-sm text-red-500">{error || "Erro ao carregar quiz."}</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <a
          href={`/sessions/${id}`}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Voltar para a sessão
        </a>
        <div className="flex items-center justify-between mt-4">
          <h1 className="text-2xl font-semibold text-gray-900">Quiz</h1>
          {isFinished && (
            <span className="text-sm font-medium text-gray-700">
              {attempt.score}/{attempt.questions.length} acertos
            </span>
          )}
        </div>
      </div>

      {isFinished && attempt.feedback && (
        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Feedback da IA</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{attempt.feedback}</p>
        </div>
      )}

      <div className="space-y-6">
        {attempt.questions.map((q, qi) => {
          const selected = answers[qi];
          const correct = attempt.answers ? q.correct_index : null;

          return (
            <div key={qi} className="border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-900 mb-3">
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((option, oi) => {
                  let style = "border-gray-200 text-gray-700 hover:border-gray-400";

                  if (isFinished) {
                    if (oi === correct) {
                      style = "border-green-400 bg-green-50 text-green-800";
                    } else if (oi === attempt.answers?.[qi] && oi !== correct) {
                      style = "border-red-300 bg-red-50 text-red-700";
                    } else {
                      style = "border-gray-100 text-gray-400";
                    }
                  } else if (selected === oi) {
                    style = "border-gray-900 bg-gray-900 text-white";
                  }

                  return (
                    <button
                      key={oi}
                      onClick={() => selectAnswer(qi, oi)}
                      disabled={isFinished}
                      className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${style}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!isFinished && (
        <div className="mt-8">
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Enviar respostas"}
          </button>
        </div>
      )}

      {isFinished && (
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => router.push(`/sessions/${id}/quiz`)}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:border-gray-400 transition-colors"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => router.push(`/sessions/${id}`)}
            className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Voltar para sessão
          </button>
        </div>
      )}
    </main>
  );
}