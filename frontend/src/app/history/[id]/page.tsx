"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { evaluacionApi } from "@/lib/api";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { PageShell } from "@/components/page-shell";
import {
  RiskBadge,
  formatFecha,
  formatProbabilidad,
  riskSurfaceClass,
} from "@/components/risk-badge";

const FREQ = ["Nunca", "Varios días", "Más de la mitad de los días", "Casi todos los días"];

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data, loading, error } = useAuthenticatedFetch(
    (token) => evaluacionApi.detalle(token, id),
    {
      deps: [id],
      cacheKey: (token) => `detalle:${token}:${id}`,
    },
  );

  const resultado = data?.resultado;
  const puntaje = data?.puntaje_phq9 ?? data?.respuestas_phq9.reduce((acc, r) => acc + (r.valor ?? 0), 0) ?? 0;

  return (
    <PageShell>
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link
            href="/history"
            prefetch
            className="inline-flex items-center justify-center rounded-lg border border-violet-200 bg-white/80 px-3 py-2 text-xs font-semibold text-violet-700 shadow-[0_10px_22px_rgba(124,58,237,0.16)] transition hover:bg-white"
          >
            ← Volver al historial
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Cargando detalle...</p>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : data ? (
          <div className="space-y-4">
            <header>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Detalle de evaluación
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {formatFecha(data.evaluacion.fecha_evaluacion)}
              </p>
            </header>

            {resultado ? (
              <article
                className={[
                  "rounded-2xl border p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]",
                  riskSurfaceClass(resultado.nombre_nivel),
                ].join(" ")}
              >
                <h2 className="text-sm font-semibold text-slate-900">Resultado</h2>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <RiskBadge level={resultado.nombre_nivel} />
                  <span className="text-sm text-slate-700">
                    PHQ-9: <strong>{puntaje}/27</strong>
                  </span>
                  <span className="text-sm text-slate-700">
                    Confianza: <strong>{formatProbabilidad(resultado.probabilidad)}</strong>
                  </span>
                </div>
                {resultado.recomendaciones && (
                  <p className="mt-3 border-t border-black/5 pt-3 text-sm leading-6 text-slate-700">
                    {resultado.recomendaciones}
                  </p>
                )}
              </article>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Esta evaluación aún no tiene resultado procesado.
              </div>
            )}

            {data.respuestas_phq9.length > 0 && (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
                <h2 className="text-sm font-semibold text-slate-900">Respuestas PHQ-9</h2>
                <div className="mt-3 space-y-2">
                  {data.respuestas_phq9.map((r) => (
                    <PHQ9Row key={r.id_respuesta} respuesta={r} />
                  ))}
                </div>
              </article>
            )}

            {data.texto_libre?.texto_usuario && (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
                <h2 className="text-sm font-semibold text-slate-900">Texto libre</h2>
                <p className="mt-3 text-sm italic leading-7 text-slate-700">
                  &ldquo;{data.texto_libre.texto_usuario}&rdquo;
                </p>
              </article>
            )}

            {data.acciones.length > 0 && (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
                <h2 className="text-sm font-semibold text-slate-900">Recomendaciones</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {data.acciones.map((a) => (
                    <div
                      key={a.id_accion_recomendada}
                      className="rounded-xl border border-violet-100 bg-violet-50/70 p-3"
                    >
                      <p className="text-xs font-semibold text-violet-900">{a.nombre_accion}</p>
                      {a.descripcion && (
                        <p className="mt-1 text-[11px] leading-5 text-slate-600">{a.descripcion}</p>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            )}
          </div>
        ) : null}
      </main>
    </PageShell>
  );
}

function PHQ9Row({
  respuesta,
}: {
  respuesta: { pregunta_numero: number; texto_pregunta: string | null; valor: number | null };
}) {
  const score = (respuesta.valor ?? 0) as 0 | 1 | 2 | 3;
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div>
        <p className="text-xs font-semibold text-slate-800">
          {respuesta.pregunta_numero}. {respuesta.texto_pregunta}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500">{FREQ[score]}</p>
      </div>
      <span className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
        {score}
      </span>
    </div>
  );
}
