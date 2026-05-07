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

export type RoadmapBoard = {
  columns: RoadmapColumnRow[];
  cards: RoadmapCardRow[];
};

export async function loadRoadmapBoard(
  supabase: SupabaseClient,
): Promise<RoadmapBoard> {
  const [columnsRes, cardsRes] = await Promise.all([
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
  ]);

  if (columnsRes.error) {
    console.error("loadRoadmapBoard columns:", columnsRes.error.message);
  }
  if (cardsRes.error) {
    console.error("loadRoadmapBoard cards:", cardsRes.error.message);
  }

  return {
    columns: (columnsRes.data ?? []) as RoadmapColumnRow[],
    cards: (cardsRes.data ?? []) as RoadmapCardRow[],
  };
}

