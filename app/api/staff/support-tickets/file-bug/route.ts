import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTicketReference } from "@/lib/support-ticket-token";
import { isStaffAccount } from "@/src/lib/staff-access";
import { assertSameOrigin } from "@/src/lib/assert-same-origin";

const MAX_DESC = 48_000;

type Body = {
  reference?: unknown;
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

  if (!user?.email) {
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

  if (!reference) {
    return NextResponse.json({ ok: false, error: "reference required" }, { status: 400 });
  }

  const { data: ticket, error: fetchErr } = await admin
    .from("fallen_world_support_tickets")
    .select("id, reference, subject, contact_channel, report_body, filed_bug_report_id")
    .eq("reference", reference)
    .maybeSingle();

  if (fetchErr || !ticket) {
    return NextResponse.json({ ok: false, error: "Ticket not found" }, { status: 404 });
  }

  if (ticket.filed_bug_report_id != null) {
    return NextResponse.json(
      {
        ok: false,
        error: "already_filed",
        bugReportId: ticket.filed_bug_report_id as number,
      },
      { status: 409 },
    );
  }

  const header = `**Source:** Public support ticket \`${ticket.reference}\` · Contact: ${ticket.contact_channel ?? "—"}\n\n---\n\n`;
  let body = `${header}${ticket.report_body ?? ""}`;
  if (body.length > MAX_DESC) {
    body = `${body.slice(0, MAX_DESC)}\n\n…(truncated)`;
  }

  const { data: bug, error: insErr } = await admin
    .from("bug_reports")
    .insert({
      mod_name: "Fallen World (public support)",
      issue_description: body,
      severity: "Normal",
      reported_by: `Support ticket ${ticket.reference}`,
      status: "New",
      date_reported: new Date().toISOString().slice(0, 10),
      comments: [],
      last_updated_by: user.email,
    })
    .select("id")
    .single();

  if (insErr || !bug?.id) {
    console.error("file-bug insert:", insErr);
    return NextResponse.json(
      { ok: false, error: insErr?.message ?? "Could not create bug report" },
      { status: 500 },
    );
  }

  const bugId = bug.id as number;

  const { error: updErr } = await admin
    .from("fallen_world_support_tickets")
    .update({ filed_bug_report_id: bugId })
    .eq("id", ticket.id);

  if (updErr) {
    console.error("file-bug link update:", updErr);
    /* Bug row exists; staff can still find it by search */
  }

  return NextResponse.json({ ok: true as const, bugReportId: bugId });
}
