"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthSession } from "../contexts/auth-session";
import { EvaluationStartButton } from "../components/evaluation-start-button";
import { isCounselorRole } from "../lib/roles";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-100 via-violet-100 to-fuchsia-100">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-violet-300/35 blur-3xl" />
      
      <Header />

      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-6xl flex-col items-center justify-center px-4 py-3 sm:px-6 lg:px-8">
        <Hero />
        <Footer />
      </main>
    </div>
  );
}

function Header() {
  const router = useRouter();
  const { session, isHydrated, clearSession } = useAuthSession();

  function onLogout() {
    clearSession();
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-black/5 to-transparent backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-600 text-white shadow-[0_8px_18px_rgba(124,58,237,0.35)]">
            <IconHeart className="h-5 w-5" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            Sistema de Bienestar
          </span>
        </div>

        {!isHydrated ? null : session ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 rounded-xl border border-violet-200/30 bg-white/15 px-4 py-2.5 text-slate-700 shadow-[0_8px_18px_rgba(2,6,23,0.03)] backdrop-blur-md">
              <span
                aria-hidden="true"
                className={[
                  "grid h-10 w-10 place-items-center rounded-lg text-base",
                  session.role === "student"
                    ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                    : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
                ].join(" ")}
              >
                {session.role === "student" ? "👨‍🎓" : "👨‍⚕️"}
              </span>
              <span className="min-w-0">
                <span className="block max-w-xs truncate text-sm font-bold text-slate-900">
                  {session.name}
                </span>
                <span
                  className={[
                    "mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
                    session.role === "student"
                      ? "bg-blue-50 text-blue-700 ring-blue-200"
                      : "bg-emerald-50 text-emerald-700 ring-emerald-200",
                  ].join(" ")}
                >
                  {session.role === "student" ? "Estudiante" : "Consejero"}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(124,58,237,0.30)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            prefetch
            className="inline-flex items-center justify-center rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(124,58,237,0.35)] transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </header>
  );
}

function Hero() {
  const { session } = useAuthSession();

  return (
    <section className="mx-auto max-w-4xl text-center">
      <h1 className="text-balance text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-[1.15]">
        Tu bienestar es nuestra{" "}
        <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
          prioridad
        </span>
      </h1>

      <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg leading-8 text-slate-600 sm:text-xl">
        Sistema inteligente de detección temprana y apoyo en salud mental para la comunidad estudiantil.
      </p>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <EvaluationStartButton
          href="/evaluation"
          leadingIcon={<IconPlay />}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-[0_20px_40px_rgba(124,58,237,0.40)] transition hover:shadow-[0_24px_48px_rgba(124,58,237,0.45)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:w-auto"
        >
          Comenzar evaluación
        </EvaluationStartButton>
        {session?.role === "student" ? (
          <SecondaryButton href="/history">Ver historial</SecondaryButton>
        ) : isCounselorRole(session?.role) ? (
          <SecondaryButton href="/admin">Panel de consejería</SecondaryButton>
        ) : (
          <SecondaryButton href="/login">Iniciar sesión</SecondaryButton>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-6">
        <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-500">
          Evaluación basada en PHQ-9, análisis mediante inteligencia artificial y recomendaciones personalizadas.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-500 sm:flex-row sm:gap-6">
          <span className="inline-flex items-center gap-2">
            <span>🛡️</span>
            <span>Evaluaciones confidenciales</span>
          </span>
          <span className="hidden text-slate-300 sm:inline">•</span>
          <span className="inline-flex items-center gap-2">
            <span>🤖</span>
            <span>IA y PLN</span>
          </span>
          <span className="hidden text-slate-300 sm:inline">•</span>
          <span className="inline-flex items-center gap-2">
            <span>👨‍⚕️</span>
            <span>Orientación profesional</span>
          </span>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return null;
}

function SecondaryButton(props: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={props.href}
      prefetch
      className={[
        "inline-flex w-full items-center justify-center gap-2 rounded-xl border px-8 py-4 text-base font-semibold backdrop-blur transition",
        "border-violet-200 bg-white/80 text-violet-700 shadow-[0_16px_32px_rgba(124,58,237,0.15)]",
        "hover:bg-white hover:shadow-[0_20px_40px_rgba(124,58,237,0.20)] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 sm:w-auto",
      ].join(" ")}
    >
      <IconLogin className="h-5 w-5" />
      {props.children}
    </Link>
  );
}

function IconHeart(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={props.className}
    >
      <path
        d="M12 21s-7-4.5-9.5-9A5.7 5.7 0 0 1 12 5.9 5.7 5.7 0 0 1 21.5 12C19 16.5 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M9 7.5v9l8-4.5-8-4.5Z"
        fill="currentColor"
        opacity="0.95"
      />
    </svg>
  );
}

function IconLogin(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path
        d="M15 3h6v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 3 10 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
