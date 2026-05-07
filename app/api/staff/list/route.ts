import { NextResponse } from "next/server";
import { assertStaffSession } from "@/src/lib/assert-staff-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { displayNameForUser } from "@/src/lib/display-name";

export async function GET() {
  // Staff-only: requires a valid staff session cookie.
  // IMPORTANT: staff_members has RLS "select self", so we must use the service role
  // client to list all staff members (while still requiring the caller to be staff).
  await assertStaffSession();

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
      { status: 503 },
    );
  }

  const { data: staffRows, error } = await admin
    .from("staff_members")
    .select("user_id, handle, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (staffRows ?? [])
    .map((r) => ({
      userId: String((r as any).user_id ?? "").trim(),
      handle: String((r as any).handle ?? "").trim(),
    }))
    .filter((r) => r.userId);

  const enriched = await Promise.all(
    rows.map(async (r) => {
      try {
        const res = await admin.auth.admin.getUserById(r.userId);
        const user = res.data?.user ?? null;
        const name = displayNameForUser(user);
        return {
          id: r.userId,
          label: r.handle ? (name ? `${name} (@${r.handle})` : `@${r.handle}`) : name || "Staff member",
        };
      } catch {
        return {
          id: r.userId,
          label: r.handle ? `@${r.handle}` : "Staff member",
        };
      }
    }),
  );

  return NextResponse.json(enriched);
}

