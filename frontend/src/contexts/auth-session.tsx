"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { UsuarioOut } from "../lib/api";
import { setUnauthorizedHandler } from "../lib/api";
import { clearEvaluationSession } from "../lib/evaluation-session";

export type UserRole = "student" | "counselor";

export type AuthSession = {
  id_usuario: number;
  name: string;
  email: string;
  role: UserRole;
  token: string;
};

type AuthSessionContextValue = {
  session: AuthSession | null;
  isHydrated: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
};

const STORAGE_KEY = "triaje.auth.session";
export const REGISTER_PREFILL_KEY = "triaje.auth.register.prefill";

export function clearAllClientSession() {
  if (typeof window === "undefined") return;
  console.log("[auth-session] clearAllClientSession()");
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(REGISTER_PREFILL_KEY);
  clearEvaluationSession();
}

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(undefined);

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AuthSession;
    const token = parsed?.token?.trim();
    if (
      parsed?.name &&
      parsed?.email &&
      token &&
      (parsed.role === "student" || parsed.role === "counselor")
    ) {
      return { ...parsed, token };
    }
  } catch {
    /* ignore corrupt storage */
  }

  return null;
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredSession();
    console.log("[auth-session] hydrate", {
      hasStored: Boolean(stored),
      hasToken: Boolean(stored?.token),
      role: stored?.role ?? null,
    });
    setSessionState(stored);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      console.log("[auth-session] unauthorizedHandler → setSession(null) + clearAllClientSession + /login");
      setSessionState(null);
      clearAllClientSession();
      router.replace("/login");
    });

    return () => setUnauthorizedHandler(null);
  }, [router]);

  function setSession(next: AuthSession) {
    console.log("[auth-session] setSession", {
      id_usuario: next.id_usuario,
      role: next.role,
      hasToken: Boolean(next.token?.trim()),
    });
    setSessionState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function clearSession() {
    console.log("[auth-session] clearSession()");
    setSessionState(null);
    clearAllClientSession();
  }

  const value = useMemo(
    () => ({ session, isHydrated, setSession, clearSession }),
    [session, isHydrated],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return ctx;
}

// Helper: construye un AuthSession a partir de la respuesta del backend
export function buildSession(
  usuario: UsuarioOut,
  rol: string,
  token: string,
): AuthSession {
  return {
    id_usuario: usuario.id_usuario,
    name: `${usuario.nombres} ${usuario.apellidos}`.trim(),
    email: usuario.email,
    role: rol === "consejero" ? "counselor" : "student",
    token,
  };
}