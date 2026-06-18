"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ResultadoOut } from "../../../lib/api";
import { procesamientoApi, ApiError } from "../../../lib/api";
import { useAuthSession } from "../../../contexts/auth-session";
import { PageShell } from "../../../components/page-shell";
import {
  getResultsDisplayConfig,
  toResultsDisplayLevel,
} from "../../../lib/results-display-config";
import {
  EVAL_BACK_LINK,
  EVAL_CARD,
  EVAL_CARD_PADDING,
  EVAL_CONTAINER,
  EVAL_MAIN,
  EVAL_PAGE_BG,
} from "../../../lib/evaluation-layout";
import {
  PriorityAlertCard,
  RecommendationCard,
  ResultCard,
} from "../../../components/evaluation-results";

function readStoredResultado(): ResultadoOut | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("mc_resultado");
    return raw ? (JSON.parse(raw) as ResultadoOut) : null;
  } catch {
    return null;
  }
}

export default function EvaluationResultsPage() {
  const { session, isHydrated } = useAuthSession();
  const [resultado, setResultado] = useState<ResultadoOut | null>(readStoredResultado);
  const [loading, setLoading] = useState(() => !readStoredResultado());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (resultado) {
      setLoading(false);
      return;
    }

    const idRaw = sessionStorage.getItem("mc_eval_id");
    const authToken = session?.token;
    if (!authToken || !idRaw) {
      setLoading(false);
      if (!authToken) {
        setError("Tu sesión ha expirado. Inicia sesión de nuevo.");
      }
      return;
    }

    procesamientoApi
      .obtener(authToken, Number(idRaw))
      .then((data) => {
        setResultado(data);
        sessionStorage.setItem("mc_resultado", JSON.stringify(data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "No se pudieron cargar los resultados.");
        setLoading(false);
      });
  }, [isHydrated, session?.token, resultado]);

  const level = toResultsDisplayLevel(resultado?.nombre_nivel);
  const config = getResultsDisplayConfig(level);
  const prob = resultado ? Math.round(parseFloat(resultado.probabilidad ?? "0") * 100) : 0;

  return (
    <PageShell>
      <main className={EVAL_MAIN}>
        <div className={EVAL_CONTAINER}>
          <div className="mb-3">
            <Link href="/" className={EVAL_BACK_LINK}>
              Regresar al inicio
            </Link>
          </div>

          <div className={EVAL_CARD}>
            <div className={`${EVAL_CARD_PADDING} pb-4 text-center`}>
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <IconCheck className="h-5 w-5" />
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Evaluación completada
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Hemos analizado tus respuestas. Aquí están los resultados.
              </p>
            </div>

            <div className="space-y-5 px-6 pb-8 sm:px-8">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
                  Cargando resultados...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
                  {error}
                </div>
              ) : resultado ? (
                <>
                  <ResultCard
                    config={config}
                    probability={prob}
                    modelLabel={resultado.modelo_utilizado ?? "ML"}
                  />

                  <RecommendationCard config={config} />

                  {config.showPriorityAlert && <PriorityAlertCard />}
                </>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
                  No hay resultados disponibles. Completa una evaluación primero.
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <StatCard value="9" label="Preguntas respondidas" />
                <StatCard value={`${prob}%`} label="Estimación de riesgo" />
                <StatCard value="PLN" label="Análisis de texto" />
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_20px_rgba(2,6,23,0.04)]">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-600">
                    <IconInfo className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">¿Qué significa esto?</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Esta evaluación se basa en herramientas validadas como el PHQ-9 combinadas
                      con análisis de procesamiento de lenguaje natural. Los resultados son
                      orientativos y deben ser complementados con una evaluación profesional.
                    </p>
                  </div>
                </div>
              </section>

              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white/70 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-white"
              >
                Ir al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-3 py-3 text-center">
      <p className="text-sm font-semibold text-indigo-700">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconInfo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M12 10.5v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
