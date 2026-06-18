"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EvaluationNextStepPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-100 via-violet-100 to-fuchsia-100">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-violet-300/35 blur-3xl" />
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full rounded-2xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_18px_44px_rgba(2,6,23,0.10)] backdrop-blur sm:p-8">
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-violet-200 bg-white/80 px-3 py-2 text-xs font-semibold text-violet-700 shadow-[0_10px_22px_rgba(124,58,237,0.16)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200/70"
            >
              Regresar al inicio
            </Link>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Siguiente paso
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Placeholder: aquí irá el siguiente paso del flujo de evaluación.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[0_10px_22px_rgba(2,6,23,0.06)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200/70"
            >
              Volver
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

