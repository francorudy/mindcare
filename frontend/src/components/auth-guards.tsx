"use client";

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
