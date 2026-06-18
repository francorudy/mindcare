"use client";

import { useEffect, useRef } from "react";

export function EvaluationErrorBanner({
  message,
  onRetry,
  retryLabel = "Reintentar",
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [message]);

  return (
    <div
      ref={ref}
      role="alert"
      className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 shadow-[0_8px_20px_rgba(244,63,94,0.12)]"
    >
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
