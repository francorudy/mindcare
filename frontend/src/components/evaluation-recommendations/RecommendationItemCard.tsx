import { getRecommendationCardStyle } from "../../lib/recommendation-card-styles";

type RecommendationItemCardProps = {
  title: string;
  description: string;
  index: number;
  subtitle?: string | null;
  resources?: string | null;
};

const ICONS = [IconHeart, IconActivity, IconChart, IconUsers, IconPhone, IconMind] as const;

export function RecommendationItemCard({
  title,
  description,
  index,
  subtitle,
  resources,
}: RecommendationItemCardProps) {
  const style = getRecommendationCardStyle(index);
  const Icon = ICONS[index % ICONS.length];

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition duration-300 hover:-translate-y-0.5",
        style.gradient,
        style.border,
        style.shadow,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/40 blur-xl transition group-hover:bg-white/60" />

      <div className="relative flex items-start gap-3">
        <div
          className={[
            "grid h-11 w-11 flex-none place-items-center rounded-xl shadow-md",
            style.iconBg,
            style.iconColor,
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="mt-2 text-xs leading-6 text-slate-600 sm:text-sm">{description}</p>
          {subtitle && (
            <p className="mt-1 text-xs italic leading-5 text-slate-500">{subtitle}</p>
          )}
          {resources && (
            <p className={["mt-3 whitespace-pre-line text-xs font-semibold leading-5", style.accent].join(" ")}>
              {resources}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21s-7-4.5-9.5-9A5.7 5.7 0 0 1 12 5.9 5.7 5.7 0 0 1 21.5 12C19 16.5 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconActivity({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 12h4l2-7 4 14 2-7h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 19V5M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 15V9M12 15V7M16 15v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M16 20v-1.2c0-2-1.8-3.6-4-3.6s-4 1.6-4 3.6V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8.5 4.5h7A2 2 0 0 1 17.5 6.5v11a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M11 17h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconMind({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3a5 5 0 0 1 5 5c0 2.2-1.4 4.1-3.4 4.8L12 21l-1.6-8.2A5 5 0 0 1 12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
