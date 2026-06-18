"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useAuthSession } from "../../../contexts/auth-session";
import { EvaluationErrorBanner } from "../../../components/evaluation-error-banner";
import { evaluacionApi, ApiError } from "../../../lib/api";
import { PHQ9_QUESTIONS } from "../../../lib/evaluation-questions";
import { getEvalId, prepareTextStep, setEvalId } from "../../../lib/evaluation-session";
import {
  EVAL_BACK_LINK,
  EVAL_CARD,
  EVAL_CARD_PADDING,
  EVAL_CONTAINER,
  EVAL_MAIN,
  EVAL_PAGE_BG,
} from "../../../lib/evaluation-layout";

const OPTIONS = [
  { label: "Nunca", value: 0 },
  { label: "Varios días", value: 1 },
  { label: "Más de la mitad de los días", value: 2 },
  { label: "Casi todos los días", value: 3 },
] as const;

export default function EvaluationQuestionsPage() {
  const router = useRouter();
  const { session, isHydrated } = useAuthSession();

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const total = PHQ9_QUESTIONS.length;
  const percent = Math.round((answeredCount / total) * 100);
  const canContinue = answeredCount === total;

  async function handleContinue() {
    if (!canContinue) {
      setShowHint(true);
      return;
    }

    if (!isHydrated) {
      setError("Cargando tu sesión. Espera un momento e intenta de nuevo.");
      return;
    }

    if (!session?.token) {
      setError("Tu sesión ha expirado. Inicia sesión de nuevo.");
      router.push("/login");
      return;
    }

    setError(null);
    setContinuing(true);
    prepareTextStep(answers);

    try {
      if (!getEvalId()) {
        const evaluacion = await evaluacionApi.iniciar(session.token);
        setEvalId(evaluacion.id_evaluacion);
      }
      router.push("/evaluation/text");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo iniciar la evaluación. Verifica que el backend esté activo.";
      setError(message);
    } finally {
      setContinuing(false);
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
            <div className={`${EVAL_CARD_PADDING} pb-4`}>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>{`Progreso: ${answeredCount}/${total}`}</span>
                <span>{`${percent}%`}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="mt-6 space-y-5">
                {showHint && !canContinue && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900">
                    Para continuar, responde las {total} preguntas. Te faltan{" "}
                    <span className="font-semibold">{total - answeredCount}</span>.
                  </div>
                )}

                {PHQ9_QUESTIONS.map((q, idx) => (
                  <QuestionCard
                    key={idx}
                    index={idx}
                    question={q}
                    selectedValue={answers[idx]}
                    options={OPTIONS}
                    onSelect={(value) => setAnswers((prev) => ({ ...prev, [idx]: value }))}
                  />
                ))}

                {error && <EvaluationErrorBanner message={error} />}

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/evaluation")}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                  >
                    Volver
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleContinue()}
                    disabled={!isHydrated || continuing}
                    className={[
                      "inline-flex flex-1 items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition",
                      canContinue && isHydrated && !continuing
                        ? "bg-violet-600 shadow-[0_14px_30px_rgba(124,58,237,0.25)] hover:bg-violet-700"
                        : "bg-slate-200 text-slate-400",
                    ].join(" ")}
                  >
                    {continuing ? "Preparando..." : "Continuar evaluación"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function QuestionCard(props: {
  index: number;
  question: string;
  selectedValue?: number;
  options: ReadonlyArray<{ label: string; value: number }>;
  onSelect: (value: number) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200/70 bg-white p-6 shadow-[0_10px_20px_rgba(2,6,23,0.04)]">
      <p className="text-sm font-semibold text-slate-900 sm:text-base">
        {props.index + 1}. {props.question}
      </p>
      <p className="mt-1 text-xs text-slate-500">Durante las últimas 2 semanas</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {props.options.map((opt) => {
          const active = props.selectedValue === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => props.onSelect(opt.value)}
              className={[
                "rounded-lg border px-4 py-4 text-left text-sm font-semibold transition",
                active
                  ? "border-violet-300 bg-violet-50 text-violet-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
