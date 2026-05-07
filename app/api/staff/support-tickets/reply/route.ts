import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTicketReference } from "@/lib/support-ticket-token";
import { isStaffAccount } from "@/src/lib/staff-access";
import { assertSameOrigin } from "@/src/lib/assert-same-origin";
import { displayNameForUser } from "@/src/lib/display-name";
import { avatarPresetForUser } from "@/src/lib/profile-avatar";
import {
  createAndEmitUserNotifications,
  listAllStaffUserIds,
  emitNotificationToChannel,
} from "@/src/lib/notifications";

const MAX_MESSAGE = 12_000;

type Body = {
  reference?: unknown;
  message?: unknown;
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

  const email = user.email;
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Account has no email" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Server misconfigured (service role)" },
      { status: 503 },
    );
  }

  const { data: ticket, error: ticketErr } = await admin
    .from("fallen_world_support_tickets")
    .select("id")
    .eq("reference", reference)
    .maybeSingle();

  if (ticketErr || !ticket) {
    return NextResponse.json(
      { ok: false, error: "Ticket not found" },
      { status: 404 },
    );
  }

  const { data: row, error: insErr } = await admin
    .from("fallen_world_support_ticket_messages")
    .insert({
      ticket_id: ticket.id,
      author_role: "staff",
      body: message,
      staff_email: email,
      staff_display_name: displayNameForUser(user),
      staff_avatar_preset: avatarPresetForUser(user),
    })
    .select("id, author_role, body, staff_display_name, staff_avatar_preset, created_at")
    .single();

  if (insErr || !row) {
    console.error("staff reply insert:", insErr);
    const msg = insErr?.message ?? "Could not post message";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 },
    );
  }

  const staffUserIds = (await listAllStaffUserIds()).filter((id) => id !== user.id);
  await Promise.all([
    createAndEmitUserNotifications(staffUserIds, {
      title: `Staff replied to support ticket ${reference}`,
      body: displayNameForUser(user),
      href: `/staff/support-tickets/${reference}`,
    }),
    // Let anyone with the ticket reference (public lookup) know (no DB persistence)
    emitNotificationToChannel(`ticket:${reference}`, {
      title: "New staff reply on your support ticket",
      href: `/support/bug-report#ticket-lookup`,
    }),
  ]);

  return NextResponse.json({ ok: true as const, message: row });
}
