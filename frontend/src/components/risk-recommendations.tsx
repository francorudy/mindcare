import Link from "next/link";
import type { RiskConfig, RiskRecommendation } from "../lib/risk-config";

type RiskLevelCardProps = {
  config: RiskConfig;
  probability?: number;
  modelLabel?: string | null;
  extraText?: string | null;
};

export function RiskLevelCard({
  config,
  probability,
  modelLabel,
  extraText,
}: RiskLevelCardProps) {
  return (
    <section
      className={[
        "rounded-2xl border p-5 shadow-[0_10px_20px_rgba(2,6,23,0.04)]",
        config.ring,
        config.surface,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "grid h-10 w-10 place-items-center rounded-2xl ring-1 ring-black/5",
            config.iconBg,
            config.iconFg,
          ].join(" ")}
        >
          <IconGauge className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className={["text-sm font-semibold", config.title].join(" ")}>
            Nivel de riesgo: {config.level}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-700/80">{config.hint}</p>
          <p className="mt-3 text-xs font-semibold text-slate-700">{config.advice}</p>
        </div>
      </div>

      {probability !== undefined && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{probability}%</span> estimación de
            riesgo
          </div>
          {modelLabel && (
            <span
              className={[
                "rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-black/5",
                config.chipBg,
                config.chipFg,
              ].join(" ")}
            >
              Modelo: {modelLabel}
            </span>
          )}
        </div>
      )}

      {extraText && (
        <p className="mt-3 border-t border-black/5 pt-3 text-xs leading-5 text-slate-700">
          {extraText}
        </p>
      )}
    </section>
  );
}

export function CriticalAlertBanner({ config }: { config: RiskConfig }) {
  if (!config.showCriticalAlert) return null;

  return (
    <section className="rounded-2xl border border-rose-300 bg-gradient-to-r from-rose-500/95 to-rose-600/95 p-5">
      <div className="flex items-start gap-3 text-white">
        <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
          <IconAlert className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold">{config.alertTitle}</p>
          <p className="mt-1 text-xs leading-5 text-white/90">
            Se requiere intervención inmediata. Acude a un profesional de salud mental o al
            servicio de consejería universitaria.
          </p>
        </div>
      </div>
    </section>
  );
}

export function RiskRecommendationList({
  recommendations,
  tone = "default",
}: {
  recommendations: RiskRecommendation[];
  tone?: "default" | "critical";
}) {
  const cardTone =
    tone === "critical"
      ? "border-rose-100 bg-rose-50/70"
      : "border-slate-200 bg-white/80";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {recommendations.map((item) => (
        <section
          key={item.title}
          className={["rounded-2xl border p-4 shadow-[0_10px_20px_rgba(2,6,23,0.04)]", cardTone].join(
            " ",
          )}
        >
          <p className="text-xs font-semibold text-slate-900">{item.title}</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">{item.description}</p>
        </section>
      ))}
    </div>
  );
}

export function RiskPrimaryAction({
  config,
  external = false,
}: {
  config: RiskConfig;
  external?: boolean;
}) {
  const className = [
    "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition",
    config.primaryCta.className,
  ].join(" ");

  if (external || config.primaryCta.href.startsWith("mailto:")) {
    return (
      <a href={config.primaryCta.href} className={className}>
        {config.primaryCta.label} →
      </a>
    );
  }

  return (
    <Link href={config.primaryCta.href} className={className}>
      {config.primaryCta.label} →
    </Link>
  );
}

function IconGauge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4 14a8 8 0 1 1 16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M12 14l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 3 2.7 19.5A1.6 1.6 0 0 0 4.1 22h15.8a1.6 1.6 0 0 0 1.4-2.5L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
