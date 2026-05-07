"use server";

import { revalidatePath } from "next/cache";
import { assertStaffSession } from "@/src/lib/assert-staff-session";

function mustInt(value: unknown, label: string): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error(`Invalid ${label}.`);
  }
  return n;
}

export async function createRoadmapColumn(titleRaw: string) {
  const title = String(titleRaw ?? "").trim();
  if (!title) return { error: "Title is required." };

  try {
    const { supabase } = await assertStaffSession();

    const { data: maxRow } = await supabase
      .from("roadmap_columns")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = (maxRow?.sort_order ?? -1) + 1;
    const { error } = await supabase
      .from("roadmap_columns")
      .insert({ title, sort_order: sortOrder });
    if (error) return { error: error.message };

    revalidatePath("/roadmap");
    revalidatePath("/staff/roadmap");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
}

export async function renameRoadmapColumn(columnId: number, titleRaw: string) {
  const title = String(titleRaw ?? "").trim();
  if (!title) return { error: "Title is required." };

  try {
    const { supabase } = await assertStaffSession();
    const id = mustInt(columnId, "column id");
    const { error } = await supabase
      .from("roadmap_columns")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/roadmap");
    revalidatePath("/staff/roadmap");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
}

export async function deleteRoadmapColumn(columnId: number) {
  try {
    const { supabase } = await assertStaffSession();
    const id = mustInt(columnId, "column id");
    const { error } = await supabase.from("roadmap_columns").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/roadmap");
    revalidatePath("/staff/roadmap");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not delete." };
  }
}

export async function createRoadmapCard(
  columnId: number,
  titleRaw: string,
  bodyRaw: string,
) {
  const title = String(titleRaw ?? "").trim();
  const body = String(bodyRaw ?? "").trim() || null;
  if (!title) return { error: "Title is required." };

  try {
    const { supabase } = await assertStaffSession();
    const colId = mustInt(columnId, "column id");

    const { data: maxRow } = await supabase
      .from("roadmap_cards")
      .select("sort_order")
      .eq("column_id", colId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = (maxRow?.sort_order ?? -1) + 1;

    const { error } = await supabase.from("roadmap_cards").insert({
      column_id: colId,
      title,
      body,
      sort_order: sortOrder,
    });
    if (error) return { error: error.message };

    revalidatePath("/roadmap");
    revalidatePath("/staff/roadmap");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
}

export async function updateRoadmapCard(
  cardId: number,
  fields: { title?: string; body?: string | null },
) {
  try {
    const { supabase } = await assertStaffSession();
    const id = mustInt(cardId, "card id");
    const title = fields.title != null ? String(fields.title).trim() : undefined;
    const body =
      fields.body != null ? (String(fields.body).trim() || null) : undefined;

    if (title !== undefined && !title) return { error: "Title is required." };

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (title !== undefined) patch.title = title;
    if (body !== undefined) patch.body = body;

    const { error } = await supabase.from("roadmap_cards").update(patch).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/roadmap");
    revalidatePath("/staff/roadmap");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
}

export async function deleteRoadmapCard(cardId: number) {
  try {
    const { supabase } = await assertStaffSession();
    const id = mustInt(cardId, "card id");
    const { error } = await supabase.from("roadmap_cards").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/roadmap");
    revalidatePath("/staff/roadmap");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not delete." };
  }
}

const ALLOWED_REACTION_EMOJIS = new Set(["👍", "👎", "❤️", "🚀", "🎉", "😄", "👀"]);

export async function addRoadmapReaction(cardId: number, emojiRaw: string) {
  const emoji = String(emojiRaw ?? "").trim();
  if (!ALLOWED_REACTION_EMOJIS.has(emoji)) return { error: "Invalid reaction." };

  try {
    const { supabase, user } = await assertStaffSession();
    const id = mustInt(cardId, "card id");
    const { error } = await supabase.from("roadmap_card_reactions").insert({
      card_id: id,
      emoji,
      created_by: user.id,
      client_id: crypto.randomUUID(),
    });
    if (error) return { error: error.message };
    revalidatePath("/roadmap");
    revalidatePath("/staff/roadmap");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not react." };
  }
}

type SaveBoardPayload = {
  columns: { id: number; sort_order: number }[];
  cards: { id: number; column_id: number; sort_order: number }[];
};

export async function saveRoadmapBoardOrder(payload: SaveBoardPayload) {
  try {
    const { supabase } = await assertStaffSession();
    const cols = Array.isArray(payload.columns) ? payload.columns : [];
    const cards = Array.isArray(payload.cards) ? payload.cards : [];

    await Promise.all([
      Promise.all(
        cols.map((c) =>
          supabase
            .from("roadmap_columns")
            .update({ sort_order: mustInt(c.sort_order, "sort order") })
            .eq("id", mustInt(c.id, "column id")),
        ),
      ),
      Promise.all(
        cards.map((c) =>
          supabase
            .from("roadmap_cards")
            .update({
              column_id: mustInt(c.column_id, "column id"),
              sort_order: mustInt(c.sort_order, "sort order"),
            })
            .eq("id", mustInt(c.id, "card id")),
        ),
      ),
    ]);

    revalidatePath("/roadmap");
    revalidatePath("/staff/roadmap");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save order." };
  }
}

