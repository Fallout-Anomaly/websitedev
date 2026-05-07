const EMAIL_IN_STRING =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/**
 * Bug tracker / lists: never show raw email. Staff-filed rows use the reporter email in DB — show role only.
 * Player-originated rows use `Support ticket …` from the ticket→bug bridge.
 */
export function formatReporterLabel(
  reportedBy: string | null | undefined
): string {
  const t = reportedBy?.trim();
  if (!t) return "Anonymous";
  if (EMAIL_IN_STRING.test(t)) return "Team member";
  if (/^support ticket\b/i.test(t)) return "Player";
  return "Player";
}
