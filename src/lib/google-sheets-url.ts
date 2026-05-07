/** Normalize a user-pasted Google Sheets link to a stable /edit URL. */
export function normalizeGoogleSheetsUrl(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (!u.hostname.endsWith("docs.google.com")) return null;
    const m = u.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!m?.[1]) return null;
    const id = m[1];
    return `https://docs.google.com/spreadsheets/d/${id}/edit`;
  } catch {
    return null;
  }
}
