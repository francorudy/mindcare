import type { ResultsDisplayConfig } from "../../lib/results-display-config";

type RiskHeroCardProps = {
  config: ResultsDisplayConfig;
};

export function RiskHeroCard({ config }: RiskHeroCardProps) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-6 sm:p-7"
      style={{
        background: `linear-gradient(135deg, ${config.gradientFrom} 0%, ${config.gradientTo} 100%)`,
        boxShadow: config.shadow,
      }}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

      <div className="relative flex items-start gap-4">
        <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm">
          <IconSparkles className="h-7 w-7" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
            Tu plan personalizado
          </p>
          <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
            Nivel de riesgo: {config.level}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/90">{config.hint}</p>
        </div>
      </div>
    </section>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 3l1.2 3.7L17 8l-3.8 1.3L12 13l-1.2-3.7L7 8l3.8-1.3L12 3Z"
        fill="currentColor"
      />
      <path
        d="M5 12l.9 2.7L9 16l-3.1 1.3L5 20l-.9-2.7L1 16l3.1-1.3L5 12Z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}
