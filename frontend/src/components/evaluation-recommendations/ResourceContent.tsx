import {
  extractPhoneFromResource,
  isCounselingCampusResource,
  isEmergencyResource,
  parseCampusContacts,
  splitTextWithEmails,
} from "@/lib/resource-display";

type ResourceContentProps = {
  title: string;
  resources: string;
  accent: string;
};

export function ResourceContent({ title, resources, accent }: ResourceContentProps) {
  if (isCounselingCampusResource(title, resources)) {
    const contacts = parseCampusContacts(resources);
    if (contacts) {
      return <CampusCounselingList contacts={contacts} accent={accent} />;
    }
  }

  if (isEmergencyResource(title)) {
    return <EmergencyLineContent resources={resources} accent={accent} />;
  }

  return <GenericResourceText resources={resources} accent={accent} />;
}

function CampusCounselingList({
  contacts,
  accent,
}: {
  contacts: ReturnType<typeof parseCampusContacts>;
  accent: string;
}) {
  if (!contacts) return null;

  return (
    <ul className="mt-3 space-y-3.5">
      {contacts.map(({ campus, email }) => (
        <li key={campus} className="space-y-1">
          <p className="text-xs font-semibold text-slate-800">{campus}</p>
          <p className="text-xs leading-relaxed text-slate-600">
            <span aria-hidden="true" className="mr-1">
              📧
            </span>
            <a
              href={`mailto:${email}?subject=Solicitud%20de%20atención%20-%20MindCare`}
              className={[
                "break-all font-medium underline decoration-current/30 underline-offset-2 transition hover:decoration-current",
                accent,
              ].join(" ")}
            >
              {email}
            </a>
          </p>
        </li>
      ))}
    </ul>
  );
}

function EmergencyLineContent({ resources, accent }: { resources: string; accent: string }) {
  const phone = extractPhoneFromResource(resources);
  const telHref = phone ? `tel:${phone.replace(/\D/g, "")}` : null;

  return (
    <div className="mt-3 flex flex-col items-center justify-center text-center">
      {phone && telHref ? (
        <a
          href={telHref}
          className={[
            "text-base font-bold tracking-tight underline decoration-current/30 underline-offset-2 transition hover:decoration-current sm:text-lg",
            accent,
          ].join(" ")}
        >
          {resources.includes("Central") ? resources : `Central telefónica: ${phone}`}
        </a>
      ) : (
        <p className={["text-sm font-semibold leading-relaxed", accent].join(" ")}>{resources}</p>
      )}
      <p className="mt-2.5 max-w-xs text-[11px] leading-relaxed text-slate-500">
        Disponible las 24 horas para situaciones de emergencia emocional.
      </p>
    </div>
  );
}

function GenericResourceText({ resources, accent }: { resources: string; accent: string }) {
  const lines = resources.split("\n").map((line) => line.trim()).filter(Boolean);

  return (
    <div className={["mt-3 space-y-1.5 text-xs leading-relaxed", accent].join(" ")}>
      {lines.map((line, idx) => (
        <p key={idx} className="break-words font-semibold [overflow-wrap:anywhere]">
          {splitTextWithEmails(line).map((part, partIdx) =>
            part.type === "email" ? (
              <a
                key={partIdx}
                href={`mailto:${part.value}?subject=Solicitud%20de%20atención%20-%20MindCare`}
                className="font-medium underline decoration-current/30 underline-offset-2 transition hover:decoration-current"
              >
                {part.value}
              </a>
            ) : (
              <span key={partIdx}>{part.value}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}
