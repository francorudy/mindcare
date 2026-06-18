import { PageShell } from "./page-shell";

export function PageLoading({ label = "Cargando..." }: { label?: string }) {
  return (
    <PageShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500 [animation-delay:300ms]" />
        </div>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </PageShell>
  );
}
