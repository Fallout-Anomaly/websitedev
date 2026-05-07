/** Normalize user input for ticket reference matching (e.g. FW-…). */
export function normalizeTicketReference(ref: string): string {
  return ref.trim().toUpperCase().replace(/\s+/g, "");
}
