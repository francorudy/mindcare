export type CampusContact = {
  campus: string;
  email: string;
};

const CAMPUS_LINE_RE = /^(Campus\s[^:]+):\s*(\S+@\S+\.\S+)$/i;
const EMAIL_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

export function parseCampusContacts(resources: string): CampusContact[] | null {
  const contacts = resources
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(CAMPUS_LINE_RE);
      if (!match) return null;
      return { campus: match[1].trim(), email: match[2].trim() };
    })
    .filter((item): item is CampusContact => item !== null);

  return contacts.length > 0 ? contacts : null;
}

export function isCounselingCampusResource(title: string, resources?: string | null): boolean {
  if (/consejer[ií]a universitaria/i.test(title)) return true;
  if (!resources) return false;
  return /Campus\s/i.test(resources) && EMAIL_RE.test(resources);
}

export function isEmergencyResource(title: string): boolean {
  return /emergencia|crisis|24\s*\/\s*7/i.test(title);
}

export function extractPhoneFromResource(resources: string): string | null {
  const match = resources.match(/(\d{3}[-\s]?\d{4}|\d{7,})/);
  return match ? match[1] : null;
}

export function splitTextWithEmails(text: string): Array<{ type: "text" | "email"; value: string }> {
  const parts: Array<{ type: "text" | "email"; value: string }> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(EMAIL_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, index) });
    }
    parts.push({ type: "email", value: match[1] });
    lastIndex = index + match[1].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}
