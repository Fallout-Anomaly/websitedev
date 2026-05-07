import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTicketReference } from "@/lib/support-ticket-token";
import {
  createAndEmitUserNotifications,
  listAllStaffUserIds,
} from "@/src/lib/notifications";

const MAX_MESSAGE = 12_000;

type Body = {
  reference?: unknown;
  message?: unknown;
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
  const message =
    typeof json.message === "string" ? json.message.trim() : "";

  if (!reference || !message) {
    return NextResponse.json(
      { ok: false, error: "reference and message are required" },
      { status: 400 },
    );
  }

  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ ok: false, error: "Message too long" }, { status: 413 });
  }

  const { data: ticket, error: ticketErr } = await admin
    .from("fallen_world_support_tickets")
    .select("id, status")
    .eq("reference", reference)
    .maybeSingle();

  if (ticketErr || !ticket) {
    return NextResponse.json(
      { ok: false, error: "Ticket not found" },
      { status: 404 },
    );
  }

  if (ticket.status === "closed") {
    return NextResponse.json(
      { ok: false, error: "This ticket is closed" },
      { status: 409 },
    );
  }

  const { data: row, error: insErr } = await admin
    .from("fallen_world_support_ticket_messages")
    .insert({
      ticket_id: ticket.id,
      author_role: "user",
      body: message,
      staff_email: null,
    })
    .select("id, author_role, body, created_at")
    .single();

  if (insErr || !row) {
    console.error("user reply insert:", insErr);
    return NextResponse.json(
      { ok: false, error: "Could not post message" },
      { status: 500 },
    );
  }

  const staffUserIds = await listAllStaffUserIds();
  await createAndEmitUserNotifications(staffUserIds, {
    title: `New user message on support ticket ${reference}`,
    href: `/staff/support-tickets/${reference}`,
  });

  return NextResponse.json({ ok: true as const, message: row });
}
