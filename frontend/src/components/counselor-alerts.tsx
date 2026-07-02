"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { adminApi, type AlertaNotificacionOut, ApiError } from "@/lib/api";
import { formatFecha, formatProbabilidad } from "@/components/risk-badge";

const POLL_INTERVAL_MS = 15_000;

type UseCounselorAlertsOptions = {
  token: string | undefined;
  enabled?: boolean;
};

export function useCounselorAlerts({ token, enabled = true }: UseCounselorAlertsOptions) {
  const [alertas, setAlertas] = useState<AlertaNotificacionOut[]>([]);
  const [pendientes, setPendientes] = useState(0);
  const [popupAlert, setPopupAlert] = useState<AlertaNotificacionOut | null>(null);
  const [marking, setMarking] = useState(false);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const initialLoadRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [lista, conteo] = await Promise.all([
        adminApi.listarAlertas(token),
        adminApi.contarAlertasPendientes(token),
      ]);
      setAlertas(lista);
      setPendientes(conteo.pendientes);

      const currentIds = new Set(lista.map((a) => a.id_alerta));
      const newAlerts = lista.filter((a) => !knownIdsRef.current.has(a.id_alerta));

      if (newAlerts.length > 0) {
        setPopupAlert(newAlerts[0]);
      } else if (initialLoadRef.current && lista.length > 0) {
        setPopupAlert(lista[0]);
      }

      knownIdsRef.current = currentIds;
      initialLoadRef.current = false;
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) return;
    }
  }, [token]);

  useEffect(() => {
    if (!token || !enabled) return;

    refresh();
    const interval = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [token, enabled, refresh]);

  const marcarRevisado = useCallback(
    async (id_alerta: number) => {
      if (!token) return;
      setMarking(true);
      try {
        await adminApi.marcarAlertaRevisada(token, id_alerta);
        setPopupAlert(null);
        await refresh();
      } finally {
        setMarking(false);
      }
    },
    [token, refresh],
  );

  return {
    alertas,
    pendientes,
    popupAlert,
    setPopupAlert,
    marcarRevisado,
    marking,
    refresh,
  };
}

type CounselorNotificationBellProps = {
  pendientes: number;
  alertas: AlertaNotificacionOut[];
  onMarkReviewed: (id_alerta: number) => void;
  marking?: boolean;
};

export function CounselorNotificationBell({
  pendientes,
  alertas,
  onMarkReviewed,
  marking = false,
}: CounselorNotificationBellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200/50 bg-white/30 text-lg shadow-[0_10px_22px_rgba(124,58,237,0.10)] backdrop-blur-sm transition hover:bg-white/50"
        aria-label={`Notificaciones${pendientes > 0 ? `, ${pendientes} pendientes` : ""}`}
      >
        🔔
        {pendientes > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {pendientes > 9 ? "9+" : pendientes}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Cerrar notificaciones"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(2,6,23,0.12)]">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Alertas de riesgo alto</p>
              <p className="text-xs text-slate-500">
                {pendientes === 0
                  ? "No hay alertas pendientes"
                  : `${pendientes} alerta${pendientes === 1 ? "" : "s"} pendiente${pendientes === 1 ? "" : "s"}`}
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {alertas.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-500">
                  Sin alertas por revisar
                </p>
              ) : (
                alertas.map((alerta) => (
                  <div
                    key={alerta.id_alerta}
                    className="border-b border-slate-100 px-4 py-3 last:border-b-0"
                  >
                    <p className="text-xs font-semibold text-rose-700">Riesgo alto detectado</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {alerta.nombres_estudiante} {alerta.apellidos_estudiante}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatFecha(alerta.fecha_evaluacion)} · PHQ-9: {alerta.puntaje_phq9} ·{" "}
                      {formatProbabilidad(alerta.probabilidad)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Link
                        href={`/admin/case/${alerta.id_estudiante}`}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-violet-700"
                      >
                        Ver caso
                      </Link>
                      <button
                        type="button"
                        disabled={marking}
                        onClick={() => onMarkReviewed(alerta.id_alerta)}
                        className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Marcar revisado
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type CriticalAlertModalProps = {
  alert: AlertaNotificacionOut;
  onClose: () => void;
  onMarkReviewed: () => void;
  marking?: boolean;
};

export function CriticalAlertModal({
  alert,
  onClose,
  onMarkReviewed,
  marking = false,
}: CriticalAlertModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="critical-alert-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white shadow-[0_24px_60px_rgba(239,68,68,0.25)]">
        <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50 to-red-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-rose-600 text-lg text-white shadow-[0_8px_20px_rgba(239,68,68,0.35)]">
              🚨
            </span>
            <div>
              <h2 id="critical-alert-title" className="text-base font-bold text-rose-900">
                Nuevo caso de riesgo alto detectado
              </h2>
              <p className="mt-1 text-xs text-rose-700/80">
                Se requiere revisión prioritaria del caso
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-6 py-5 text-sm text-slate-700">
          <AlertInfoRow label="Estudiante">
            {alert.nombres_estudiante} {alert.apellidos_estudiante}
          </AlertInfoRow>
          <AlertInfoRow label="Fecha de evaluación">
            {formatFecha(alert.fecha_evaluacion)}
          </AlertInfoRow>
          <AlertInfoRow label="Probabilidad del modelo">
            {formatProbabilidad(alert.probabilidad)}
          </AlertInfoRow>
          <AlertInfoRow label="Puntaje PHQ-9">{alert.puntaje_phq9}</AlertInfoRow>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row">
          <Link
            href={`/admin/case/${alert.id_estudiante}`}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.25)] transition hover:bg-violet-700"
          >
            Ver caso
          </Link>
          <button
            type="button"
            onClick={onMarkReviewed}
            disabled={marking}
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {marking ? "Guardando..." : "Marcar como revisado"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:text-slate-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function AlertInfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">{children}</span>
    </div>
  );
}
