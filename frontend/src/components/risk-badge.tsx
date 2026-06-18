export type RiskLevel = "Bajo" | "Moderado" | "Alto" | "Crítico" | string;

export function normalizeDisplayRisk(level: string | null | undefined): string {
  if (!level) return "—";
  const normalized = level
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (normalized.includes("crit")) return "Alto";
  if (normalized === "alto") return "Alto";
  if (normalized === "moderado") return "Moderado";
  if (normalized === "bajo") return "Bajo";
  return level;
}

export function riskBadgeClass(level: string | null | undefined): string {
  const risk = normalizeDisplayRisk(level);
  if (risk === "Alto") return "bg-rose-50 text-rose-700 ring-rose-100";
  if (risk === "Moderado") return "bg-amber-50 text-amber-800 ring-amber-100";
  if (risk === "Bajo") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  return "bg-slate-50 text-slate-600 ring-slate-100";
}

export function riskSurfaceClass(level: string | null | undefined): string {
  const risk = normalizeDisplayRisk(level);
  if (risk === "Alto") return "border-rose-300 bg-rose-50/70";
  if (risk === "Moderado") return "border-amber-300 bg-amber-50/70";
  if (risk === "Bajo") return "border-emerald-300 bg-emerald-50/70";
  return "border-slate-200 bg-slate-50/70";
}

export function RiskBadge({ level }: { level: string | null | undefined }) {
  const label = normalizeDisplayRisk(level);
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1",
        riskBadgeClass(level),
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export function formatProbabilidad(prob: string | number | null | undefined): string {
  if (prob === null || prob === undefined || prob === "") return "—";
  const num = typeof prob === "string" ? parseFloat(prob) : prob;
  if (Number.isNaN(num)) return "—";
  return `${Math.round(num * 100)}%`;
}

export function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
