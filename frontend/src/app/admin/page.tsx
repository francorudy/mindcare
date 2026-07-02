"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthSession } from "@/contexts/auth-session";
import { AccessDeniedBanner } from "@/components/access-denied-banner";
import { adminApi, type DashboardResumenOut, type EstudianteRiesgoOut, ApiError } from "@/lib/api";
import { CounselorProfileCard } from "@/components/counselor-profile-card";
import {
  CounselorNotificationBell,
  CriticalAlertModal,
  useCounselorAlerts,
} from "@/components/counselor-alerts";
import { PageShell } from "@/components/page-shell";
import { RiskBadge, formatFecha, formatProbabilidad, normalizeDisplayRisk } from "@/components/risk-badge";
import { setAccessDeniedMessage, STUDENT_HOME } from "@/lib/roles";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";

type Filter = "Todos" | "Alto" | "Moderado" | "Bajo";

type DashboardData = {
  resumen: DashboardResumenOut;
  estudiantes: EstudianteRiesgoOut[];
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { session } = useAuthSession();
  const [filter, setFilter] = useState<Filter>("Todos");

  const { data, loading, error } = useAuthenticatedFetch<DashboardData>(async (token) => {
    try {
      const [resumen, estudiantes] = await Promise.all([
        adminApi.resumen(token),
        adminApi.listarEstudiantes(token),
      ]);
      return { resumen, estudiantes };
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setAccessDeniedMessage(err.message);
        router.replace(STUDENT_HOME);
      }
      throw err;
    }
  });

  const resumen = data?.resumen ?? null;
  const estudiantes = (data?.estudiantes ?? []).filter(
    (e) => e.nombre_nivel && e.probabilidad != null && e.probabilidad !== "",
  );

  const filtered =
    filter === "Todos"
      ? estudiantes
      : estudiantes.filter((e) => normalizeDisplayRisk(e.nombre_nivel) === filter);

  const {
    alertas,
    pendientes,
    popupAlert,
    setPopupAlert,
    marcarRevisado,
    marking,
  } = useCounselorAlerts({ token: session?.token });

  if (!session) return null;

  return (
    <PageShell>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CounselorProfileCard name={session.name} />
            <div className="flex items-center gap-2">
              <CounselorNotificationBell
                pendientes={pendientes}
                alertas={alertas}
                onMarkReviewed={marcarRevisado}
                marking={marking}
              />
              <Link
                href="/"
                prefetch
                className="inline-flex items-center justify-center rounded-lg border border-violet-200/50 bg-white/20 px-3 py-2 text-xs font-semibold text-slate-700 shadow-[0_10px_22px_rgba(124,58,237,0.10)] transition hover:bg-white/30 backdrop-blur-sm"
              >
                ← Ir al inicio
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
              Consejería
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Panel de monitoreo
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Revisa los casos de estudiantes evaluados y su nivel de riesgo.
            </p>
          </div>
        </div>
        <AccessDeniedBanner />
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard title="Total" value={resumen?.total ?? 0} loading={loading} />
          <SummaryCard title="Riesgo Alto" value={resumen?.riesgo_alto ?? 0} tone="rose" loading={loading} />
          <SummaryCard title="Moderado" value={resumen?.moderado ?? 0} tone="amber" loading={loading} />
          <SummaryCard title="Riesgo Bajo" value={resumen?.riesgo_bajo ?? 0} tone="emerald" loading={loading} />
          <SummaryCard title="Nuevos" value={resumen?.nuevos ?? 0} tone="violet" loading={loading} />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(2,6,23,0.08)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Estudiantes evaluados</h2>
            <div className="flex flex-wrap items-center gap-2">
              {(["Todos", "Alto", "Moderado", "Bajo"] as Filter[]).map((f) => (
                <FilterPill key={f} active={filter === f} onClick={() => setFilter(f)}>
                  {f}
                </FilterPill>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <p className="px-5 py-6 text-sm text-slate-500">Cargando estudiantes...</p>
            ) : filtered.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">No hay registros para mostrar.</p>
            ) : (
              <table className="w-full min-w-[820px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 text-left">Estudiante</th>
                    <th className="px-5 py-3 text-left">Fecha</th>
                    <th className="px-5 py-3 text-left">Nivel</th>
                    <th className="px-5 py-3 text-left">Probabilidad</th>
                    <th className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {filtered.map((e) => (
                    <tr key={e.id_usuario} className="border-t border-slate-200/70 hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">
                          {e.nombres} {e.apellidos}
                        </p>
                        <p className="text-slate-500">{e.email}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {formatFecha(e.fecha_evaluacion)}
                      </td>
                      <td className="px-5 py-3">
                        {e.nombre_nivel ? (
                          <RiskBadge level={e.nombre_nivel} />
                        ) : (
                          <span className="text-slate-400">Sin evaluar</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {formatProbabilidad(e.probabilidad)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/case/${e.id_usuario}`}
                          prefetch
                          className="inline-flex items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                        >
                          Ver caso
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {popupAlert && (
        <CriticalAlertModal
          alert={popupAlert}
          onClose={() => setPopupAlert(null)}
          onMarkReviewed={() => marcarRevisado(popupAlert.id_alerta)}
          marking={marking}
        />
      )}
    </PageShell>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1 text-[11px] font-semibold transition",
        active
          ? "bg-violet-600 text-white shadow-[0_10px_22px_rgba(124,58,237,0.20)]"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SummaryCard({
  title,
  value,
  tone = "slate",
  loading,
}: {
  title: string;
  value: number;
  tone?: "slate" | "rose" | "amber" | "emerald" | "violet";
  loading: boolean;
}) {
  const tones = {
    slate: "border-slate-200 text-slate-900",
    rose: "border-rose-200 text-rose-600",
    amber: "border-amber-200 text-amber-600",
    emerald: "border-emerald-200 text-emerald-600",
    violet: "border-violet-200 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-transparent",
  };

  return (
    <div
      className={[
        "rounded-2xl border bg-white p-4 shadow-[0_18px_44px_rgba(2,6,23,0.08)]",
        tones[tone],
      ].join(" ")}
    >
      <p className={tone === "violet" ? "text-white/80 text-[11px] font-semibold" : "text-[11px] font-semibold text-slate-500"}>
        {title}
      </p>
      <p className="mt-1 text-xl font-semibold">{loading ? "..." : value}</p>
    </div>
  );
}
