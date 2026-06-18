"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthSession } from "../../../contexts/auth-session";
import { recomendacionApi, type AccionOut, ApiError } from "../../../lib/api";
import {
  COUNSELING_CONTACT,
  getRiskConfig,
  getStoredRiskLevel,
} from "../../../lib/risk-config";
import {
  getResultsDisplayConfig,
  getStoredResultsDisplayLevel,
} from "../../../lib/results-display-config";
import { RiskPrimaryAction } from "../../../components/risk-recommendations";
import {
  MotivationalQuote,
  RecommendationItemCard,
  RiskHeroCard,
} from "../../../components/evaluation-recommendations";

export default function EvaluationRecommendationsPage() {
  const { session, isHydrated } = useAuthSession();
  const [acciones, setAcciones] = useState<AccionOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const level = getStoredRiskLevel();
  const config = getRiskConfig(level);
  const displayLevel = getStoredResultsDisplayLevel();
  const displayConfig = getResultsDisplayConfig(displayLevel);

  useEffect(() => {
    if (!isHydrated) return;

    if (!session?.token) {
      setLoading(false);
      setError("Tu sesión ha expirado. Inicia sesión de nuevo.");
      return;
    }

    const idRaw = sessionStorage.getItem("mc_eval_id");
    if (!idRaw) {
      setLoading(false);
      return;
    }

    recomendacionApi
      .obtener(session.token, Number(idRaw))
      .then((data) => {
        setAcciones(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Error al cargar recomendaciones.");
        setLoading(false);
      });
  }, [session, isHydrated]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-100 via-violet-100 to-fuchsia-100">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-violet-300/35 blur-3xl" />
      <main className="mx-auto flex min-h-screen w-full items-start justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <div className="mb-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-violet-200 bg-white/80 px-3 py-2 text-xs font-semibold text-violet-700 shadow-[0_10px_22px_rgba(124,58,237,0.16)] transition hover:bg-white"
            >
              Regresar al inicio
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/85 shadow-[0_18px_44px_rgba(2,6,23,0.10)] backdrop-blur">
            <div className="px-6 pb-4 pt-7 text-center sm:px-8 sm:pt-9">
              <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_12px_28px_rgba(124,58,237,0.30)]">
                <IconLeaf className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Recomendaciones personalizadas
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Acciones diseñadas para apoyar tu bienestar emocional
              </p>
            </div>

            <div className="space-y-5 px-6 pb-6 sm:px-8">
              <RiskHeroCard config={displayConfig} />

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Acciones sugeridas para ti
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {config.recommendations.map((rec, idx) => (
                    <RecommendationItemCard
                      key={rec.title}
                      title={rec.title}
                      description={rec.description}
                      index={idx}
                    />
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400 [animation-delay:300ms]" />
                  <p className="ml-2 text-sm text-slate-500">Cargando recursos adicionales...</p>
                </div>
              ) : error ? (
                <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-center text-sm text-rose-600">
                  {error}
                </p>
              ) : acciones.length > 0 ? (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Recursos adicionales
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {acciones.map((accion, idx) => (
                      <RecommendationItemCard
                        key={accion.id_accion_recomendada}
                        title={accion.nombre_accion ?? "Acción recomendada"}
                        description={accion.descripcion ?? ""}
                        subtitle={accion.descripcion_personalizada}
                        resources={accion.recursos}
                        index={idx + config.recommendations.length}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {config.showCriticalAlert && (
                <section className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-500 to-red-600 p-6 text-center shadow-[0_18px_44px_rgba(239,68,68,0.28)]">
                  <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white">
                    <IconAlert className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-white">¿Necesitas hablar con alguien ahora?</p>
                  <p className="mt-1 text-xs text-white/90">
                    Nuestro equipo de consejería está disponible para ayudarte de inmediato
                  </p>
                  <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
                    <a
                      href={COUNSELING_CONTACT.mailto}
                      className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-rose-700 shadow-lg transition hover:bg-white/95"
                    >
                      Contactar consejería
                    </a>
                    <a
                      href={COUNSELING_CONTACT.tel}
                      className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
                    >
                      {COUNSELING_CONTACT.crisisLine}
                    </a>
                  </div>
                </section>
              )}

              <MotivationalQuote level={displayLevel} />
            </div>

            <div className="border-t border-slate-100 px-6 pb-6 pt-4 sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/evaluation/results"
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Ver resultados
                </Link>
                {config.showCriticalAlert ? (
                  <RiskPrimaryAction config={config} external />
                ) : (
                  <Link
                    href="/"
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(124,58,237,0.28)] transition hover:brightness-105"
                  >
                    Finalizar
                  </Link>
                )}
              </div>
              <p className="mt-4 text-center text-[11px] text-slate-500">
                Puedes volver a realizar esta evaluación cuando lo necesites
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function IconLeaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21c-4-3-7-7-7-11a7 7 0 0 1 14 0c0 4-3 8-7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 21V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3 2.7 19.5A1.6 1.6 0 0 0 4.1 22h15.8a1.6 1.6 0 0 0 1.4-2.5L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
