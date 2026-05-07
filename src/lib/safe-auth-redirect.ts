/** Next path only: must be same-origin relative. Prevents open redirects. */
export function safeInternalPath(
  path: string | null | undefined,
  fallback: string
): string {
  if (!path || typeof path !== "string") return fallback;
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}
