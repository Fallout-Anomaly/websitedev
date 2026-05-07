"use client";

import { useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type Reaction = { emoji: string; count: number };

type Props = {
  cardId: number;
  initial: Reaction[];
};

const QUICK = ["👍", "❤️", "🚀", "🎉", "👀"] as const;

function getClientId(): string {
  const key = "roadmap_react_client_id_v1";
  const existing = globalThis.localStorage?.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  globalThis.localStorage?.setItem(key, next);
  return next;
}

export default function RoadmapReactions({ cardId, initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<Reaction[]>(initial);

  const sorted = useMemo(
    () =>
      items
        .slice()
        .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji)),
    [items],
  );

  function react(emoji: string) {
    const e = emoji.trim();
    if (!e) return;
    // optimistic UI
    setItems((prev) => {
      const next = [...prev];
      const idx = next.findIndex((r) => r.emoji === e);
      if (idx !== -1) next[idx] = { ...next[idx], count: next[idx].count + 1 };
      else next.push({ emoji: e, count: 1 });
      return next;
    });

    startTransition(async () => {
      const supabase = createClient();
      const clientId = getClientId();
      const { error } = await supabase.from("roadmap_card_reactions").insert({
        card_id: cardId,
        emoji: e,
        created_by: null,
        client_id: clientId,
      });
      if (error) {
        // rollback optimistic count
        setItems((prev) => {
          const next = [...prev];
          const idx = next.findIndex((r) => r.emoji === e);
          if (idx === -1) return prev;
          const count = next[idx].count - 1;
          if (count <= 0) next.splice(idx, 1);
          else next[idx] = { ...next[idx], count };
          return next;
        });
      }
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {sorted.map((r) => (
        <button
          key={r.emoji}
          type="button"
          disabled={isPending}
          onClick={() => react(r.emoji)}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10 disabled:opacity-60"
          title="Add reaction"
        >
          <span>{r.emoji}</span>
          <span className="font-mono text-[10px] text-white/60">{r.count}</span>
        </button>
      ))}
      <div className="ml-0.5 flex items-center gap-1">
        {QUICK.map((emoji) => (
          <button
            key={emoji}
            type="button"
            disabled={isPending}
            onClick={() => react(emoji)}
            className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[12px] hover:bg-white/10 disabled:opacity-60"
            title="Add reaction"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

