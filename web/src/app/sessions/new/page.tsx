"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function NewSession() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"text" | "pdf">("text");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!title.trim()) { setError("Título é obrigatório"); return; }
    if (mode === "text" && !content.trim()) { setError("Conteúdo é obrigatório"); return; }
    if (mode === "pdf" && !file) { setError("Selecione um arquivo PDF"); return; }

    setLoading(true);
    setError("");

    try {
      const session = mode === "text"
        ? await api.createSession({ title, content, source_type: "text" })
        : await api.uploadPDF(title, file!);

      router.push(`/sessions/${session.id}`);
    } catch (e) {
      setError("Erro ao criar sessão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600">← Voltar</a>
        <h1 className="text-2xl font-semibold text-gray-900 mt-4">Nova sessão</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cole um texto ou envie um PDF para gerar flashcards e resumo
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Fotossíntese, Revolução Francesa..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de entrada</label>
          <div className="flex gap-2">
            {(["text", "pdf"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-lg text-sm border transition-colors ${
                  mode === m
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {m === "text" ? "Texto" : "PDF"}
              </button>
            ))}
          </div>
        </div>

        {mode === "text" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cole aqui suas anotações, resumos ou qualquer conteúdo para estudar..."
              rows={10}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo PDF</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 file:text-sm file:bg-white hover:file:border-gray-400"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Criando sessão..." : "Criar sessão"}
        </button>
      </div>
    </main>
  );
}