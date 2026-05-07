import type { User } from "@supabase/supabase-js";

/** Reads Supabase Auth user_metadata (syncs to Dashboard “Display name” when using full_name / name). */
export function displayNameFromMetadata(
  meta: User["user_metadata"] | null | undefined
): string {
  if (!meta || typeof meta !== "object") return "";
  const m = meta as Record<string, unknown>;
  const full = m.full_name;
  const name = m.name;
  if (typeof full === "string" && full.trim()) return full.trim();
  if (typeof name === "string" && name.trim()) return name.trim();
  return "";
}

/** Label for UI: never includes email. */
export function displayNameForUser(user: User | null | undefined): string {
  const n = displayNameFromMetadata(user?.user_metadata ?? null);
  if (n) return n;
  return "Member";
}

export function displayNameOrTeamMember(name: string | null | undefined): string {
  const n = name?.trim();
  return n || "Team member";
}
