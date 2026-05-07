"use server";

import { assertStaffSession } from "@/src/lib/assert-staff-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { displayNameForUser } from "@/src/lib/display-name";
import {
  createAndEmitUserNotifications,
  extractMentionHandlesFromHtml,
  resolveStaffHandles,
} from "@/src/lib/notifications";

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

async function resolveMentionRecipients(tokens: string[]): Promise<string[]> {
  const unique = [...new Set(tokens.map((t) => t.trim()).filter(Boolean))];
  const directUserIds = unique.filter(isUuidLike);
  const handleLike = unique.filter((t) => !isUuidLike(t));
  const fromHandles = handleLike.length > 0 ? await resolveStaffHandles(handleLike) : [];
  return [...new Set([...directUserIds, ...fromHandles])];
}

export type StaffProjectCategory = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  position: number;
  archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffProjectTask = {
  id: string;
  category_id: string;
  title: string;
  description_html: string;
  priority: "Low" | "Medium" | "High" | "Critical" | string;
  status:
    | "Backlog"
    | "Planned"
    | "In Progress"
    | "Testing"
    | "Completed"
    | "Blocked"
    | string;
  sort_order: number;
  assigned_user_ids: string[];
  due_date: string | null;
  labels: unknown;
  progress: number;
  checklist: unknown;
  external_url?: string | null;
  thumbnail_url?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function staffOnlyPredicate() {
  return true;
}

export type StaffProjectTaskComment = {
  id: string;
  task_id: string;
  body_html: string;
  created_by: string | null;
  created_at: string;
  author_name: string;
  author_handle: string | null;
};

async function resolveStaffCommentAuthors(
  userIds: string[],
): Promise<Map<string, { name: string; handle: string | null }>> {
  const unique = [...new Set(userIds.map((x) => x.trim()).filter(Boolean))];
  const map = new Map<string, { name: string; handle: string | null }>();
  if (unique.length === 0) return map;

  // Prefer handles from staff_members for a stable identity.
  const { supabase } = await assertStaffSession();
  const { data: staffRows } = await supabase
    .from("staff_members")
    .select("user_id, handle")
    .in("user_id", unique);

  const handleById = new Map<string, string>();
  for (const r of staffRows ?? []) {
    const uid = String((r as any).user_id ?? "");
    const h = String((r as any).handle ?? "");
    if (uid && h) handleById.set(uid, h);
  }

  const admin = createAdminClient();
  if (!admin) {
    for (const id of unique) {
      const handle = handleById.get(id) ?? null;
      map.set(id, { name: handle ? `@${handle}` : "Team member", handle });
    }
    return map;
  }

  await Promise.all(
    unique.map(async (id) => {
      const handle = handleById.get(id) ?? null;
      try {
        const res = await admin.auth.admin.getUserById(id);
        const user = res.data?.user ?? null;
        const name = displayNameForUser(user);
        map.set(id, { name: name || (handle ? `@${handle}` : "Team member"), handle });
      } catch {
        map.set(id, { name: handle ? `@${handle}` : "Team member", handle });
      }
    }),
  );

  return map;
}

export async function createProjectCategory(input: {
  name: string;
  color?: string;
  description?: string;
  icon?: string;
}) {
  if (!staffOnlyPredicate()) throw new Error("Unauthorized");
  const { supabase, user } = await assertStaffSession();
  const name = input.name.trim();
  if (!name) throw new Error("Category name required");

  const { data: maxRow, error: maxErr } = await supabase
    .from("staff_project_categories")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) throw new Error(maxErr.message);
  const nextPosition = (Number((maxRow as any)?.position ?? 0) || 0) + 10;

  const { data, error } = await supabase
    .from("staff_project_categories")
    .insert({
      name,
      description: input.description ?? null,
      icon: input.icon ?? null,
      color: input.color ?? "#3b82f6",
      position: nextPosition,
      created_by: user.id,
    })
    .select("id, name, description, color, icon, position, archived, created_by, created_at, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data as StaffProjectCategory;
}

export async function updateProjectCategory(input: {
  id: string;
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string | null;
  archived?: boolean;
  position?: number;
}) {
  if (!staffOnlyPredicate()) throw new Error("Unauthorized");
  const { supabase } = await assertStaffSession();

  const patch: Record<string, unknown> = {};
  if (typeof input.name === "string") patch.name = input.name.trim();
  if (typeof input.description !== "undefined") patch.description = input.description;
  if (typeof input.color === "string") patch.color = input.color;
  if (typeof input.icon !== "undefined") patch.icon = input.icon;
  if (typeof input.archived === "boolean") patch.archived = input.archived;
  if (typeof input.position === "number") patch.position = input.position;

  const { data, error } = await supabase
    .from("staff_project_categories")
    .update(patch)
    .eq("id", input.id)
    .select("id, name, description, color, icon, position, archived, created_by, created_at, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data as StaffProjectCategory;
}

export async function reorderProjectCategories(input: { orderedIds: string[] }) {
  if (!staffOnlyPredicate()) throw new Error("Unauthorized");
  const { supabase } = await assertStaffSession();
  const ids = input.orderedIds;
  if (!Array.isArray(ids) || ids.length === 0) return;

  const updates = ids.map((id, idx) => ({ id, position: (idx + 1) * 10 }));
  const { error } = await supabase.from("staff_project_categories").upsert(updates);
  if (error) throw new Error(error.message);
}

export async function createProjectTask(input: {
  categoryId: string;
  title: string;
  status?: string;
  priority?: string;
  descriptionHtml?: string;
  dueDate?: string | null;
  externalUrl?: string | null;
  thumbnailUrl?: string | null;
}) {
  if (!staffOnlyPredicate()) throw new Error("Unauthorized");
  const { supabase, user } = await assertStaffSession();
  const title = input.title.trim();
  if (!title) throw new Error("Task title required");

  const descriptionHtml = input.descriptionHtml ?? "";

  const { data: maxRow, error: maxErr } = await supabase
    .from("staff_project_tasks")
    .select("sort_order")
    .eq("category_id", input.categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) throw new Error(maxErr.message);
  const nextSortOrder = (Number((maxRow as any)?.sort_order ?? 0) || 0) + 1024;

  const { data, error } = await supabase
    .from("staff_project_tasks")
    .insert({
      category_id: input.categoryId,
      title,
      status: input.status ?? "Backlog",
      priority: input.priority ?? "Medium",
      description_html: descriptionHtml,
      due_date: input.dueDate ?? null,
      sort_order: nextSortOrder,
      created_by: user.id,
      external_url: input.externalUrl ?? null,
      thumbnail_url: input.thumbnailUrl ?? null,
    })
    .select(
      "id, category_id, title, description_html, priority, status, sort_order, assigned_user_ids, due_date, labels, progress, checklist, external_url, thumbnail_url, created_by, created_at, updated_at",
    )
    .single();

  if (error) throw new Error(error.message);

  // Mentions → notifications (best-effort; don't block task creation).
  try {
    const handles = extractMentionHandlesFromHtml(descriptionHtml);
    const recipients = await resolveMentionRecipients(handles);
    if (recipients.length > 0) {
      await createAndEmitUserNotifications(recipients, {
        title: "You were mentioned in a task",
        body: title,
        href: `/staff/projects?task=${String((data as any).id)}`,
      });
    }
  } catch {
    // ignore
  }

  return data as StaffProjectTask;
}

export async function updateProjectTask(input: {
  id: string;
  title?: string;
  descriptionHtml?: string;
  priority?: string;
  status?: string;
  dueDate?: string | null;
  progress?: number;
  categoryId?: string;
  sortOrder?: number;
  externalUrl?: string | null;
  thumbnailUrl?: string | null;
}) {
  if (!staffOnlyPredicate()) throw new Error("Unauthorized");
  const { supabase } = await assertStaffSession();

  const patch: Record<string, unknown> = {};
  if (typeof input.title === "string") patch.title = input.title.trim();
  if (typeof input.descriptionHtml === "string") patch.description_html = input.descriptionHtml;
  if (typeof input.priority === "string") patch.priority = input.priority;
  if (typeof input.status === "string") patch.status = input.status;
  if (typeof input.dueDate !== "undefined") patch.due_date = input.dueDate;
  if (typeof input.progress === "number") patch.progress = input.progress;
  if (typeof input.categoryId === "string") patch.category_id = input.categoryId;
  if (typeof input.sortOrder === "number") patch.sort_order = input.sortOrder;
  if (typeof input.externalUrl !== "undefined") patch.external_url = input.externalUrl;
  if (typeof input.thumbnailUrl !== "undefined") patch.thumbnail_url = input.thumbnailUrl;

  const { data, error } = await supabase
    .from("staff_project_tasks")
    .update(patch)
    .eq("id", input.id)
    .select(
      "id, category_id, title, description_html, priority, status, sort_order, assigned_user_ids, due_date, labels, progress, checklist, external_url, thumbnail_url, created_by, created_at, updated_at",
    )
    .single();

  if (error) throw new Error(error.message);

  // Mentions → notifications (best-effort; only when description is updated).
  if (typeof input.descriptionHtml === "string") {
    try {
      const handles = extractMentionHandlesFromHtml(input.descriptionHtml);
      const recipients = await resolveMentionRecipients(handles);
      if (recipients.length > 0) {
        await createAndEmitUserNotifications(recipients, {
          title: "You were mentioned in a task update",
          body: typeof input.title === "string" && input.title.trim() ? input.title.trim() : "Task updated",
          href: `/staff/projects?task=${input.id}`,
        });
      }
    } catch {
      // ignore
    }
  }

  return data as StaffProjectTask;
}

export async function deleteProjectTask(input: { id: string }) {
  if (!staffOnlyPredicate()) throw new Error("Unauthorized");
  const { supabase } = await assertStaffSession();
  const { error } = await supabase.from("staff_project_tasks").delete().eq("id", input.id);
  if (error) throw new Error(error.message);
}

export async function listProjectTaskComments(input: { taskId: string }) {
  const { supabase } = await assertStaffSession();
  const { data, error } = await supabase
    .from("staff_project_task_comments")
    .select("id, task_id, body_html, created_by, created_at")
    .eq("task_id", input.taskId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as any[];
  const authorIds = rows
    .map((r) => String(r.created_by ?? ""))
    .filter(Boolean);
  const authors = await resolveStaffCommentAuthors(authorIds);
  return rows.map((r) => {
    const createdBy = r.created_by ? String(r.created_by) : null;
    const author = createdBy ? authors.get(createdBy) : null;
    return {
      ...r,
      created_by: createdBy,
      author_name: author?.name ?? "Team member",
      author_handle: author?.handle ?? null,
    } satisfies StaffProjectTaskComment;
  });
}

export async function createProjectTaskComment(input: {
  taskId: string;
  bodyHtml: string;
}) {
  const { supabase, user } = await assertStaffSession();
  const body = (input.bodyHtml ?? "").trim();
  if (!body) throw new Error("Comment body required");

  const { data, error } = await supabase
    .from("staff_project_task_comments")
    .insert({
      task_id: input.taskId,
      body_html: body,
      created_by: user.id,
    })
    .select("id, task_id, body_html, created_by, created_at")
    .single();
  if (error) throw new Error(error.message);

  // Mentions → notifications (best-effort; don't block comment save).
  try {
    const handles = extractMentionHandlesFromHtml(body);
    const recipients = await resolveMentionRecipients(handles);
    if (recipients.length > 0) {
      await createAndEmitUserNotifications(recipients, {
        title: "You were mentioned in a comment",
        body: "A staff member mentioned you on a project task.",
        href: `/staff/projects?task=${input.taskId}`,
      });
    }
  } catch {
    // ignore
  }

  const authors = await resolveStaffCommentAuthors([user.id]);
  const author = authors.get(user.id);
  return {
    ...(data as any),
    created_by: user.id,
    author_name: author?.name ?? displayNameForUser(user as any),
    author_handle: author?.handle ?? null,
  } satisfies StaffProjectTaskComment;
}

