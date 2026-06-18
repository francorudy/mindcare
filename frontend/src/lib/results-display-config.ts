import { COUNSELING_CONTACT } from "./counseling-contact";

export type ResultsDisplayLevel = "Bajo" | "Moderado" | "Alto";

export type ResultsDisplayConfig = {
  level: ResultsDisplayLevel;  color: string;
  gradientFrom: string;
  gradientTo: string;
  shadow: string;
  hint: string;
  recommendation: {
    title: string;
    description: string;
    buttonLabel: string;
    buttonHref: string;
    external: boolean;
    gradientFrom: string;
    gradientTo: string;
    buttonClass: string;
  };
  showPriorityAlert: boolean;
};

export { COUNSELING_CONTACT };

const RESULTS_CONFIGS: Record<ResultsDisplayLevel, ResultsDisplayConfig> = {  Bajo: {
    level: "Bajo",
    color: "#22C55E",
    gradientFrom: "#22C55E",
    gradientTo: "#16A34A",
    shadow: "0 20px 50px rgba(34, 197, 94, 0.35)",
    hint: "¡Buenas noticias! Tus respuestas sugieren un bienestar emocional en un rango saludable. Continúa cuidando tu salud mental.",
    recommendation: {
      title: "Recomendación: autocuidado",
      description:
        "Mantén hábitos saludables, duerme adecuadamente, realiza actividad física y continúa monitoreando tu bienestar emocional.",
      buttonLabel: "Ver recomendaciones",
      buttonHref: "/evaluation/recommendations",
      external: false,
      gradientFrom: "#22C55E",
      gradientTo: "#15803D",
      buttonClass: "bg-white text-emerald-800 hover:bg-emerald-50",
    },
    showPriorityAlert: false,
  },
  Moderado: {
    level: "Moderado",
    color: "#F59E0B",
    gradientFrom: "#F59E0B",
    gradientTo: "#D97706",
    shadow: "0 20px 50px rgba(245, 158, 11, 0.35)",
    hint: "Tus respuestas sugieren síntomas que merecen atención. Considera conversar con un consejero para recibir orientación y apoyo.",
    recommendation: {
      title: "Recomendación: busca apoyo profesional",
      description:
        "Te recomendamos buscar apoyo profesional y acudir a consejería universitaria en los próximos días.",
      buttonLabel: "Ver recomendaciones",
      buttonHref: "/evaluation/recommendations",
      external: false,
      gradientFrom: "#F59E0B",
      gradientTo: "#B45309",
      buttonClass: "bg-white text-amber-800 hover:bg-amber-50",
    },
    showPriorityAlert: false,
  },
  Alto: {
    level: "Alto",
    color: "#EF4444",
    gradientFrom: "#EF4444",
    gradientTo: "#DC2626",
    shadow: "0 20px 50px rgba(239, 68, 68, 0.40)",
    hint: "Tus respuestas indican síntomas significativos que requieren atención prioritaria. No estás solo/a: pedir ayuda es un paso valiente.",
    recommendation: {
      title: "Recomendación: atención prioritaria",
      description:
        "Los resultados indican un nivel elevado de riesgo. Se recomienda contactar con el servicio de consejería universitaria lo antes posible y buscar orientación profesional.",
      buttonLabel: "Contactar consejería",
      buttonHref: COUNSELING_CONTACT.mailto,
      external: true,
      gradientFrom: "#EF4444",
      gradientTo: "#B91C1C",
      buttonClass: "bg-white text-rose-800 hover:bg-rose-50",
    },
    showPriorityAlert: true,
  },
};

export function toResultsDisplayLevel(raw: string | null | undefined): ResultsDisplayLevel {
  if (!raw) return "Bajo";
  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("crit") || normalized === "alto") return "Alto";
  if (normalized === "moderado") return "Moderado";
  return "Bajo";
}

export function getResultsDisplayConfig(level: ResultsDisplayLevel): ResultsDisplayConfig {
  return RESULTS_CONFIGS[level];
}

export function getStoredResultsDisplayLevel(): ResultsDisplayLevel {
  if (typeof window === "undefined") return "Bajo";
  try {
    const raw = sessionStorage.getItem("mc_resultado");
    if (!raw) return "Bajo";
    const parsed = JSON.parse(raw) as { nombre_nivel?: string };
    return toResultsDisplayLevel(parsed.nombre_nivel);
  } catch {
    return "Bajo";
  }
}
