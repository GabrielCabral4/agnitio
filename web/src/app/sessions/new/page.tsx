"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, FileText, Upload, Sparkles, Check } from "lucide-react";

export default function NewSession() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"text" | "pdf">("text");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10 animate-fade-in">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Nova sessão</h1>
        </div>
        <p className="text-muted-foreground ml-13 pl-2">
          Cole um texto ou envie um PDF para gerar flashcards e resumo com IA
        </p>
      </div>

      <div className="space-y-6">
        {/* Title Input */}
        <div className="card p-5 animate-slide-in-right">
          <label className="block text-sm font-medium mb-2">
            Título da sessão
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Fotossíntese, Revolução Francesa..."
            className="input-modern w-full text-base"
          />
        </div>

        {/* Mode Selector */}
        <div className="card p-5 animate-slide-in-right" style={{ animationDelay: "0.1s" }}>
          <label className="block text-sm font-medium mb-3">
            Tipo de entrada
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setMode("text")}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-xl border-2 transition-all ${
                mode === "text"
                  ? "border-indigo-500 bg-indigo-500/5 text-foreground"
                  : "border-border hover:border-muted-foreground/50 text-muted-foreground"
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Texto</span>
            </button>
            <button
              onClick={() => setMode("pdf")}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-xl border-2 transition-all ${
                mode === "pdf"
                  ? "border-indigo-500 bg-indigo-500/5 text-foreground"
                  : "border-border hover:border-muted-foreground/50 text-muted-foreground"
              }`}
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">PDF</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {mode === "text" ? (
          <div className="card p-5 animate-scale-in">
            <label className="block text-sm font-medium mb-3">
              Conteúdo
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cole aqui suas anotações, resumos ou qualquer conteúdo para estudar..."
              rows={12}
              className="input-modern w-full text-base resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">
                {content.length} caracteres
              </span>
              {content.length > 500 && (
                <span className="flex items-center gap-1 text-xs text-emerald-500">
                  <Check className="w-3 h-3" />
                  Tamanho ideal
                </span>
              )}
            </div>
          </div>
        ) : (
          <div
            className="card p-8 animate-scale-in cursor-pointer hover:border-indigo-500/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-indigo-500" />
              </div>
              {file ? (
                <>
                  <p className="font-medium text-emerald-500 mb-1">
                    ✓ {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium mb-1">
                    Clique para selecionar um PDF
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ou arraste e solte aqui
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="card p-4 border-red-500/20 bg-red-500/5 animate-scale-in">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl text-base font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none animate-fade-in"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Criando sessão...
            </span>
          ) : (
            "Criar sessão"
          )}
        </button>
      </div>
    </div>
  );
}