import Link from "next/link";
import type { ResultsDisplayConfig } from "../../lib/results-display-config";

type RecommendationCardProps = {
  config: ResultsDisplayConfig;
};

export function RecommendationCard({ config }: RecommendationCardProps) {
  const { recommendation: rec } = config;

  const buttonClass = [
    "mt-4 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold shadow-[0_10px_24px_rgba(0,0,0,0.15)] transition",
    rec.buttonClass,
  ].join(" ");

  return (
    <section
      className="rounded-2xl p-5 sm:p-6"
      style={{
        background: `linear-gradient(135deg, ${rec.gradientFrom} 0%, ${rec.gradientTo} 100%)`,
        boxShadow: config.shadow,
      }}
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-white/20 text-white ring-1 ring-white/25">
          <IconLightbulb className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug text-white">{rec.title}</p>
          <p className="mt-2 text-xs leading-[1.65] text-white/90 sm:text-sm sm:leading-[1.7]">
            {rec.description}
          </p>

          {rec.external ? (
            <a href={rec.buttonHref} className={buttonClass}>
              {rec.buttonLabel}
            </a>
          ) : (
            <Link href={rec.buttonHref} className={buttonClass}>
              {rec.buttonLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function IconLightbulb({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M9 18h6M10 22h4M12 2a6 6 0 0 0-3 11.3V16a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.7A6 6 0 0 0 12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
