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

const STEPS = [
  "Analizando respuestas PHQ-9...",
  "Procesando texto emocional...",
  "Aplicando modelo de Machine Learning...",
  "Generando resultado...",
];

const MIN_DISPLAY_MS = 3000;
const PROCESS_TIMEOUT_MS = 45_000;
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 20_000;

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

  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const runIdRef = useRef(0);

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
    let apiDone = false;

    const tick = window.setInterval(() => {
      if (runId !== runIdRef.current) return;
      const elapsed = Date.now() - start;
      const base = apiDone
        ? 100
        : Math.min(95, Math.round((elapsed / MIN_DISPLAY_MS) * 95));
      setProgress(base);
      const stepIdx = apiDone
        ? STEPS.length - 1
        : Math.min(STEPS.length - 1, Math.floor(elapsed / 900));
      setActiveStep(stepIdx);
    }, 80);

    async function execute() {
      try {
        const [resultado] = await Promise.all([
          runProcessing(token!, idEvaluacion!, abort.signal).then((res) => {
            if (runId === runIdRef.current) apiDone = true;
            return res;
          }),
          new Promise<void>((resolve) => window.setTimeout(resolve, MIN_DISPLAY_MS)),
        ]);

        if (runId !== runIdRef.current) return;

        window.clearInterval(tick);
        setProgress(100);
        setActiveStep(STEPS.length - 1);
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
  }, [isHydrated, token, retryKey]);

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
                    setActiveStep(0);
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
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 transition-[width] duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Procesando</span>
                    <span>{progress}%</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-left">
                  {STEPS.map((s, i) => {
                    const done = i < activeStep;
                    const active = i === activeStep;
                    return (
                      <div
                        key={s}
                        className={[
                          "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
                          active ? "border-violet-200 bg-violet-50/70 text-slate-700"
                            : done ? "border-slate-200 bg-white text-slate-600"
                            : "border-slate-200 bg-white text-slate-400",
                        ].join(" ")}
                      >
                        <span className={["grid h-5 w-5 place-items-center rounded-full",
                          done ? "bg-emerald-100 text-emerald-700"
                            : active ? "bg-violet-100 text-violet-700"
                            : "bg-slate-100 text-slate-400",
                        ].join(" ")}>
                          {done
                            ? <IconCheck className="h-3.5 w-3.5" />
                            : <span className="h-2 w-2 rounded-full bg-current" />}
                        </span>
                        <span className={active ? "font-semibold" : ""}>{s}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-500">
                  Esto puede tomar unos segundos...
                </div>
              </>
            )}
          </div>
        </div>
      </main>
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

function IconCheck(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
