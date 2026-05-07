import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTicketReference } from "@/lib/support-ticket-token";
import { scrubEmailsFromText } from "@/src/lib/public-ticket-redact";
import type { PostgrestError } from "@supabase/supabase-js";

type Body = {
  reference?: unknown;
};

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, reason: "not_configured" as const },
      { status: 503 },
    );
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
    return NextResponse.json(
      { ok: false, error: "reference is required" },
      { status: 400 },
    );
  }

  const { data: ticket, error: ticketErr } = await admin
    .from("fallen_world_support_tickets")
    .select(
      "id, reference, subject, contact_channel, status, created_at, report_body",
    )
    .eq("reference", reference)
    .maybeSingle();

  if (ticketErr) {
    console.error("ticket lookup:", ticketErr);
    const msg = ticketErr?.message ?? "Lookup failed";
    const code = "code" in ticketErr ? String((ticketErr as any).code) : undefined;
    const hint =
      /relation .* does not exist/i.test(msg) ||
      /schema cache/i.test(msg) ||
      code === "42P01"
        ? "Support ticket tables are missing in Supabase. Apply the support ticket migrations to your production database."
        : /column/i.test(msg) || code === "42703"
          ? "Support ticket schema is out of date in Supabase. Apply the latest migrations for support tickets."
        : undefined;
    return NextResponse.json(
      { ok: false, error: msg, code, hint },
      { status: 500 },
    );
  }

  if (!ticket) {
    return NextResponse.json(
      { ok: false, error: "Ticket not found" },
      { status: 404 },
    );
  }

  const fullSelect =
    "id, author_role, body, staff_display_name, staff_avatar_preset, created_at";
  const minimalSelect = "id, author_role, body, created_at";

  let messages: Array<{
    id: string;
    author_role: string;
    body: string;
    staff_display_name?: string | null;
    staff_avatar_preset?: string | null;
    created_at: string;
  }> | null = null;
  let msgErr: PostgrestError | null = null;

  const attemptFull = await admin
    .from("fallen_world_support_ticket_messages")
    .select(fullSelect)
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true });

  messages = attemptFull.data as typeof messages;
  msgErr = attemptFull.error;

  if (msgErr) {
    const msg = msgErr.message ?? "Could not load messages";
    const code = msgErr.code ? String(msgErr.code) : undefined;
    const isColumnErr = /column/i.test(msg) || code === "42703";

    if (isColumnErr) {
      const attemptMinimal = await admin
        .from("fallen_world_support_ticket_messages")
        .select(minimalSelect)
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });

      messages = attemptMinimal.data as typeof messages;
      msgErr = attemptMinimal.error;
    }
  }

  if (msgErr) {
    console.error("ticket messages:", msgErr);
    const msg = msgErr?.message ?? "Could not load messages";
    const code = "code" in msgErr ? String((msgErr as any).code) : undefined;
    const hint =
      /relation .* does not exist/i.test(msg) ||
      /schema cache/i.test(msg) ||
      code === "42P01"
        ? "Support ticket message tables are missing in Supabase. Apply the support ticket migrations to your production database."
        : /column/i.test(msg) || code === "42703"
          ? "Support ticket message schema is out of date in Supabase. Apply the latest migrations for support tickets."
        : undefined;
    return NextResponse.json(
      { ok: false, error: msg, code, hint },
      { status: 500 },
    );
  }

  const safeTicket = {
    ...ticket,
    subject: scrubEmailsFromText(ticket.subject) || null,
    contact_channel: scrubEmailsFromText(ticket.contact_channel) || null,
    report_body: scrubEmailsFromText(ticket.report_body),
  };

  return NextResponse.json({
    ok: true as const,
    ticket: safeTicket,
    messages: messages ?? [],
  });
}
