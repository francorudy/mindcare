"use client";

import Link from "next/link";

type AuthRequiredModalProps = {
  open: boolean;
  onClose?: () => void;
  title?: string;
  message?: string;
};

export function AuthRequiredModal({
  open,
  onClose,
  title = "Inicio de sesión requerido",
  message = "Debes iniciar sesión antes de realizar la evaluación. Tus respuestas se guardarán de forma segura asociadas a tu cuenta.",
}: AuthRequiredModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-required-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-[0_24px_60px_rgba(2,6,23,0.18)]">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 flex-none place-items-center rounded-2xl bg-amber-100 text-amber-700 ring-1 ring-amber-200">
            <IconWarning className="h-5 w-5" />
          </div>
          <div>
            <h2 id="auth-required-title" className="text-sm font-semibold text-slate-900">
              {title}
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-600">{message}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
          )}
          <Link
            href="/login"
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(124,58,237,0.25)] transition hover:bg-violet-700"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

function IconWarning({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 3 2.7 19.5A1.6 1.6 0 0 0 4.1 22h15.8a1.6 1.6 0 0 0 1.4-2.5L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
