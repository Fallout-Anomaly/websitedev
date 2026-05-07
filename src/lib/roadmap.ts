import type { SupabaseClient } from "@supabase/supabase-js";

export type RoadmapColumnRow = {
  id: number;
  title: string;
  sort_order: number;
};

export type RoadmapCardRow = {
  id: number;
  column_id: number;
  title: string;
  body: string | null;
  sort_order: number;
};

export type RoadmapReactionCount = {
  card_id: number;
  emoji: string;
  count: number;
};

export type RoadmapBoard = {
  columns: RoadmapColumnRow[];
  cards: RoadmapCardRow[];
  reactions: RoadmapReactionCount[];
};

export async function loadRoadmapBoard(
  supabase: SupabaseClient,
): Promise<RoadmapBoard> {
  const [columnsRes, cardsRes, reactionsRes] = await Promise.all([
    supabase
      .from("roadmap_columns")
      .select("id, title, sort_order")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("roadmap_cards")
      .select("id, column_id, title, body, sort_order")
      .order("column_id", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("roadmap_card_reactions")
      .select("card_id, emoji")
      .order("card_id", { ascending: true }),
  ]);

  if (columnsRes.error) {
    console.error("loadRoadmapBoard columns:", columnsRes.error.message);
  }
  if (cardsRes.error) {
    console.error("loadRoadmapBoard cards:", cardsRes.error.message);
  }
  if (reactionsRes.error) {
    console.error("loadRoadmapBoard reactions:", reactionsRes.error.message);
  }

  const counts = new Map<string, RoadmapReactionCount>();
  for (const row of (reactionsRes.data ?? []) as { card_id: number; emoji: string }[]) {
    const key = `${row.card_id}:${row.emoji}`;
    const prev = counts.get(key);
    counts.set(key, {
      card_id: row.card_id,
      emoji: row.emoji,
      count: (prev?.count ?? 0) + 1,
    });
  }

  return {
    columns: (columnsRes.data ?? []) as RoadmapColumnRow[],
    cards: (cardsRes.data ?? []) as RoadmapCardRow[],
    reactions: Array.from(counts.values()),
  };
}

