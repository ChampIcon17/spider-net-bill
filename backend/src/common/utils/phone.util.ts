/** Kenyan mobile in E.164: +254 followed by 7 and 8 more digits (from 07XXXXXXXXX). */
export const KENYAN_E164_RE = /^\+2547[0-9]{8}$/;
export const KENYAN_LOCAL_RE = /^07[0-9]{8}$/;

export function toKenyanE164(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const cleaned = value.replace(/\s+/g, "");
  if (cleaned.startsWith("+254")) return cleaned;
  if (cleaned.startsWith("254")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+254${cleaned.slice(1)}`;
  return cleaned;
}

export function isValidKenyanPhoneInput(value: string): boolean {
  const cleaned = value.replace(/\s+/g, "");
  const normalized = toKenyanE164(cleaned);
  return (
    KENYAN_LOCAL_RE.test(cleaned) ||
    (typeof normalized === "string" && KENYAN_E164_RE.test(normalized))
  );
}
