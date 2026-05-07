import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  ids?: unknown;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let json: Body;
  try {
    json = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const ids = Array.isArray(json.ids) ? json.ids : [];
  const normalized = ids.filter((x): x is string => typeof x === "string" && x.length > 0);

  const now = new Date().toISOString();

  const q = supabase
    .from("user_notifications")
    .update({ read_at: now })
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  const { error } =
    normalized.length > 0 ? await q.in("id", normalized) : await q;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const, readAt: now });
}

