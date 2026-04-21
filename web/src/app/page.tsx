"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Session } from "@/lib/api";

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listSessions()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Agnitio</h1>
          <p className="text-sm text-gray-500 mt-1">Suas sessões de estudo</p>
        </div>
        <Link
          href="/sessions/new"
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Nova sessão
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-gray-400">Carregando sessões...</p>
      )}

      {!loading && sessions.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Nenhuma sessão ainda</p>
          <p className="text-sm">Crie sua primeira sessão para começar</p>
        </div>
      )}

      <ul className="space-y-3">
        {sessions.map((session) => (
          <li key={session.id}>
            <Link
              href={`/sessions/${session.id}`}
              className="block p-4 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{session.title}</span>
                <span className="text-xs text-gray-400 uppercase">
                  {session.source_type}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  session.material
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {session.material ? "Material gerado" : "Pendente"}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(session.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}