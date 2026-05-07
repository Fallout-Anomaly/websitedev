import "server-only";

function resolveExpectedOrigin(headers: Headers): string | null {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return null;
  const proto =
    headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Minimal CSRF mitigation for cookie-auth routes: require same-origin when `Origin` is present.
 * - Browsers send Origin on most cross-site POSTs and on `fetch` from the page.
 * - Some same-site navigations may omit Origin; we allow that to avoid breaking legitimate clients.
 */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const expected = resolveExpectedOrigin(request.headers);
  if (!expected) return;

  try {
    const o = new URL(origin);
    const e = new URL(expected);
    if (o.protocol !== e.protocol || o.host !== e.host) {
      throw new Error("Bad origin");
    }
  } catch {
    throw new Error("Bad origin");
  }
}

