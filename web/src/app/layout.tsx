import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";
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
        <AuthProvider>
          <Toaster position="top-right" richColors />
          <header className="sticky top-0 z-50 glass border-b border-border/50">
            <div className="max-w-5xl mx-auto px-4 py-4">
              <Navbar />
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
        </AuthProvider>
      </body>
    </html>
  );
}
