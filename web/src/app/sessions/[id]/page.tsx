"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Session } from "@/lib/api";

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
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-sm text-gray-400">Carregando sessão...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-sm text-red-500">Sessão não encontrada.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600">← Voltar</a>
        <div className="flex items-start justify-between mt-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{session.title}</h1>
            <span className="text-xs text-gray-400 uppercase">{session.source_type}</span>
          </div>
          {session.material && (
            <button
              onClick={() => router.push(`/sessions/${id}/quiz`)}
              className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fazer quiz
            </button>
          )}
        </div>
      </div>

      {!session.material && (
        <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Material ainda não gerado para esta sessão
          </p>
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gray-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {generating ? "Gerando com IA..." : "Gerar flashcards e resumo"}
          </button>
        </div>
      )}

      {session.material && (
        <div className="space-y-10">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Resumo</h2>
            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
              {session.material.summary}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Flashcards
              <span className="ml-2 text-xs font-normal text-gray-400">
                clique para revelar
              </span>
            </h2>
            <div className="space-y-3">
              {session.material.flashcards.map((card, i) => (
                <div
                  key={i}
                  onClick={() => toggleFlip(i)}
                  className="border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{card.front}</p>
                  {flipped[i] && (
                    <p className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
                      {card.back}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}