import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTicketReference } from "@/lib/support-ticket-token";
import { isStaffAccount } from "@/src/lib/staff-access";
import { assertSameOrigin } from "@/src/lib/assert-same-origin";

const ALLOWED = new Set(["open", "triaged", "closed"]);

type Body = {
  reference?: unknown;
  status?: unknown;
};

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ ok: false, error: "Bad origin" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isStaffAccount(supabase, user))) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 503 });
  }

  let json: Body;
  try {
    json = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const reference =
    typeof json.reference === "string"
      ? normalizeTicketReference(json.reference)
      : "";
  const status = typeof json.status === "string" ? json.status.trim() : "";

  if (!reference || !ALLOWED.has(status)) {
    return NextResponse.json(
      { ok: false, error: "reference and valid status required" },
      { status: 400 },
    );
  }

  const { data: updated, error } = await admin
    .from("fallen_world_support_tickets")
    .update({ status })
    .eq("reference", reference)
    .select("reference, status")
    .maybeSingle();

  if (error) {
    console.error("support ticket status:", error);
    return NextResponse.json(
      { ok: false, error: error.message ?? "Update failed" },
      { status: 500 },
    );
  }

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true as const, status: updated.status });
}
