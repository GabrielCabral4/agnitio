"use client";
import React, { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("agnitio_token");
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        login,
        logout,
        isLoading,
        setLoading: setIsLoading
      }}
    >
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
