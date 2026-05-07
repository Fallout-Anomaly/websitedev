import type { User } from "@supabase/supabase-js";
import "server-only";

function staffRoleAdminEmail(): string {
  const raw = process.env.STAFF_ROLE_ADMIN_EMAIL;
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : "";
}

function isAdminJwtMetadata(
  user: Pick<User, "app_metadata"> | null | undefined,
): boolean {
  if (!user) return false;
  const meta = user.app_metadata as Record<string, unknown> | undefined;
  if (!meta) return false;
  if (meta.admin === true) return true;
  if (meta.role === "admin") return true;
  const roles = meta.roles;
  if (Array.isArray(roles) && roles.includes("admin")) return true;
  return false;
}

export function canManageStaffRoles(user: User | null | undefined): boolean {
  if (!user) return false;

  // Preferred: admin role on JWT app_metadata.
  if (isAdminJwtMetadata(user)) return true;

  // Legacy/backup: single configured email.
  if (!user.email) return false;
  const adminEmail = staffRoleAdminEmail();
  if (!adminEmail) return false;
  return user.email.toLowerCase() === adminEmail;
}

