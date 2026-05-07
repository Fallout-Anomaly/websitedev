import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadRoadmapBoard, type RoadmapCardRow } from "@/src/lib/roadmap";
import RoadmapCardMarkdown from "@/src/components/RoadmapCardMarkdown";
import RoadmapReactions from "./RoadmapReactions";

export const metadata: Metadata = {
  title: "Roadmap | Fallen World",
  description: "Public roadmap — what we’re working on and what’s next.",
};

function groupCardsByColumnId(
  cards: RoadmapCardRow[],
): Map<number, RoadmapCardRow[]> {
  const map = new Map<number, RoadmapCardRow[]>();
  for (const card of cards) {
    const list = map.get(card.column_id) ?? [];
    list.push(card);
    map.set(card.column_id, list);
  }
  return map;
}

export default async function RoadmapPage() {
  const supabase = await createClient();
  const board = await loadRoadmapBoard(supabase);
  const cardsByCol = groupCardsByColumnId(board.cards);
  const reactionsByCard = new Map<number, { emoji: string; count: number }[]>();
  for (const r of board.reactions) {
    const list = reactionsByCard.get(r.card_id) ?? [];
    list.push({ emoji: r.emoji, count: r.count });
    reactionsByCard.set(r.card_id, list);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-xs text-neutral-500">
          <Link href="/" className="text-neutral-400 hover:text-white">
            Home
          </Link>
          <span className="mx-2 text-neutral-700">/</span>
          <span className="text-neutral-300">Roadmap</span>
        </nav>

        <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Roadmap
            </h1>
          </div>
          <div className="text-xs text-neutral-500">
            Tip: scroll sideways for more columns.
          </div>
        </header>

        {board.columns.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6 text-sm text-neutral-300">
            No roadmap items yet.
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max items-start gap-4">
              {board.columns.map((col) => {
                const cards = cardsByCol.get(col.id) ?? [];
                return (
                  <section
                    key={col.id}
                    className="w-[272px] shrink-0 rounded-xl border border-white/10 bg-[#0f172a]/70 text-neutral-100 shadow-[0_10px_26px_rgba(0,0,0,0.28)] backdrop-blur-sm"
                  >
                    <header className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-xl border-b border-white/10 bg-[#0b1220]/70 px-3.5 py-3 backdrop-blur-sm">
                      <h2 className="text-sm font-semibold text-neutral-100">
                        {col.title}
                      </h2>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/70">
                        {cards.length}
                      </span>
                    </header>
                    <div className="flex flex-col gap-2 p-3">
                      {cards.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/15 bg-white/5 px-3 py-2 text-xs text-white/60">
                          Nothing here yet.
                        </div>
                      ) : (
                        cards.map((card) => (
                          <article
                            key={card.id}
                            className="rounded-lg bg-white/5 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.35)] ring-1 ring-white/10"
                          >
                            <h3 className="text-sm font-semibold text-neutral-100">
                              {card.title}
                            </h3>
                            {card.body ? (
                              <div className="mt-2">
                                <RoadmapCardMarkdown source={card.body} />
                              </div>
                            ) : null}

                            <RoadmapReactions
                              cardId={card.id}
                              initial={reactionsByCard.get(card.id) ?? []}
                            />
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-[11px] text-neutral-600">
          Fallen World · 2026
        </p>
      </div>
    </div>
  );
}

