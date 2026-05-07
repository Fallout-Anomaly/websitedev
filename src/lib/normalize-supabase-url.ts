/**
 * `NEXT_PUBLIC_SUPABASE_URL` must be the **Project URL** from Supabase → Settings → API
 * (e.g. `https://gnzhfwvegfxygucuieez.supabase.co`).
 *
 * Browser `<img>` public object links use `/storage/v1/object/public/...` on that host.
 * The S3 endpoint (`https://<ref>.storage.supabase.co/storage/v1/s3`) is a different API
 * and must not be used as the project URL.
 */
export function normalizeSupabaseUrlToProjectApiUrl(raw: string): string {
  const t = raw?.trim() ?? "";
  if (!t) return "";
  let u = t.replace(/\/$/, "");
  u = u.replace(/\/storage\/v1\/s3\/?$/i, "");
  const m = u.match(/^https:\/\/([a-z0-9-]+)\.storage\.supabase\.co(?:\/.*)?$/i);
  if (m) return `https://${m[1]}.supabase.co`;
  return u;
}
