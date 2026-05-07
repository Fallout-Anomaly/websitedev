import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only client with elevated privileges. Used for public flows that must not
 * expose insert policies on the anon key (e.g. support tickets from /support/bug-report).
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is unset — callers should degrade gracefully.
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
