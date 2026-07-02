"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthSession } from "../../../contexts/auth-session";
import { EvaluationErrorBanner } from "../../../components/evaluation-error-banner";
import { journalApi, ApiError } from "../../../lib/api";
import {
  getEvalId,
  isPhq9Complete,
  isPhq9Synced,
  loadPhq9Answers,
  syncPhq9ToBackend,
} from "../../../lib/evaluation-session";
import {
  EVAL_BACK_LINK,
  EVAL_CARD,
  EVAL_CARD_PADDING,
  EVAL_CONTAINER,
  EVAL_MAIN,
  EVAL_PAGE_BG,
} from "../../../lib/evaluation-layout";

export default function EvaluationTextPage() {
  const router = useRouter();
  const { session, isHydrated } = useAuthSession();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [phq9Ready, setPhq9Ready] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncStartedRef = useRef(false);

  const charCount = text.length;
  const maxChars = 1200;

  const helper = useMemo(() => {
    if (charCount === 0) return "Empieza a escribir aquí...";
    if (charCount < 60) return "Puedes contar un poco más para tener mejor contexto.";
    return "Gracias por compartir. Tómate tu tiempo.";
  }, [charCount]);

  const syncAnswers = async () => {
    if (!session?.token) {
      setError("Tu sesión ha expirado. Inicia sesión de nuevo.");
      setSyncing(false);
      router.push("/login");
      return;
    }

    if (isPhq9Synced()) {
      setPhq9Ready(true);
      setSyncing(false);
      return;
    }

    const answers = loadPhq9Answers();
    if (!isPhq9Complete(answers)) {
      router.replace("/evaluation/questions");
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      await syncPhq9ToBackend(session.token, answers!);
      setPhq9Ready(true);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudieron guardar tus respuestas. Verifica que el backend esté activo.";
      setError(message);
      setPhq9Ready(false);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!isHydrated || syncStartedRef.current) return;
    syncStartedRef.current = true;
    void syncAnswers();
  }, [isHydrated]);

  async function handleEnviar() {
    if (!isHydrated) return;
    if (!session?.token) {
      console.log("[evaluation/text] handleEnviar sin token → router.push(/login)");
      setError("Tu sesión ha expirado. Inicia sesión de nuevo.");
      router.push("/login");
      return;
    }

    if (!phq9Ready && !isPhq9Synced()) {
      await syncAnswers();
      if (!isPhq9Synced()) return;
    }

    const idEvaluacion = getEvalId();
    if (!idEvaluacion) {
      setError("No se encontró la evaluación. Vuelve al cuestionario e intenta de nuevo.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const texto = text.trim() || "(sin texto libre)";
      await journalApi.guardar(session.token, idEvaluacion, texto);
      router.push("/evaluation/analysis");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("No se pudo guardar. Verifica tu conexión.");
      }
    } finally {
      setLoading(false);
    }
  }

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

          <div className={EVAL_CARD}>
            <div className={EVAL_CARD_PADDING}>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Comparte tus pensamientos
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                Escribe libremente sobre cómo te has sentido últimamente. Es opcional pero ayuda al análisis.
              </p>

              {syncing && (
                <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-800">
                  Guardando tus respuestas del cuestionario...
                </div>
              )}

              <section className="mt-8 rounded-xl bg-indigo-50/70 p-5 ring-1 ring-indigo-100">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-indigo-600">
                    <IconInfo className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">Algunos temas que puedes explorar:</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-indigo-900/70">
                      {[
                        "¿Qué situación te ha afectado emocionalmente?",
                        "¿Cómo describirías tu estado de ánimo general?",
                        "¿Hay algo que te preocupe constantemente?",
                        "¿Cómo han sido tus relaciones sociales últimamente?",
                      ].map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-indigo-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <div className="mt-8">
                <p className="text-sm font-semibold text-slate-800">Tu espacio personal</p>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-[0_10px_20px_rgba(2,6,23,0.04)]">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.currentTarget.value.slice(0, maxChars))}
                    rows={14}
                    placeholder={`${helper} Tómate tu tiempo para expresar lo que sientes. Este espacio es seguro.`}
                    className="w-full resize-none rounded-xl bg-transparent px-5 py-5 text-sm leading-7 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-violet-200/60 sm:text-base"
                  />
                  <div className="flex items-center justify-between px-5 pb-4 pt-1 text-xs text-slate-500">
                    <span>{charCount} caracteres</span>
                    <span>Tu información es privada y confidencial</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-3">
                  <EvaluationErrorBanner message={error} onRetry={() => void syncAnswers()} />
                </div>
              )}

              <section className="mt-6 rounded-xl bg-emerald-50/70 p-5 ring-1 ring-emerald-100">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-700">
                    <IconShield className="h-5 w-5" />
                  </span>
                  <p className="text-sm leading-6 text-emerald-900/80">
                    Usaremos análisis de lenguaje natural para comprender mejor tu estado emocional
                  </p>
                </div>
              </section>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/evaluation/questions")}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                  Volver
                </button>

                <button
                  type="button"
                  onClick={() => void handleEnviar()}
                  disabled={loading || syncing || !phq9Ready}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(124,58,237,0.25)] transition hover:bg-violet-700 disabled:opacity-60"
                >
                  {loading ? "Guardando..." : syncing ? "Preparando..." : <>Enviar evaluación <span aria-hidden="true">→</span></>}
                </button>
              </div>

              <p className="mt-5 text-center text-xs text-slate-500">
                Paso 3 de 4 • Casi terminamos
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function IconInfo(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10.5v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconShield(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path d="M12 3 20 7v6c0 5-3.6 8.4-8 9-4.4-.6-8-4-8-9V7l8-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 12.2 11.4 14l3.6-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
