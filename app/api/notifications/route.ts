import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [unreadCountRes, listRes] = await Promise.all([
    supabase
      .from("user_notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_user_id", user.id)
      .is("read_at", null),
    supabase
      .from("user_notifications")
      .select("id, title, body, href, created_at, read_at")
      .eq("recipient_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (listRes.error) {
    return NextResponse.json(
      { ok: false, error: listRes.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true as const,
    unread: unreadCountRes.count ?? 0,
    items: (listRes.data ?? []).map((n) => ({
      id: String((n as any).id),
      title: String((n as any).title ?? ""),
      body: (n as any).body ?? undefined,
      href: (n as any).href ?? undefined,
      createdAt: String((n as any).created_at),
      readAt: (n as any).read_at ? String((n as any).read_at) : null,
    })),
  });
}

