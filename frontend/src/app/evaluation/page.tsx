"use client";

import Link from "next/link";
import { EvaluationStartButton } from "../../components/evaluation-start-button";

export default function EvaluationWelcomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-100 via-violet-100 to-fuchsia-100">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-violet-300/35 blur-3xl" />
      <main className="mx-auto flex min-h-screen w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <div className="mb-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-violet-200 bg-white/80 px-3 py-2 text-xs font-semibold text-violet-700 shadow-[0_10px_22px_rgba(124,58,237,0.16)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200/70"
            >
              Regresar al inicio
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/85 shadow-[0_18px_44px_rgba(2,6,23,0.10)] backdrop-blur">
              <div className="px-6 pb-7 pt-9 sm:px-8 sm:pb-8 sm:pt-11">
              <div className="flex flex-col items-center text-center">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_30px_rgba(37,99,235,0.25)]">
                  <IconHeart className="h-5 w-5" />
                </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Bienvenido a MindCare
              </h1>
                <p className="mt-1 text-xs text-slate-500">
                  Sistema de detección temprana de bienestar emocional
                </p>
              </div>

              <section className="mt-8 rounded-xl bg-sky-50/80 p-5 ring-1 ring-sky-100">
                <h2 className="text-sm font-semibold text-slate-800">
                  ¿Cómo funciona?
                </h2>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-slate-400" />
                    Responderás algunas preguntas sobre cómo te has sentido últimamente
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-slate-400" />
                    Compartirás tus pensamientos de forma libre (opcional)
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-slate-400" />
                    Recibirás una evaluación de tu bienestar emocional
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-slate-400" />
                    Te daremos recomendaciones personalizadas
                  </li>
                </ul>
              </section>

              <section className="mt-6 rounded-xl bg-amber-50/90 p-5 ring-1 ring-amber-100">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-600">
                    <IconWarning className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-amber-800">
                      Importante
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-800/80">
                      Esta herramienta no reemplaza una evaluación clínica profesional.
                      Si estás en crisis, contacta inmediatamente a los servicios de
                      emergencia o a la consejería universitaria.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-6 rounded-xl border border-slate-200 bg-white/70 p-5 shadow-[0_10px_20px_rgba(2,6,23,0.04)]">
                <p className="text-xs leading-5 text-slate-600">
                  Entiendo que esta es una herramienta de evaluación inicial y acepto
                  compartir mis respuestas de forma anónima para recibir orientación.
                  Mis datos serán tratados de forma confidencial.
                </p>
              </section>

              <EvaluationStartButton
                href="/evaluation/questions"
                className={[
                  "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/70",
                  "bg-violet-600 text-white shadow-[0_14px_30px_rgba(124,58,237,0.25)] hover:bg-violet-700",
                ].join(" ")}
              >
                Comenzar evaluación <span aria-hidden="true">→</span>
              </EvaluationStartButton>

              <p className="mt-3 text-center text-[11px] text-slate-500">
                Tiempo estimado: 5-7 minutos
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function IconHeart(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={props.className}
    >
      <path
        d="M12 21s-7-4.5-9.5-9A5.7 5.7 0 0 1 12 5.9 5.7 5.7 0 0 1 21.5 12C19 16.5 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWarning(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={props.className}
    >
      <path
        d="M12 3 2.7 19.5A1.6 1.6 0 0 0 4.1 22h15.8a1.6 1.6 0 0 0 1.4-2.5L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 17.5h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
