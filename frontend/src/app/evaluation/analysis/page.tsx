"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuthSession } from "@/contexts/auth-session";
import { EvaluationErrorBanner } from "@/components/evaluation-error-banner";
import { procesamientoApi, ApiError, type ResultadoOut } from "@/lib/api";
import { getEvalId } from "@/lib/evaluation-session";
import {
  EVAL_BACK_LINK,
  EVAL_CARD,
  EVAL_CARD_PADDING,
  EVAL_CONTAINER,
  EVAL_MAIN,
  EVAL_PAGE_BG,
} from "@/lib/evaluation-layout";

const MIN_DISPLAY_MS = 3000;
const PROCESS_TIMEOUT_MS = 45_000;
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 20_000;
const COMPLETION_DISPLAY_MS = 900;
const PROGRESS_CAP = 95;

type AnalysisPhase = {
  completed: string[];
  active: string | null;
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function getAnalysisPhase(progress: number, isComplete: boolean): AnalysisPhase {
  if (isComplete) {
    return {
      completed: ["Análisis completado correctamente."],
      active: "Mostrando resultados...",
    };
  }
  if (progress >= PROGRESS_CAP) {
    return {
      completed: ["Clasificación generada."],
      active: "Preparando resultados personalizados...",
    };
  }
  if (progress >= 80) {
    return {
      completed: ["Modelo ejecutándose."],
      active: "Generando clasificación de riesgo...",
    };
  }
  if (progress >= 50) {
    return {
      completed: ["Texto emocional procesado."],
      active: "Ejecutando modelo de Machine Learning...",
    };
  }
  if (progress >= 20) {
    return {
      completed: ["Cuestionario validado."],
      active: "Procesando texto emocional...",
    };
  }
  return {
    completed: [],
    active: "Validando respuestas del cuestionario PHQ-9...",
  };
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new ApiError(0, message)), ms);
    }),
  ]);
}

async function pollForResult(
  token: string,
  idEvaluacion: number,
  signal: AbortSignal,
): Promise<ResultadoOut> {
  const deadline = Date.now() + MAX_POLL_MS;
  while (Date.now() < deadline) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      return await withTimeout(
        procesamientoApi.obtenerFresh(token, idEvaluacion, signal),
        PROCESS_TIMEOUT_MS,
        "El procesamiento tardó demasiado. Intenta de nuevo.",
      );
    } catch {
      await sleep(POLL_INTERVAL_MS, signal);
    }
  }
  throw new ApiError(
    0,
    "El procesamiento tardó demasiado. Intenta de nuevo.",
  );
}

async function runProcessing(
  token: string,
  idEvaluacion: number,
  signal: AbortSignal,
): Promise<ResultadoOut> {
  const timeoutMsg = "El procesamiento tardó demasiado. Intenta de nuevo.";
  try {
    return await withTimeout(
      procesamientoApi.procesar(token, idEvaluacion, signal),
      PROCESS_TIMEOUT_MS,
      timeoutMsg,
    );
  } catch (err) {
    if (signal.aborted) throw err;
    try {
      return await withTimeout(
        procesamientoApi.obtenerFresh(token, idEvaluacion, signal),
        PROCESS_TIMEOUT_MS,
        timeoutMsg,
      );
    } catch {
      return pollForResult(token, idEvaluacion, signal);
    }
  }
}

export default function EvaluationAnalysisPage() {
  const router = useRouter();
  const { session, isHydrated } = useAuthSession();
  const token = session?.token;

  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const runIdRef = useRef(0);
  const phase = getAnalysisPhase(progress, isComplete);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const idEvaluacion = getEvalId();
    if (!idEvaluacion) {
      router.push("/evaluation/questions");
      return;
    }

    const runId = ++runIdRef.current;
    const abort = new AbortController();
    const start = Date.now();

    const tick = window.setInterval(() => {
      if (runId !== runIdRef.current) return;
      const elapsed = Date.now() - start;
      const nextProgress = easeOutCubic(Math.min(1, elapsed / MIN_DISPLAY_MS)) * PROGRESS_CAP;
      setProgress(Math.min(PROGRESS_CAP, Math.round(nextProgress * 10) / 10));
    }, 50);

    async function execute() {
      try {
        const [resultado] = await Promise.all([
          runProcessing(token!, idEvaluacion!, abort.signal),
          new Promise<void>((resolve) => window.setTimeout(resolve, MIN_DISPLAY_MS)),
        ]);

        if (runId !== runIdRef.current) return;

        window.clearInterval(tick);
        setProgress(100);
        setIsComplete(true);

        await sleep(COMPLETION_DISPLAY_MS, abort.signal);

        if (runId !== runIdRef.current) return;

        sessionStorage.setItem("mc_resultado", JSON.stringify(resultado));
        router.replace("/evaluation/results");
      } catch (err) {
        if (runId !== runIdRef.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;

        window.clearInterval(tick);
        const msg = err instanceof ApiError ? err.message : "Error al procesar la evaluación.";
        setErrorMsg(msg);
      }
    }

    void execute();

    return () => {
      window.clearInterval(tick);
      abort.abort();
    };
  }, [isHydrated, token, retryKey, router]);

  const displayProgress = isComplete ? 100 : Math.min(PROGRESS_CAP, Math.floor(progress));

  return (
    <div className={EVAL_PAGE_BG}>
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-violet-300/35 blur-3xl" />
      <main className={EVAL_MAIN}>
        <div className={EVAL_CONTAINER}>
          <div className="mb-3">
            <Link href="/" className={EVAL_BACK_LINK}>
              Regresar al inicio
            </Link>
          </div>

          <div className={`${EVAL_CARD} ${EVAL_CARD_PADDING} text-center`}>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-violet-200 bg-violet-50 text-violet-700 shadow-[0_14px_32px_rgba(124,58,237,0.14)]">
              <IconAI className="h-8 w-8" />
            </div>

            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {errorMsg ? "Error en el análisis" : "Analizando tus respuestas..."}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              {errorMsg
                ? errorMsg
                : "Nuestro modelo de inteligencia artificial está procesando tu evaluación emocional"}
            </p>

            {errorMsg ? (
              <div className="mt-6 flex flex-col gap-3">
                <EvaluationErrorBanner
                  message={errorMsg}
                  onRetry={() => {
                    setErrorMsg(null);
                    setProgress(0);
                    setIsComplete(false);
                    setRetryKey((k) => k + 1);
                  }}
                />
                <button
                  type="button"
                  onClick={() => router.push("/evaluation/text")}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Volver al texto libre
                </button>
              </div>
            ) : (
              <>
                <div className="mt-8">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 transition-[width] duration-300 ease-out"
                      style={{ width: `${displayProgress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{isComplete ? "Completado" : "Procesando"}</span>
                    <span>{displayProgress}%</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    Este proceso puede tardar unos segundos mientras analizamos tus respuestas.
                  </p>
                </div>

                <div className="mt-6 space-y-2.5 text-left">
                  {phase.completed.map((message) => (
                    <AnalysisStatusRow key={message} status="done" message={message} />
                  ))}
                  {phase.active && (
                    <AnalysisStatusRow status="active" message={phase.active} />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function AnalysisStatusRow({
  status,
  message,
}: {
  status: "done" | "active";
  message: string;
}) {
  const isDone = status === "done";

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors duration-300",
        isDone
          ? "border-emerald-100 bg-emerald-50/60 text-slate-700"
          : "border-violet-200 bg-violet-50/70 text-slate-700",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-5 w-5 flex-none place-items-center rounded-full text-[11px]",
          isDone ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700",
        ].join(" ")}
        aria-hidden="true"
      >
        {isDone ? "✔" : "⏳"}
      </span>
      <span className={isDone ? "text-slate-600" : "font-semibold text-slate-800"}>{message}</span>
    </div>
  );
}

function IconAI(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path d="M12 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 20v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 12h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7.2 7.2 5.8 5.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18.2 18.2 16.8 16.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.8 7.2 18.2 5.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5.8 18.2 7.2 16.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7.25a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
