import { COUNSELING_CONTACT } from "./counseling-contact";

export type RiskLevel = "Bajo" | "Moderado" | "Alto" | "Crítico";

export type RiskRecommendation = {
  title: string;
  description: string;
};

export type RiskConfig = {
  level: RiskLevel;
  ring: string;
  surface: string;
  title: string;
  iconBg: string;
  iconFg: string;
  chipBg: string;
  chipFg: string;
  hint: string;
  advice: string;
  alertTitle?: string;
  recommendations: RiskRecommendation[];
  primaryCta: {
    label: string;
    href: string;
    className: string;
  };
  showCriticalAlert: boolean;
};

export { COUNSELING_CONTACT };

export function normalizeRiskLevel(raw: string | null | undefined): RiskLevel {
  if (!raw) return "Bajo";
  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("crit")) return "Crítico";
  if (normalized === "alto") return "Alto";
  if (normalized === "moderado") return "Moderado";
  return "Bajo";
}

const RISK_CONFIGS: Record<RiskLevel, RiskConfig> = {
  Bajo: {
    level: "Bajo",
    ring: "border-emerald-300",
    surface: "bg-emerald-50/70",
    title: "text-emerald-900",
    iconBg: "bg-emerald-100",
    iconFg: "text-emerald-700",
    chipBg: "bg-emerald-50",
    chipFg: "text-emerald-700",
    hint: "¡Buenas noticias! Tus respuestas sugieren un bienestar emocional en un rango saludable.",
    advice: "Continúa practicando autocuidado y mantén tus redes de apoyo activas.",
    recommendations: [
      {
        title: "Autocuidado diario",
        description: "Dedica tiempo a actividades que te generen calma: descanso, hobbies y momentos de pausa.",
      },
      {
        title: "Actividad física regular",
        description: "Camina, haz ejercicio ligero o estiramientos para mejorar tu ánimo y reducir el estrés.",
      },
      {
        title: "Monitoreo periódico",
        description: "Realiza evaluaciones periódicas para detectar cambios tempranos en tu bienestar emocional.",
      },
    ],
    primaryCta: {
      label: "Ver recomendaciones",
      href: "/evaluation/recommendations",
      className:
        "bg-blue-600 hover:bg-blue-700 shadow-[0_14px_30px_rgba(37,99,235,0.25)]",
    },
    showCriticalAlert: false,
  },
  Moderado: {
    level: "Moderado",
    ring: "border-amber-300",
    surface: "bg-amber-50/70",
    title: "text-amber-900",
    iconBg: "bg-amber-100",
    iconFg: "text-amber-700",
    chipBg: "bg-amber-50",
    chipFg: "text-amber-700",
    hint: "Tus respuestas sugieren síntomas que merecen atención y seguimiento.",
    advice: "Te recomendamos buscar apoyo profesional y acudir a consejería universitaria en los próximos días.",
    recommendations: [
      {
        title: "Buscar apoyo profesional",
        description: "Hablar con un consejero puede ayudarte a entender lo que sientes y encontrar estrategias de afrontamiento.",
      },
      {
        title: "Consejería universitaria",
        description: "Agenda una cita con el servicio de consejería de tu universidad para recibir orientación personalizada.",
      },
      {
        title: "Red de apoyo",
        description: "Comparte cómo te sientes con personas de confianza: amigos, familiares o compañeros.",
      },
    ],
    primaryCta: {
      label: "Ver recomendaciones",
      href: "/evaluation/recommendations",
      className:
        "bg-blue-600 hover:bg-blue-700 shadow-[0_14px_30px_rgba(37,99,235,0.25)]",
    },
    showCriticalAlert: false,
  },
  Alto: {
    level: "Alto",
    ring: "border-rose-300",
    surface: "bg-rose-50/70",
    title: "text-rose-900",
    iconBg: "bg-rose-100",
    iconFg: "text-rose-700",
    chipBg: "bg-rose-50",
    chipFg: "text-rose-700",
    hint: "Tus respuestas indican síntomas significativos que requieren atención prioritaria.",
    advice: "Contacta a la consejería universitaria lo antes posible. Pedir ayuda es un paso valiente.",
    recommendations: [
      {
        title: "Atención prioritaria",
        description: "Tu bienestar requiere seguimiento cercano. No postergues buscar ayuda profesional.",
      },
      {
        title: "Consejería universitaria",
        description: "Comunícate con el servicio de consejería para recibir apoyo especializado cuanto antes.",
      },
      {
        title: "Evita el aislamiento",
        description: "Mantente en contacto con personas de confianza mientras buscas atención profesional.",
      },
    ],
    primaryCta: {
      label: "Contactar consejería",
      href: COUNSELING_CONTACT.mailto,
      className:
        "bg-rose-600 hover:bg-rose-700 shadow-[0_14px_30px_rgba(239,68,68,0.30)]",
    },
    showCriticalAlert: true,
  },
  Crítico: {
    level: "Crítico",
    ring: "border-rose-400",
    surface: "bg-rose-50/80",
    title: "text-rose-900",
    iconBg: "bg-rose-100",
    iconFg: "text-rose-700",
    chipBg: "bg-rose-50",
    chipFg: "text-rose-700",
    hint: "Se requiere intervención inmediata. No estás solo/a.",
    advice: "Acude a un profesional de salud mental o al servicio de consejería universitaria de inmediato.",
    alertTitle: "Alerta: intervención inmediata requerida",
    recommendations: [
      {
        title: "Atención de emergencia",
        description: "Si sientes que estás en crisis o tienes pensamientos de hacerte daño, busca ayuda inmediata.",
      },
      {
        title: "Consejería universitaria",
        description: "Contacta al servicio de consejería de tu universidad ahora mismo para recibir apoyo urgente.",
      },
      {
        title: "Línea de crisis 24/7",
        description: `Llama a la línea de crisis: ${COUNSELING_CONTACT.crisisLine}. Hay personas disponibles para ayudarte.`,
      },
    ],
    primaryCta: {
      label: "Contactar consejería",
      href: COUNSELING_CONTACT.mailto,
      className:
        "bg-rose-600 hover:bg-rose-700 shadow-[0_14px_30px_rgba(225,29,72,0.30)]",
    },
    showCriticalAlert: true,
  },
};

export function getRiskConfig(level: RiskLevel): RiskConfig {
  return RISK_CONFIGS[level];
}

export function getStoredRiskLevel(): RiskLevel {
  if (typeof window === "undefined") return "Bajo";
  try {
    const raw = sessionStorage.getItem("mc_resultado");
    if (!raw) return "Bajo";
    const parsed = JSON.parse(raw) as { nombre_nivel?: string };
    return normalizeRiskLevel(parsed.nombre_nivel);
  } catch {
    return "Bajo";
  }
}
