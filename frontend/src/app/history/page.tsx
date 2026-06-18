"use client";

import Link from "next/link";
import { evaluacionApi } from "@/lib/api";
import { useAuthSession } from "@/contexts/auth-session";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { PageShell } from "@/components/page-shell";
import { RiskBadge, formatFecha, formatProbabilidad } from "@/components/risk-badge";

export default function HistoryPage() {
  const { session } = useAuthSession();
  const { data: items, loading, error } = useAuthenticatedFetch(
    (token) => evaluacionApi.historial(token),
    { cacheKey: (token) => `historial:${token}` },
  );

  return (
    <PageShell>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {session && (
              <div className="flex items-start gap-4 rounded-xl border border-violet-200/30 bg-white/15 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.03)] backdrop-blur-md">
                <span
                  aria-hidden="true"
                  className={[
                    "mt-1 grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg text-lg",
                    session.role === "student"
                      ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                      : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
                  ].join(" ")}
                >
                  {session.role === "student" ? "👨‍🎓" : "👨‍⚕️"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-slate-900">{session.name}</p>
                  <p className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                    🎓 Rol: {session.role === "student" ? "Estudiante" : "Consejero"}
                  </p>
                </div>
              </div>
            )}
            <Link
              href="/"
              prefetch
              className="inline-flex items-center justify-center rounded-lg border border-violet-200/50 bg-white/20 px-3 py-2 text-xs font-semibold text-slate-700 shadow-[0_10px_22px_rgba(124,58,237,0.10)] transition hover:bg-white/30 backdrop-blur-sm"
            >
              ← Volver al inicio
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Historial de evaluaciones
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Consulta todas tus evaluaciones previas y su nivel de riesgo.
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200/70 bg-white/85 shadow-[0_18px_44px_rgba(2,6,23,0.10)] backdrop-blur">
          {error && (
            <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <p className="px-5 py-8 text-sm text-slate-500">Cargando historial...</p>
          ) : !items || items.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-600">Aún no tienes evaluaciones registradas.</p>
              <Link
                href="/evaluation"
                prefetch
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Realizar mi primera evaluación
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3 text-left">Fecha</th>
                      <th className="px-5 py-3 text-left">Nivel de riesgo</th>
                      <th className="px-5 py-3 text-left">Confianza ML</th>
                      <th className="px-5 py-3 text-left">PHQ-9</th>
                      <th className="px-5 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {items.map((item) => (
                      <tr
                        key={item.id_evaluacion}
                        className="border-b border-slate-100 transition hover:bg-violet-50/40"
                      >
                        <td className="px-5 py-4 text-slate-700">
                          {formatFecha(item.fecha_evaluacion)}
                        </td>
                        <td className="px-5 py-4">
                          {item.tiene_resultado ? (
                            <RiskBadge level={item.nombre_nivel} />
                          ) : (
                            <span className="text-xs text-slate-400">Sin procesar</span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {formatProbabilidad(item.probabilidad)}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {item.puntaje_phq9 !== null ? `${item.puntaje_phq9}/27` : "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/history/${item.id_evaluacion}`}
                            prefetch
                            className="inline-flex items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 md:hidden">
                {items.map((item) => (
                  <article
                    key={item.id_evaluacion}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(2,6,23,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">{formatFecha(item.fecha_evaluacion)}</p>
                        <div className="mt-2">
                          {item.tiene_resultado ? (
                            <RiskBadge level={item.nombre_nivel} />
                          ) : (
                            <span className="text-xs text-slate-400">Sin procesar</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-indigo-700">
                        {formatProbabilidad(item.probabilidad)}
                      </p>
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      PHQ-9: {item.puntaje_phq9 !== null ? `${item.puntaje_phq9}/27` : "—"}
                    </p>
                    <Link
                      href={`/history/${item.id_evaluacion}`}
                      prefetch
                      className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                    >
                      Ver detalle
                    </Link>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </PageShell>
  );
}
