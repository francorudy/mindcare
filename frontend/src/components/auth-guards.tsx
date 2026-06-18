"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthSession, type UserRole } from "../contexts/auth-session";
import {
  COUNSELOR_HOME,
  isCounselorRole,
  isStudentRole,
  setAccessDeniedMessage,
  STUDENT_HOME,
} from "../lib/roles";
import { PageLoading } from "@/components/page-loading";

function AccessDeniedScreen({
  title,
  message,
  backHref = "/",
  backLabel = "Ir al inicio",
}: {
  title: string;
  message: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-100 via-violet-100 to-fuchsia-100">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-rose-200 bg-white/90 p-6 text-center shadow-[0_18px_44px_rgba(2,6,23,0.10)]">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-700">
            <IconLock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-base font-semibold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
          <div className="mt-5 flex flex-col gap-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700"
            >
              Iniciar sesión
            </Link>
            <Link
              href={backHref}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {backLabel}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export function LoadingScreen() {
  return <PageLoading label="Verificando sesión..." />;
}

function useProtectedRoute(requiredRole?: UserRole) {
  const router = useRouter();
  const { session, isHydrated } = useAuthSession();

  useEffect(() => {
    if (!isHydrated) return;

    if (!session?.token) {
      console.log("[auth-guards] sin token tras hidratar → router.replace(/login)", {
        requiredRole,
        path: typeof window !== "undefined" ? window.location.pathname : null,
      });
      router.replace("/login");
      return;
    }

    if (requiredRole && session.role !== requiredRole) {
      if (requiredRole === "counselor") {
        setAccessDeniedMessage(
          "Acceso denegado. No tienes permiso para acceder al panel de consejería.",
        );
        router.replace(STUDENT_HOME);
      } else {
        setAccessDeniedMessage(
          "Acceso denegado. Esta sección es exclusiva para estudiantes.",
        );
        router.replace(COUNSELOR_HOME);
      }
    }
  }, [isHydrated, session, requiredRole, router]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && !session?.token) {
        console.log("[auth-guards] pageshow bfcache sin token → router.replace(/login)");
        router.replace("/login");
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [session, router]);

  const isAuthenticated = Boolean(session?.token);
  const hasRequiredRole = requiredRole ? session?.role === requiredRole : true;

  return { session, isHydrated, isAuthenticated, hasRequiredRole };
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isHydrated, isAuthenticated } = useProtectedRoute();

  if (!isHydrated) return <LoadingScreen />;
  if (!isAuthenticated) return <LoadingScreen />;
  return <>{children}</>;
}

export function RequireStudentAuth({ children }: { children: React.ReactNode }) {
  const { session, isHydrated, isAuthenticated, hasRequiredRole } =
    useProtectedRoute("student");

  if (!isHydrated) return <LoadingScreen />;
  if (!isAuthenticated) return <LoadingScreen />;
  if (!isStudentRole(session?.role)) return <LoadingScreen />;
  if (!hasRequiredRole) return <LoadingScreen />;
  return <>{children}</>;
}

export function RequireCounselorAuth({ children }: { children: React.ReactNode }) {
  const { session, isHydrated, isAuthenticated, hasRequiredRole } =
    useProtectedRoute("counselor");

  if (!isHydrated) return <LoadingScreen />;
  if (!isAuthenticated) return <LoadingScreen />;
  if (!isCounselorRole(session?.role)) return <LoadingScreen />;
  if (!hasRequiredRole) return <LoadingScreen />;
  return <>{children}</>;
}

export function CounselorOnly({
  children,
  fallback = <LoadingScreen />,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { session, isHydrated } = useAuthSession();

  if (!isHydrated) return <LoadingScreen />;
  if (!session?.token || !isCounselorRole(session.role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7.5 11V8.8a4.5 4.5 0 0 1 9 0V11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7.5 11h9A2 2 0 0 1 18.5 13v6.5A2.5 2.5 0 0 1 16 22H8a2.5 2.5 0 0 1-2.5-2.5V13A2 2 0 0 1 7.5 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
