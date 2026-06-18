export type RecommendationCardStyle = {
  gradient: string;
  iconBg: string;
  iconColor: string;
  border: string;
  shadow: string;
  accent: string;
};

export const RECOMMENDATION_CARD_STYLES: RecommendationCardStyle[] = [
  {
    gradient: "from-emerald-50 via-teal-50/80 to-white",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
    iconColor: "text-white",
    border: "border-emerald-100/80",
    shadow: "shadow-[0_12px_32px_rgba(16,185,129,0.12)]",
    accent: "text-emerald-700",
  },
  {
    gradient: "from-sky-50 via-blue-50/80 to-white",
    iconBg: "bg-gradient-to-br from-sky-400 to-blue-500",
    iconColor: "text-white",
    border: "border-sky-100/80",
    shadow: "shadow-[0_12px_32px_rgba(59,130,246,0.12)]",
    accent: "text-blue-700",
  },
  {
    gradient: "from-violet-50 via-purple-50/80 to-white",
    iconBg: "bg-gradient-to-br from-violet-400 to-purple-500",
    iconColor: "text-white",
    border: "border-violet-100/80",
    shadow: "shadow-[0_12px_32px_rgba(139,92,246,0.12)]",
    accent: "text-violet-700",
  },
  {
    gradient: "from-amber-50 via-orange-50/80 to-white",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
    iconColor: "text-white",
    border: "border-amber-100/80",
    shadow: "shadow-[0_12px_32px_rgba(245,158,11,0.14)]",
    accent: "text-amber-700",
  },
  {
    gradient: "from-rose-50 via-pink-50/80 to-white",
    iconBg: "bg-gradient-to-br from-rose-400 to-pink-500",
    iconColor: "text-white",
    border: "border-rose-100/80",
    shadow: "shadow-[0_12px_32px_rgba(244,63,94,0.12)]",
    accent: "text-rose-700",
  },
  {
    gradient: "from-cyan-50 via-teal-50/80 to-white",
    iconBg: "bg-gradient-to-br from-cyan-400 to-teal-500",
    iconColor: "text-white",
    border: "border-cyan-100/80",
    shadow: "shadow-[0_12px_32px_rgba(6,182,212,0.12)]",
    accent: "text-cyan-700",
  },
];

export function getRecommendationCardStyle(index: number): RecommendationCardStyle {
  return RECOMMENDATION_CARD_STYLES[index % RECOMMENDATION_CARD_STYLES.length];
}

export const MOTIVATIONAL_QUOTES: Record<"Bajo" | "Moderado" | "Alto", string> = {
  Bajo: "Cuidar de ti mismo/a es un acto de valentía. Sigue avanzando a tu ritmo — cada pequeño paso cuenta.",
  Moderado:
    "Pedir ayuda es señal de fortaleza, no de debilidad. Estás dando pasos importantes hacia tu bienestar.",
  Alto: "No estás solo/a en esto. Dar el primer paso hacia el apoyo ya es un logro valioso y valiente.",
};

export function getMotivationalQuote(level: "Bajo" | "Moderado" | "Alto"): string {
  return MOTIVATIONAL_QUOTES[level];
}
