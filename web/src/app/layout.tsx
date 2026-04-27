import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agnitio - Estudo Inteligente com IA",
  description: "Transforme seu conteúdo em flashcards, resumos e quizzes personalizados com inteligência artificial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
        <header className="sticky top-0 z-50 glass border-b border-border/50">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="font-semibold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Agnitio
                </span>
              </a>
              <nav className="flex items-center gap-2">
                <a
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  Sessões
                </a>
                <a
                  href="/sessions/new"
                  className="text-sm font-medium px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                >
                  Nova sessão
                </a>
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border/50 py-6">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              Agnitio — Estudo inteligente com IA
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}