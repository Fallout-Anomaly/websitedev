import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageStaffRoles } from "@/src/lib/staff-role-admin";
import { assertSameOrigin } from "@/src/lib/assert-same-origin";

type Row = {
  userId: string;
  email: string | null;
  createdAt: string | null;
  userMetadata: {
    display_name?: string | null;
    full_name?: string | null;
    user_name?: string | null;
  } | null;
};
type AccountRow = {
  userId: string;
  email: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  userMetadata: {
    display_name?: string | null;
    full_name?: string | null;
    user_name?: string | null;
  } | null;
};

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

async function getUserByEmail(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string,
) {
  const adminAny = admin.auth.admin as any;
  if (typeof adminAny.getUserByEmail === "function") {
    return (await adminAny.getUserByEmail(email)) as {
      data?: { user?: { id: string; email?: string | null } | null };
      error?: { message: string } | null;
    };
  }

  // Fallback: scan pages with a small cap to avoid missing users while preventing runaway costs.
  const perPage = 200;
  const maxPages = 10; // up to 2,000 accounts scanned
  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return { data: { user: null }, error };
    const found =
      data.users.find((u) => (u.email ?? "").toLowerCase() === email) ?? null;
    if (found) return { data: { user: found }, error: null };
    if (!data.users || data.users.length < perPage) break;
  }

  return { data: { user: null }, error: null };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!canManageStaffRoles(user)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Server not configured (missing service role key)." },
      { status: 500 },
    );
  }

  const { data, error } = await admin
    .from("staff_members")
    .select("user_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  const items: Row[] = [];
  const rows = (data ?? []).map((row) => ({
    id: String((row as any).user_id ?? ""),
    createdAt: (((row as any).created_at as string) ?? null) as string | null,
  }));

  const enriched = await Promise.all(
    rows.map(async (r) => {
      try {
        const uRes = await admin.auth.admin.getUserById(r.id);
        const email = uRes.data.user?.email ?? null;
        const meta = (uRes.data.user?.user_metadata as any) ?? null;
        return { userId: r.id, email, userMetadata: meta, createdAt: r.createdAt } satisfies Row;
      } catch {
        return { userId: r.id, email: null, userMetadata: null, createdAt: r.createdAt } satisfies Row;
      }
    }),
  );

  items.push(...enriched.filter((i) => i.userId));

  const url = new URL(request.url);
  const usersRequested = url.searchParams.get("users") === "1";
  if (!usersRequested) {
    return NextResponse.json({ ok: true, items });
  }

  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const perPageRaw = Number(url.searchParams.get("perPage") ?? "100") || 100;
  const perPage = Math.min(500, Math.max(1, perPageRaw));

  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({
    page,
    perPage,
  });
  if (listErr) {
    return NextResponse.json(
      { ok: false, error: listErr.message },
      { status: 500 },
    );
  }

  const accounts: AccountRow[] = (listData.users ?? []).map((u) => ({
    userId: u.id,
    email: u.email ?? null,
    createdAt: (u.created_at as string | undefined) ?? null,
    lastSignInAt: (u.last_sign_in_at as string | undefined) ?? null,
    userMetadata: (u.user_metadata as any) ?? null,
  }));

  const hasMore = accounts.length === perPage;
  return NextResponse.json({ ok: true, items, accounts, page, perPage, hasMore });
}

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

  if (!canManageStaffRoles(user)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Server not configured (missing service role key)." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { action?: "add" | "remove"; email?: string }
    | null;

  const action = body?.action ?? "add";
  const email = normalizeEmail(body?.email ?? "");
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "Invalid email." },
      { status: 400 },
    );
  }

  const uRes = await getUserByEmail(admin, email);
  const target = uRes.data?.user ?? null;
  if (!target) {
    return NextResponse.json(
      { ok: false, error: "User not found." },
      { status: 404 },
    );
  }

  if (action === "remove") {
    const { error } = await admin
      .from("staff_members")
      .delete()
      .eq("user_id", target.id);
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  const { error } = await admin
    .from("staff_members")
    .upsert({ user_id: target.id }, { onConflict: "user_id" });
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

