"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertStaffSession } from "@/src/lib/assert-staff-session";
import { normalizeGoogleSheetsUrl } from "@/src/lib/google-sheets-url";
import { slugify } from "@/src/lib/slugify";
import { displayNameForUser } from "@/src/lib/display-name";
import { avatarPresetForUser } from "@/src/lib/profile-avatar";

export type SheetComment = {
  id: string;
  author_email: string | null;
  author_display_name?: string | null;
  author_avatar_preset?: string | null;
  body: string;
  created_at: string;
};

async function allocateSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseTitle: string
): Promise<string> {
  const base = slugify(baseTitle) || "sheet";
  for (let i = 0; i < 100; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await supabase
      .from("staff_google_sheets")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  throw new Error("Could not generate a unique slug.");
}

export async function createStaffSheet(
  formData: FormData
): Promise<{ slug?: string; error?: string }> {
  try {
    const { supabase, user } = await assertStaffSession();

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return { error: "Title is required." };

    const urlRaw = String(formData.get("google_sheets_url") ?? "").trim();
    const googleSheetsUrl = normalizeGoogleSheetsUrl(urlRaw);
    if (!googleSheetsUrl) {
      return {
        error:
          "Paste a valid Google Sheets URL (docs.google.com/spreadsheets/d/…).",
      };
    }

    const category = String(formData.get("category") ?? "").trim() || null;
    const notes = String(formData.get("notes") ?? "").trim() || null;

    const { data: maxRow } = await supabase
      .from("staff_google_sheets")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = (maxRow?.sort_order ?? -1) + 1;
    const slug = await allocateSlug(supabase, title);

    const { error } = await supabase.from("staff_google_sheets").insert({
      slug,
      title,
      google_sheets_url: googleSheetsUrl,
      category,
      notes,
      sort_order: sortOrder,
      created_by_email: user.email ?? null,
      updated_at: new Date().toISOString(),
    });

    if (error) return { error: error.message };

    revalidatePath("/staff/sheets");
    return { slug };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not save.",
    };
  }
}

export async function updateStaffSheetMeta(formData: FormData): Promise<{
  ok?: boolean;
  error?: string;
}> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    const session = await assertStaffSession();
    supabase = session.supabase;
  } catch {
    return { error: "Unauthorized" };
  }

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { error: "Missing slug." };

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const urlRaw = String(formData.get("google_sheets_url") ?? "").trim();
  const googleSheetsUrl = normalizeGoogleSheetsUrl(urlRaw);
  if (!googleSheetsUrl) {
    return { error: "Invalid Google Sheets URL." };
  }

  if (!title) return { error: "Title is required." };

  const { error } = await supabase
    .from("staff_google_sheets")
    .update({
      title,
      category,
      notes,
      google_sheets_url: googleSheetsUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);

  if (error) return { error: error.message };
  revalidatePath("/staff/sheets");
  revalidatePath(`/staff/sheets/${slug}`);
  return { ok: true };
}

export async function addStaffSheetComment(
  slug: string,
  body: string
): Promise<{ ok?: boolean; error?: string }> {
  const text = body.trim();
  if (!text) return { error: "Comment cannot be empty." };

  let supabase: Awaited<ReturnType<typeof createClient>>;
  let authorLabel: string;
  let authorPreset: string;
  try {
    const session = await assertStaffSession();
    supabase = session.supabase;
    authorLabel = displayNameForUser(session.user);
    authorPreset = avatarPresetForUser(session.user);
  } catch {
    return { error: "Unauthorized" };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("staff_google_sheets")
    .select("id, comments")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchErr || !row) return { error: "Sheet not found." };

  const prev = Array.isArray(row.comments) ? row.comments : [];
  const next: SheetComment[] = [
    ...prev.map((c: unknown) => c as SheetComment),
    {
      id: crypto.randomUUID(),
      author_email: null,
      author_display_name: authorLabel,
      author_avatar_preset: authorPreset,
      body: text,
      created_at: new Date().toISOString(),
    },
  ];

  const { error } = await supabase
    .from("staff_google_sheets")
    .update({
      comments: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) return { error: error.message };
  revalidatePath(`/staff/sheets/${slug}`);
  return { ok: true };
}

export async function deleteStaffSheet(
  slug: string
): Promise<{ ok: boolean; error?: string }> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    const session = await assertStaffSession();
    supabase = session.supabase;
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("staff_google_sheets")
    .delete()
    .eq("slug", slug);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/staff/sheets");
  return { ok: true };
}
