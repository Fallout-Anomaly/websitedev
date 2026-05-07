/**
 * Browser-safe Supabase URL and publishable key.
 * Prefer NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Supabase dashboard naming); the legacy
 * NEXT_PUBLIC_SUPABASE_ANON_KEY is the same class of credential and remains supported.
 */
export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

export function getSupabasePublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** True when URL and at least one publishable/anon key are set (for optional proxy short-circuit). */
export const hasPublicSupabaseConfig =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
