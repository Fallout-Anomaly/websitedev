import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isStaffAccount } from "@/src/lib/staff-access";

/**
 * Who may view the global staff activity / audit log (UI + server actions).
 * - If `STAFF_AUDIT_LOG_EMAIL` is set, only that account may view (strict).
 * - Otherwise any user who can access the staff portal (`isStaffAccount`) may view.
 */
function staffAuditLogEmail(): string | undefined {
  const raw = process.env.STAFF_AUDIT_LOG_EMAIL;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function canViewStaffAuditLog(
  supabase: SupabaseClient,
  user: User | null | undefined
): Promise<boolean> {
  if (!user) return false;
  const strict = staffAuditLogEmail();
  if (strict) {
    return user.email?.toLowerCase() === strict.toLowerCase();
  }
  return isStaffAccount(supabase, user);
}
