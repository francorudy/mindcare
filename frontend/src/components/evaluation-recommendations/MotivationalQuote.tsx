import { getMotivationalQuote } from "../../lib/recommendation-card-styles";
import type { ResultsDisplayLevel } from "../../lib/results-display-config";

type MotivationalQuoteProps = {
  level: ResultsDisplayLevel;
};

export function MotivationalQuote({ level }: MotivationalQuoteProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-fuchsia-50/60 to-white p-5 shadow-[0_12px_32px_rgba(139,92,246,0.10)] sm:p-6">
      <div className="pointer-events-none absolute -right-6 top-0 h-20 w-20 rounded-full bg-violet-200/40 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden="true">
          ✨
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">
            Recuerda
          </p>
          <p className="mt-2 text-sm leading-7 font-medium text-slate-700 italic">
            &ldquo;{getMotivationalQuote(level)}&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
