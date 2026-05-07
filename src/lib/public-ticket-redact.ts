/** Remove email-like substrings for public ticket API responses (staff UI uses raw rows). */
export function scrubEmailsFromText(s: string | null | undefined): string {
  if (s == null || typeof s !== "string") return "";
  return s.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "—"
  );
}
