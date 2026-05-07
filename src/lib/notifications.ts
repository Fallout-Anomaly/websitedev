import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationInput = {
  title: string;
  body?: string;
  href?: string;
};

export function extractMentionHandlesFromHtml(html: string): string[] {
  const handles = new Set<string>();

  // Tiptap mention extension commonly serializes mentions with a data-id attribute.
  for (const m of html.matchAll(/data-id="([^"]+)"/g)) {
    const raw = (m[1] ?? "").trim();
    if (raw) handles.add(raw);
  }

  // Fallback: plain @handle text (best effort).
  for (const m of html.matchAll(/@([a-zA-Z0-9._-]{2,32})/g)) {
    const raw = (m[1] ?? "").trim();
    if (raw) handles.add(raw);
  }

  return [...handles];
}

export async function emitNotificationToChannel(
  channel: string,
  input: NotificationInput,
) {
  // Deprecated: Upstash Realtime was removed for "no outside services".
  // Supabase Realtime listens to postgres_changes on user_notifications instead.
  void channel;
  void input;
}

export async function createUserNotifications(
  recipientUserIds: string[],
  input: NotificationInput,
): Promise<
  { id: string; recipient_user_id: string; title: string; body: string | null; href: string | null; created_at: string; read_at: string | null }[]
> {
  const unique = [...new Set(recipientUserIds.map((x) => x.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("user_notifications")
    .insert(
      unique.map((uid) => ({
        recipient_user_id: uid,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
      })),
    )
    .select("id, recipient_user_id, title, body, href, created_at, read_at");

  if (error || !data) {
    console.error("user_notifications insert:", error);
    return [];
  }

  return data as any;
}

export async function createAndEmitUserNotifications(
  recipientUserIds: string[],
  input: NotificationInput,
) {
  // Insert-only. Clients receive updates through Supabase Realtime table subscriptions.
  return await createUserNotifications(recipientUserIds, input);
}

export async function resolveStaffHandles(handles: string[]): Promise<string[]> {
  const unique = [...new Set(handles.map((h) => h.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("staff_members")
    .select("user_id, handle")
    .in("handle", unique);

  if (error || !data) return [];

  return data
    .map((r) => ({ userId: String(r.user_id ?? ""), handle: String(r.handle ?? "") }))
    .filter((r) => r.userId && r.handle)
    .map((r) => r.userId);
}

export async function listAllStaffUserIds(): Promise<string[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data, error } = await admin.from("staff_members").select("user_id");
  if (error || !data) return [];
  return data.map((r) => String((r as any).user_id ?? "")).filter(Boolean);
}

