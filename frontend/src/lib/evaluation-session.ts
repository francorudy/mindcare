import { evaluacionApi, phq9Api, type RespuestaPHQ9Item } from "./api";
import { PHQ9_QUESTIONS } from "./evaluation-questions";

const ANSWERS_KEY = "mc_eval_answers";
const EVAL_ID_KEY = "mc_eval_id";
const RESULT_KEY = "mc_resultado";
const PHQ9_SYNCED_KEY = "mc_phq9_synced";

export type Phq9Answers = Record<number, number>;

let syncInFlight: Promise<number> | null = null;

export function savePhq9Answers(answers: Phq9Answers): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
}

function answersEqual(a: Phq9Answers | null, b: Phq9Answers): boolean {
  if (!a) return false;
  return PHQ9_QUESTIONS.every((_, idx) => a[idx] === b[idx]);
}

/** Guarda respuestas y marca PHQ-9 para re-sincronizar solo si las respuestas cambiaron. */
export function prepareTextStep(answers: Phq9Answers): void {
  const previous = loadPhq9Answers();
  const changed = !answersEqual(previous, answers);
  savePhq9Answers(answers);
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(RESULT_KEY);
  if (changed) {
    window.sessionStorage.removeItem(PHQ9_SYNCED_KEY);
  }
}

export function loadPhq9Answers(): Phq9Answers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ANSWERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Phq9Answers;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isPhq9Complete(answers: Phq9Answers | null): boolean {
  if (!answers) return false;
  return PHQ9_QUESTIONS.every((_, idx) => typeof answers[idx] === "number");
}

export function isPhq9Synced(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.sessionStorage.getItem(PHQ9_SYNCED_KEY) === "1" &&
    Boolean(window.sessionStorage.getItem(EVAL_ID_KEY))
  );
}

export function getEvalId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(EVAL_ID_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function setEvalId(idEvaluacion: number): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(EVAL_ID_KEY, String(idEvaluacion));
}

export function markPhq9Synced(idEvaluacion: number): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(EVAL_ID_KEY, String(idEvaluacion));
  window.sessionStorage.setItem(PHQ9_SYNCED_KEY, "1");
}

export function startNewEvaluation(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ANSWERS_KEY);
  window.sessionStorage.removeItem(EVAL_ID_KEY);
  window.sessionStorage.removeItem(RESULT_KEY);
  window.sessionStorage.removeItem(PHQ9_SYNCED_KEY);
}

export function clearEvaluationSession(): void {
  startNewEvaluation();
}

function toPhq9Payload(answers: Phq9Answers): RespuestaPHQ9Item[] {
  return PHQ9_QUESTIONS.map((question, idx) => ({
    pregunta_numero: idx + 1,
    texto_pregunta: question,
    opcion_seleccionada: answers[idx],
    valor: answers[idx],
  }));
}

async function doSyncPhq9ToBackend(
  token: string,
  answers: Phq9Answers,
): Promise<number> {
  let idEvaluacion = getEvalId();

  if (!idEvaluacion) {
    const evaluacion = await evaluacionApi.iniciar(token);
    idEvaluacion = evaluacion.id_evaluacion;
    setEvalId(idEvaluacion);
  }

  await phq9Api.enviar(token, idEvaluacion, toPhq9Payload(answers));
  markPhq9Synced(idEvaluacion);
  return idEvaluacion;
}

/** Sincroniza PHQ-9 reutilizando el mismo id_evaluacion de la sesión actual. */
export async function syncPhq9ToBackend(
  token: string,
  answers: Phq9Answers,
): Promise<number> {
  if (syncInFlight) return syncInFlight;

  syncInFlight = doSyncPhq9ToBackend(token, answers).finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}
