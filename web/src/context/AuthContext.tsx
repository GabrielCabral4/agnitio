"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("agnitio_token");
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  function login(newToken: string) {
    localStorage.setItem("agnitio_token", newToken);
    setToken(newToken);
    router.push("/");
  }

  function logout() {
    localStorage.removeItem("agnitio_token");
    setToken(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout, isLoading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
