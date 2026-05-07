import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Staff flag on the JWT only (no database round-trip). Admins can set Raw App Meta Data
 * in Supabase Dashboard, e.g. `{ "staff": true }`, `{ "role": "staff" }`, or `{ "roles": ["staff"] }`.
 */
export function isStaffJwtMetadata(
  user: Pick<User, "app_metadata"> | null | undefined,
): boolean {
  if (!user) return false;
  const meta = user.app_metadata as Record<string, unknown> | undefined;
  if (!meta) return false;
  if (meta.staff === true) return true;
  if (meta.role === "staff" || meta.role === "admin") return true;
  const roles = meta.roles;
  if (
    Array.isArray(roles) &&
    (roles.includes("staff") || roles.includes("admin"))
  ) {
    return true;
  }
  return false;
}

/**
 * Staff portal access: JWT metadata (above) and/or a row in public.staff_members
 * for the current user. Uses the caller's Supabase client (session must match user).
 */
export async function isStaffAccount(
  supabase: SupabaseClient,
  user: Pick<User, "id" | "app_metadata"> | null | undefined,
): Promise<boolean> {
  if (!user) return false;
  if (isStaffJwtMetadata(user)) return true;
  const { data, error } = await supabase
    .from("staff_members")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("staff_members lookup:", error.message);
    return false;
  }
  return data != null;
}
