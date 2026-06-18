"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthSession } from "@/contexts/auth-session";
import { adminApi, type RespuestaPHQ9Out, ApiError } from "@/lib/api";
import { CounselorProfileCard } from "@/components/counselor-profile-card";
import { PageShell } from "@/components/page-shell";
import {
  RiskBadge,
  formatFecha,
  formatProbabilidad,
  riskSurfaceClass,
} from "@/components/risk-badge";
import { setAccessDeniedMessage, STUDENT_HOME } from "@/lib/roles";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";

const FREQ = ["Nunca", "Varios días", "Más de la mitad de los días", "Casi todos los días"];

export default function AdminCasePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuthSession();
  const id_usuario = Number(params.id);

  const { data, loading, error, refetch } = useAuthenticatedFetch(
    (token) => adminApi.detalleCaso(token, id_usuario),
    {
      deps: [id_usuario],
      cacheKey: (token) => `admin:caso:${token}:${id_usuario}`,
    },
  );

  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleSeguimiento(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.token || !obs.trim()) return;

    setSaving(true);
    setSaved(false);
    setActionError(null);
    try {
      await adminApi.marcarSeguimiento(session.token, id_usuario, {
        observacion: obs.trim(),
        estado_seguimiento: "Seguimiento",
      });
      setObs("");
      setSaved(true);
      refetch();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setAccessDeniedMessage(err.message);
        router.replace(STUDENT_HOME);
        return;
      }
      setActionError(
        err instanceof ApiError ? err.message : "Error al guardar seguimiento.",
      );
    } finally {
      setSaving(false);
    }
  }

  const resultado = data?.resultado;
  const puntaje = data?.respuestas_phq9.reduce((acc, r) => acc + (r.valor ?? 0), 0) ?? 0;
  const seguimientos = data?.historial.filter((h) => h.es_seguimiento) ?? [];
  const otrosHistorial = data?.historial.filter((h) => !h.es_seguimiento) ?? [];

  if (!session) return null;

  return (
    <PageShell>
      <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 text-slate-900 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-4 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CounselorProfileCard name={session.name} />
            <Link
              href="/"
              prefetch
              className="inline-flex items-center justify-center rounded-lg border border-violet-200/50 bg-white/20 px-3 py-2 text-xs font-semibold text-slate-700 shadow-[0_10px_22px_rgba(124,58,237,0.10)] transition hover:bg-white/30 backdrop-blur-sm"
            >
              ← Ir al inicio
            </Link>
          </div>
          <div>
            <Link
              href="/admin"
              prefetch
              className="inline-flex items-center justify-center rounded-lg border border-violet-200 bg-white/80 px-3 py-2 text-xs font-semibold text-violet-700 shadow-[0_10px_22px_rgba(124,58,237,0.16)] transition hover:bg-white"
            >
              ← Volver al panel
            </Link>
            {data && (
              <>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                  {data.usuario.nombres} {data.usuario.apellidos}
                </h1>
                <p className="text-sm text-slate-500">{data.usuario.email}</p>
              </>
            )}
          </div>
        </div>

        {(error || actionError) && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 lg:col-span-3">
            {error ?? actionError}
          </div>
        )}

        {saved && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 lg:col-span-3">
            Seguimiento registrado correctamente.
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500 lg:col-span-3">Cargando caso...</p>
        ) : data ? (
          <>
            <section className="space-y-4 lg:col-span-2">
              <article
                className={[
                  "rounded-2xl border p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]",
                  riskSurfaceClass(resultado?.nombre_nivel),
                ].join(" ")}
              >
                <h2 className="text-sm font-semibold text-slate-900">Resumen del caso</h2>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <RiskBadge level={resultado?.nombre_nivel} />
                  <span className="text-sm text-slate-700">
                    PHQ-9: <strong>{puntaje}/27</strong>
                  </span>
                  <span className="text-sm text-slate-700">
                    Confianza: <strong>{formatProbabilidad(resultado?.probabilidad ?? null)}</strong>
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  Fecha: {formatFecha(data.ultima_evaluacion?.fecha_evaluacion ?? null)}
                </p>
                {resultado?.recomendaciones && (
                  <p className="mt-3 border-t border-black/5 pt-3 text-sm leading-6 text-slate-700">
                    {resultado.recomendaciones}
                  </p>
                )}
              </article>

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
                  <h2 className="text-sm font-semibold text-slate-900">Texto libre del estudiante</h2>
                  <p className="mt-3 text-sm italic leading-7 text-slate-700">
                    &ldquo;{data.texto_libre.texto_usuario}&rdquo;
                  </p>
                </article>
              )}

              {data.acciones.length > 0 && (
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
                  <h2 className="text-sm font-semibold text-slate-900">Recomendaciones generadas</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {data.acciones.map((a) => (
                      <div
                        key={a.id_accion_recomendada}
                        className="rounded-xl border border-blue-100 bg-blue-50/70 p-3"
                      >
                        <p className="text-xs font-semibold text-blue-900">{a.nombre_accion}</p>
                        {a.descripcion && (
                          <p className="mt-1 text-[11px] leading-5 text-blue-800">{a.descripcion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              )}
            </section>

            <aside className="space-y-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
                <h2 className="text-sm font-semibold text-slate-900">Registrar seguimiento</h2>
                <form className="mt-3 space-y-3" onSubmit={handleSeguimiento}>
                  <textarea
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    rows={4}
                    placeholder="Escribe una observación sobre el caso..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-900 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  />
                  <button
                    type="submit"
                    disabled={!obs.trim() || saving}
                    className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar seguimiento"}
                  </button>
                </form>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
                <h2 className="text-sm font-semibold text-slate-900">Historial de seguimientos</h2>
                {seguimientos.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">Sin seguimientos registrados.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {seguimientos.map((h) => (
                      <li
                        key={h.id_historial}
                        className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 text-xs"
                      >
                        <p className="font-semibold text-slate-800">
                          {formatFecha(h.fecha_registro)}
                        </p>
                        {h.nombre_consejero && (
                          <p className="mt-1 text-violet-700">
                            Consejero: {h.nombre_consejero}
                          </p>
                        )}
                        {h.observacion && (
                          <p className="mt-1 leading-5 text-slate-600">{h.observacion}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              {otrosHistorial.length > 0 && (
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
                  <h2 className="text-sm font-semibold text-slate-900">Historial del sistema</h2>
                  <ul className="mt-3 space-y-2">
                    {otrosHistorial.map((h) => (
                      <li key={h.id_historial} className="border-b border-slate-100 pb-2 text-xs last:border-0">
                        <p className="font-semibold text-slate-800">
                          {formatFecha(h.fecha_registro)}
                        </p>
                        {h.observacion && (
                          <p className="mt-0.5 text-slate-500">{h.observacion}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </article>
              )}
            </aside>
          </>
        ) : null}
      </main>
    </PageShell>
  );
}

function PHQ9Row({ respuesta }: { respuesta: RespuestaPHQ9Out }) {
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
