"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export function Navbar() {
  const { logout, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <span className="font-semibold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Agnitio
        </span>
      </Link>
      <nav className="flex items-center gap-2">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          Sessões
        </Link>
        <Link
          href="/sessions/new"
          className="text-sm font-medium px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
        >
          Nova sessão
        </Link>
        {mounted && isAuthenticated && (
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            Sair
          </button>
        )}
      </nav>
    </div>
  );
}
