"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/contexts/auth-session";
import {
  evaluacionApi,
  recomendacionApi,
  type AccionOut,
} from "@/lib/api";
import { PageShell } from "@/components/page-shell";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { RiskBadge, formatFecha, formatProbabilidad } from "@/components/risk-badge";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { session, clearSession } = useAuthSession();

  const { data: historial, loading, error } = useAuthenticatedFetch(
    (token) => evaluacionApi.historial(token),
    { cacheKey: (token) => `historial:${token}` },
  );

  const [acciones, setAcciones] = useState<AccionOut[]>([]);

  useEffect(() => {
    if (!session?.token || !historial?.length) return;

    const ultima = historial.find((item) => item.tiene_resultado);
    if (!ultima) return;

    let cancelled = false;
    recomendacionApi
      .obtener(session.token, ultima.id_evaluacion)
      .then((recs) => {
        if (!cancelled) setAcciones(recs);
      })
      .catch(() => {
        /* sin recomendaciones */
      });

    return () => {
      cancelled = true;
    };
  }, [session?.token, historial]);

  const items = historial ?? [];
  const ultima = items[0];
  const prob = ultima ? formatProbabilidad(ultima.probabilidad) : "—";

  return (
    <PageShell>

      <div className="mx-auto flex w-full max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-4 rounded-2xl border border-violet-100 bg-white/85 p-4 shadow-[0_14px_36px_rgba(2,6,23,0.08)] backdrop-blur">
            <div className="mb-4 border-b border-violet-100 pb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Panel estudiante</p>
              <h1 className="mt-1 text-base font-semibold text-slate-900">Bienestar emocional</h1>
              {session && <p className="mt-1 truncate text-xs text-slate-500">{session.name}</p>}
            </div>
            <nav className="space-y-1.5">
              <Link href="/student/dashboard" className="flex w-full items-center rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow-[0_10px_22px_rgba(124,58,237,0.32)]">
                Inicio
              </Link>
              <Link href="/history" prefetch className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                Historial
              </Link>
              <Link href="/evaluation" prefetch className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                Nueva evaluación
              </Link>
              <button
                type="button"
                onClick={() => { clearSession(); router.replace("/"); }}
                className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-rose-50 hover:text-rose-600"
              >
                Cerrar sesión
              </button>
            </nav>
          </div>
        </aside>

        <main className="w-full">
          <div className="mb-3">
            <Link href="/" className="inline-flex items-center justify-center rounded-lg border border-violet-200 bg-white/80 px-3 py-2 text-xs font-semibold text-violet-700 shadow-[0_10px_22px_rgba(124,58,237,0.16)] transition hover:bg-white">
              Regresar al inicio
            </Link>
          </div>

          {error && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">{error}</div>
          )}

          <div className="rounded-2xl border border-violet-100 bg-white/85 p-4 shadow-[0_14px_36px_rgba(2,6,23,0.08)] backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Dashboard</p>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Último resultado emocional</h2>
                <p className="mt-1 text-sm text-slate-600">Seguimiento inteligente de tu bienestar universitario.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/history" prefetch className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(124,58,237,0.35)] transition hover:bg-violet-700">
                  Ver historial
                </Link>
                <Link href="/evaluation" prefetch className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-white px-5 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50">
                  Nueva evaluación
                </Link>
              </div>
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-slate-500">Cargando...</p>
            ) : (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard label="Nivel de riesgo" value={ultima?.nombre_nivel ?? "—"} badge={ultima?.nombre_nivel} />
                  <SummaryCard label="Confianza ML" value={prob} />
                  <SummaryCard label="Fecha de evaluación" value={formatFecha(ultima?.fecha_evaluacion)} />
                  <SummaryCard label="Total evaluaciones" value={String(items.length)} />
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900">Historial reciente</h3>
                    <Link href="/history" prefetch className="text-xs font-semibold text-violet-600 hover:text-violet-700">
                      Ver todo →
                    </Link>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-sm text-slate-500">Aún no tienes evaluaciones.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-violet-100">
                      <table className="w-full min-w-[520px] text-xs">
                        <thead className="bg-violet-50/80 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3 text-left">Fecha</th>
                            <th className="px-4 py-3 text-left">Nivel</th>
                            <th className="px-4 py-3 text-left">Confianza</th>
                            <th className="px-4 py-3 text-right">Detalle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.slice(0, 6).map((item) => (
                            <tr key={item.id_evaluacion} className="border-t border-violet-100/70">
                              <td className="px-4 py-3 text-slate-700">{formatFecha(item.fecha_evaluacion)}</td>
                              <td className="px-4 py-3"><RiskBadge level={item.nombre_nivel} /></td>
                              <td className="px-4 py-3 text-slate-700">{formatProbabilidad(item.probabilidad)}</td>
                              <td className="px-4 py-3 text-right">
                                <Link href={`/history/${item.id_evaluacion}`} prefetch className="font-semibold text-violet-600 hover:text-violet-700">
                                  Ver
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {acciones.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-base font-semibold text-slate-900">Recomendaciones personalizadas</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {acciones.slice(0, 4).map((a) => (
                        <article key={a.id_accion_recomendada} className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                          <p className="text-xs font-semibold text-violet-900">{a.nombre_accion}</p>
                          {a.descripcion && <p className="mt-1 text-xs leading-5 text-slate-600">{a.descripcion}</p>}
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </PageShell>
  );
}

function SummaryCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string | null;
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500">{label}</p>
      <div className="mt-1">
        {badge ? <RiskBadge level={badge} /> : <p className="text-sm font-semibold text-slate-900">{value}</p>}
      </div>
    </div>
  );
}
