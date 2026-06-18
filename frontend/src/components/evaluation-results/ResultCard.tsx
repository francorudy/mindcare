import type { ResultsDisplayConfig } from "@/lib/results-display-config";

type ResultCardProps = {
  config: ResultsDisplayConfig;
  probability: number;
  modelLabel?: string | null;
};

export function ResultCard({ config, probability, modelLabel }: ResultCardProps) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
      style={{
        background: `linear-gradient(135deg, ${config.gradientFrom} 0%, ${config.gradientTo} 100%)`,
        boxShadow: config.shadow,
      }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-black/10 blur-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm">
            <IconGauge className="h-7 w-7" />
          </div>
          {modelLabel && (
            <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm">
              Modelo: {modelLabel}
            </span>
          )}
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
          Nivel de riesgo
        </p>
        <h2 className="mt-1 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {config.level}
        </h2>

        <p className="mt-4 max-w-prose text-sm leading-6 text-white/90">{config.hint}</p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/20 px-4 py-2.5 ring-1 ring-white/25 backdrop-blur-sm">
          <span className="text-2xl font-bold text-white">{probability}%</span>
          <span className="text-xs font-medium text-white/85">estimación de riesgo</span>
        </div>
      </div>
    </section>
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
