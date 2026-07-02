export function PriorityAlertCard() {
  return (
    <section className="rounded-2xl border-2 border-[#EF4444] bg-[#FEF2F2] p-5 shadow-[0_16px_40px_rgba(239,68,68,0.18)] sm:p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-[#EF4444] text-white shadow-[0_8px_20px_rgba(239,68,68,0.35)]">
          <IconAlert className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold uppercase tracking-wide text-[#B91C1C] sm:text-lg">
            Atención prioritaria
          </p>
          <p className="mt-2.5 text-sm leading-[1.7] font-medium text-[#991B1B] sm:text-base">
            Los resultados obtenidos indican un nivel alto de riesgo. Se recomienda contactar
            inmediatamente con el servicio de consejería universitaria o con un profesional de
            salud mental para recibir orientación especializada.
          </p>
        </div>
      </div>
    </section>
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
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
