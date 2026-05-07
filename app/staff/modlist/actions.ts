"use server";

import { createClient } from "@/lib/supabase/server";
import { assertStaffSession } from "@/src/lib/assert-staff-session";
import { isStaffAccount } from "@/src/lib/staff-access";
import { canViewStaffAuditLog } from "@/src/lib/staff-audit-admin";
import { displayNameForUser } from "@/src/lib/display-name";
import { avatarPresetForUser } from "@/src/lib/profile-avatar";
import {
  createAndEmitUserNotifications,
  extractMentionHandlesFromHtml,
  listAllStaffUserIds,
  resolveStaffHandles,
} from "@/src/lib/notifications";

export async function addModComment(modId: number, content: string, parentId: number | null = null) {
  try {
    const { supabase, user } = await assertStaffSession();

    const { data, error } = await supabase.from("mod_comments").insert({
      mod_id: modId,
      user_id: user.id,
      content,
      user_email: user.email,
      display_name: displayNameForUser(user),
      author_avatar_preset: avatarPresetForUser(user),
      parent_id: parentId,
    });

    if (error) {
      console.error("Error adding mod comment:", error);
      return { error: error.message };
    }

    await addActivityLog({
      mod_id: modId,
      action_type: parentId ? "REPLY_COMMENT" : "ADD_COMMENT",
      details: parentId ? `Replied to a note` : `Added a note to the mod`
    });

    const mentionedHandles = extractMentionHandlesFromHtml(content);
    const mentionedUserIds = (await resolveStaffHandles(mentionedHandles)).filter(
      (id) => id !== user.id,
    );

    const staffUserIds = (await listAllStaffUserIds()).filter((id) => id !== user.id);
    await Promise.all([
      createAndEmitUserNotifications(staffUserIds, {
        title: parentId ? "New reply on a mod note" : "New mod note",
        body: displayNameForUser(user),
        href: "/staff/modlist",
      }),
      createAndEmitUserNotifications(mentionedUserIds, {
        title: "You were mentioned in modlist",
        body: displayNameForUser(user),
        href: "/staff/modlist",
      }),
    ]);

    return { data };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getModComments(modId: number) {
  try {
    const { supabase } = await assertStaffSession();
    const { data, error } = await supabase
    .from("mod_comments")
    .select(
      "id, mod_id, user_id, user_email, display_name, author_avatar_preset, content, parent_id, created_at",
    )
    .eq("mod_id", modId)
    .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching mod comments:", error);
      return { data: [], error: error.message };
    }
    return { data: data || [], error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return { data: [], error: msg };
  }
}

/** One round-trip: tab badge counts (cheap head queries) + full comment thread payload. */
export async function loadModDrawerInitial(modId: number, modName: string) {
  try {
    const { supabase } = await assertStaffSession();

    const [threadsHead, activityHead, bugsHead, commentsRes] = await Promise.all([
    supabase
      .from("mod_comments")
      .select("id", { count: "exact", head: true })
      .eq("mod_id", modId)
      .is("parent_id", null),
    supabase
      .from("activity_log")
      .select("id", { count: "exact", head: true })
      .eq("mod_id", modId),
    supabase
      .from("bug_reports")
      .select("id", { count: "exact", head: true })
      .eq("mod_name", modName),
    supabase
      .from("mod_comments")
      .select(
        "id, mod_id, user_id, user_email, display_name, author_avatar_preset, content, parent_id, created_at",
      )
      .eq("mod_id", modId)
      .order("created_at", { ascending: true }),
  ]);

  const headErr =
    commentsRes.error?.message ||
    threadsHead.error?.message ||
    activityHead.error?.message ||
    bugsHead.error?.message ||
    null;

  const threads = threadsHead.count ?? 0;
  const activityEntries = activityHead.count ?? 0;
  const bugs = bugsHead.count ?? 0;

    return {
      error: headErr,
      comments: commentsRes.data ?? [],
      counts: {
        threads,
        activityEntries,
        bugs,
        timeline: threads + activityEntries,
      },
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return {
      error: msg,
      comments: [],
      counts: {
        threads: 0,
        activityEntries: 0,
        bugs: 0,
        timeline: 0,
      },
    };
  }
}

export async function getBugReportsForModName(modName: string) {
  try {
    const { supabase } = await assertStaffSession();
    const { data, error } = await supabase
    .from("bug_reports")
    .select("id, status, severity, issue_description, date_reported, reported_by")
    .eq("mod_name", modName)
    .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching bugs for mod:", error);
      return { data: [], error: error.message };
    }
    return { data: data || [], error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return { data: [], error: msg };
  }
}

export async function reportModBug(modId: number, modName: string, description: string, severity: string) {
  try {
    const { supabase, user } = await assertStaffSession();

    const { data, error } = await supabase.from("bug_reports").insert({
      mod_name: modName,
      issue_description: description,
      severity,
      reported_by: user.email,
      status: "New",
      date_reported: new Date().toISOString().slice(0, 10),
      comments: [],
      last_updated_by: user.email ?? null,
    });

    if (error) {
      console.error("Error reporting mod bug:", error);
      return { error: error.message };
    }

    await addActivityLog({
      mod_id: modId,
      action_type: "REPORT_BUG",
      details: `Reported a ${severity} severity bug`
    });

    return { data };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteModComment(commentId: number) {
  const { supabase, user } = await assertStaffSession();

  const { data: comment } = await supabase
    .from("mod_comments")
    .select("user_id, mod_id")
    .eq("id", commentId)
    .single();

  if (!comment || comment.user_id !== user.id) {
    return { error: "You can only delete your own comments." };
  }

  const { error, count } = await supabase
    .from("mod_comments")
    .delete({ count: 'exact' })
    .eq("id", commentId);

  if (error) {
    console.error("Error deleting comment:", error);
    return { error: error.message };
  }

  await addActivityLog({
    mod_id: comment.mod_id,
    action_type: "DELETE_COMMENT",
    details: `Deleted a note from the mod`
  });

  return { success: true };
}

export async function addActivityLog({ mod_id, action_type, details }: { mod_id: number | null, action_type: string, details: string }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !(await isStaffAccount(supabase, user))) return;

    // Use null if mod_id is 0 or invalid to avoid FK issues
    const targetModId = (mod_id === 0 || !mod_id) ? null : mod_id;

    await supabase.from("activity_log").insert({
      mod_id: targetModId,
      user_id: user.id,
      user_email: user.email,
      user_display_name: displayNameForUser(user),
      action_type,
      details,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Activity log error:", e);
  }
}

export async function getModActivity(modId: number) {
  try {
    const { supabase } = await assertStaffSession();
    const { data, error } = await supabase
    .from("activity_log")
    .select(
      "id, mod_id, user_id, user_email, user_display_name, action_type, details, created_at",
    )
    .eq("mod_id", modId)
    .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching activity:", error);
      return { data: [], error: error.message };
    }
    return { data: data || [], error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return { data: [], error: msg };
  }
}

export async function getAllActivity(page: number = 1, pageSize: number = 50) {
  try {
    const { supabase, user } = await assertStaffSession();
    if (!(await canViewStaffAuditLog(supabase, user))) {
      return { data: [], error: "Forbidden", total: 0 };
    }

    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from("activity_log")
      .select(
        "id, mod_id, user_id, user_email, user_display_name, action_type, details, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("DEBUG: Full Activity Error:", JSON.stringify(error, null, 2));
      return { data: [], error: error.message, total: 0 };
    }
    return { data: data || [], error: null, total: count || 0 };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return { data: [], error: msg, total: 0 };
  }
}

export async function updateModDetails(modId: number, updates: any) {
  const { supabase, user } = await assertStaffSession();

  const { error } = await supabase
    .from("modlist_entries")
    .update(updates)
    .eq("id", modId);

  if (error) {
    console.error("Error updating mod details:", error);
    return { error: error.message };
  }

  await addActivityLog({
    mod_id: modId,
    action_type: "EDIT_MOD",
    details: `Updated mod metadata: ${Object.keys(updates).join(", ")}`
  });

  return { success: true };
}

export async function updateBugReport(bugId: number, updates: any) {
  try {
    const { supabase, user } = await assertStaffSession();

    const { error } = await supabase
      .from("bug_reports")
      .update({
        ...updates,
        last_updated_by: user.email ?? null,
      })
      .eq("id", bugId);

    if (error) {
      console.error("Error updating bug report:", error);
      return { error: error.message };
    }

    await addActivityLog({
      mod_id: null,
      action_type: "BUG_UPDATE",
      details: `Modified Bug Report #${bugId}: ${Object.keys(updates).join(", ")}`
    });

    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getBugComments(bugId: number) {
  try {
    const { supabase } = await assertStaffSession();
    const { data, error } = await supabase
      .from("bug_reports")
      .select("comments")
      .eq("id", bugId)
      .single();

    if (error) {
      console.error("Error fetching bug comments:", error);
      return { data: [], error: error.message };
    }

    const raw = Array.isArray(data?.comments) ? data.comments : [];
    const normalized = raw.map((c: Record<string, unknown>) => ({
      id: Number(c.id),
      bug_id: bugId,
      user_id: String(c.user_id ?? ""),
      user_email: String(c.user_email ?? ""),
      display_name:
        typeof c.display_name === "string" ? c.display_name : "",
      avatar_preset:
        typeof c.avatar_preset === "string" ? c.avatar_preset : "",
      content: String(c.content ?? ""),
      parent_id: c.parent_id != null ? Number(c.parent_id) : null,
      created_at: String(c.created_at ?? ""),
    }));

    return { data: normalized, error: null };
  } catch (e: any) {
    return { data: [], error: e.message };
  }
}

export async function addBugComment(
  bugId: number,
  content: string,
  parentId: number | null = null
) {
  try {
    const { supabase, user } = await assertStaffSession();

    const { data: bug, error: fetchError } = await supabase
      .from("bug_reports")
      .select("comments")
      .eq("id", bugId)
      .single();

    if (fetchError) return { error: fetchError.message };

    const currentComments = Array.isArray(bug.comments) ? bug.comments : [];
    const newId = Date.now();
    const updatedComments = [
      ...currentComments,
      {
        id: newId,
        bug_id: bugId,
        content,
        parent_id: parentId,
        user_id: user.id,
        user_email: user.email,
        display_name: displayNameForUser(user),
        avatar_preset: avatarPresetForUser(user),
        created_at: new Date().toISOString(),
      },
    ];

    const { error } = await supabase
      .from("bug_reports")
      .update({
        comments: updatedComments,
        last_updated_by: user.email ?? null,
      })
      .eq("id", bugId);

    if (error) return { error: error.message };

    await addActivityLog({
      mod_id: null,
      action_type: "ADD_BUG_NOTE",
      details: `Added a note to Bug Report #${bugId}`,
    });

    const mentionedHandles = extractMentionHandlesFromHtml(content);
    const mentionedUserIds = (await resolveStaffHandles(mentionedHandles)).filter(
      (id) => id !== user.id,
    );

    const staffUserIds = (await listAllStaffUserIds()).filter((id) => id !== user.id);
    await Promise.all([
      createAndEmitUserNotifications(staffUserIds, {
        title: `New note on Bug Report #${bugId}`,
        body: displayNameForUser(user),
        href: "/staff/bugs",
      }),
      createAndEmitUserNotifications(mentionedUserIds, {
        title: `You were mentioned on Bug Report #${bugId}`,
        body: displayNameForUser(user),
        href: "/staff/bugs",
      }),
    ]);

    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteBugComment(bugId: number, commentId: number) {
  try {
    const { supabase, user } = await assertStaffSession();

    const { data: bug, error: fetchError } = await supabase
      .from("bug_reports")
      .select("comments")
      .eq("id", bugId)
      .single();

    if (fetchError) return { error: fetchError.message };

    const currentComments = Array.isArray(bug.comments) ? bug.comments : [];
    const target = currentComments.find(
      (c: { id?: number }) => Number(c.id) === commentId
    ) as { user_id?: string } | undefined;

    if (!target || String(target.user_id) !== user.id) {
      return { error: "You can only delete your own comments." };
    }

    const updatedComments = currentComments.filter(
      (c: { id?: number }) => Number(c.id) !== commentId
    );

    const { error } = await supabase
      .from("bug_reports")
      .update({
        comments: updatedComments,
        last_updated_by: user.email ?? null,
      })
      .eq("id", bugId);

    if (error) return { error: error.message };

    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}
