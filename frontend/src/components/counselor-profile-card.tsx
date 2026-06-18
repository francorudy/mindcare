type CounselorProfileCardProps = {
  name: string;
};

export function CounselorProfileCard({ name }: CounselorProfileCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-violet-200/30 bg-white/15 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.03)] backdrop-blur-md">
      <span
        aria-hidden="true"
        className="mt-1 grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-emerald-100 text-lg text-emerald-700 ring-1 ring-emerald-200"
      >
        🧑‍⚕️
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-slate-900">{name}</p>
        <p className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          🩺 Rol: Consejero
        </p>
      </div>
    </div>
  );
}
