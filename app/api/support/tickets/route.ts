import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BODY = 96_000;
const MAX_SUBJECT = 500;

function makeReference(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  ).toUpperCase();
  return `FW-${suffix}`;
}

type Body = {
  reportBody?: unknown;
  subject?: unknown;
  contactChannel?: unknown;
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

  const reportBody =
    typeof json.reportBody === "string" ? json.reportBody.trim() : "";
  if (!reportBody) {
    return NextResponse.json(
      { ok: false, error: "reportBody is required" },
      { status: 400 },
    );
  }
  if (reportBody.length > MAX_BODY) {
    return NextResponse.json(
      { ok: false, error: "Report is too large" },
      { status: 413 },
    );
  }

  const subjectRaw = typeof json.subject === "string" ? json.subject.trim() : "";
  const subject =
    subjectRaw.length > MAX_SUBJECT
      ? `${subjectRaw.slice(0, MAX_SUBJECT)}…`
      : subjectRaw || null;

  const contactChannel =
    typeof json.contactChannel === "string" && json.contactChannel.length <= 64
      ? json.contactChannel.trim() || null
      : null;

  for (let attempt = 0; attempt < 4; attempt++) {
    const reference = makeReference();
    const { data, error } = await admin
      .from("fallen_world_support_tickets")
      .insert({
        reference,
        subject,
        report_body: reportBody,
        contact_channel: contactChannel,
        status: "open",
      })
      .select("reference")
      .single();

    if (!error && data?.reference) {
      return NextResponse.json({
        ok: true as const,
        reference: data.reference,
      });
    }

    if (
      error?.code === "23505" ||
      error?.message?.toLowerCase().includes("duplicate")
    ) {
      continue;
    }

    console.error("support ticket insert:", error);
    const msg = error?.message ?? "Could not save ticket";
    const code = error && "code" in error ? String(error.code) : undefined;
    const hint =
      /column/i.test(msg) || code === "42703"
        ? "Apply the latest Supabase migrations for support tickets."
        : undefined;
    return NextResponse.json(
      { ok: false, error: msg, code, hint },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: false, error: "Could not allocate ticket reference" },
    { status: 500 },
  );
}
