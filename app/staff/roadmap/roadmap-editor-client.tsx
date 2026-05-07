"use client";

import { memo, useCallback, useMemo, useState, useTransition } from "react";
import type { RoadmapBoard, RoadmapCardRow, RoadmapColumnRow } from "@/src/lib/roadmap";
import {
  createRoadmapCard,
  createRoadmapColumn,
  deleteRoadmapCard,
  deleteRoadmapColumn,
  renameRoadmapColumn,
  saveRoadmapBoardOrder,
  updateRoadmapCard,
} from "./actions";

type Props = {
  initialBoard: RoadmapBoard;
};

function bySort(a: { sort_order: number; id: number }, b: { sort_order: number; id: number }) {
  return a.sort_order - b.sort_order || a.id - b.id;
}

function groupCards(cards: RoadmapCardRow[]): Map<number, RoadmapCardRow[]> {
  const map = new Map<number, RoadmapCardRow[]>();
  for (const c of cards) {
    const list = map.get(c.column_id) ?? [];
    list.push(c);
    map.set(c.column_id, list);
  }
  for (const [k, v] of map.entries()) map.set(k, [...v].sort(bySort));
  return map;
}

export default function RoadmapEditorClient({ initialBoard }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [columns, setColumns] = useState<RoadmapColumnRow[]>(
    [...initialBoard.columns].sort(bySort),
  );
  const [cards, setCards] = useState<RoadmapCardRow[]>(
    [...initialBoard.cards].sort(bySort),
  );
  const [dirtyOrder, setDirtyOrder] = useState(false);

  const cardsByCol = useMemo(() => groupCards(cards), [cards]);

  const [newColumnTitle, setNewColumnTitle] = useState("");

  const setErr = useCallback((msg: string | null) => {
    setError(msg);
    if (msg) window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onDragStartCard = useCallback((e: React.DragEvent, cardId: number) => {
    e.dataTransfer.setData("text/roadmap-card-id", String(cardId));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const allowDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  function moveCardLocal(cardId: number, toColumnId: number, toIndex: number) {
    setCards((prev) => {
      const dragged = prev.find((c) => c.id === cardId);
      if (!dragged) return prev;

      const next = prev.filter((c) => c.id !== cardId);
      const inTarget = next.filter((c) => c.column_id === toColumnId).sort(bySort);
      const inOther = next.filter((c) => c.column_id !== toColumnId);

      const idx = Math.max(0, Math.min(toIndex, inTarget.length));
      const inserted: RoadmapCardRow = { ...dragged, column_id: toColumnId };
      inTarget.splice(idx, 0, inserted);

      const normalizedTarget = inTarget.map((c, i) => ({ ...c, sort_order: i }));
      const normalizedOthers = inOther.map((c) => c);

      const sourceColumnId = dragged.column_id;
      if (sourceColumnId !== toColumnId) {
        const source = normalizedOthers
          .filter((c) => c.column_id === sourceColumnId)
          .sort(bySort)
          .map((c, i) => ({ ...c, sort_order: i }));
        const withoutSource = normalizedOthers.filter((c) => c.column_id !== sourceColumnId);
        setDirtyOrder(true);
        return [...withoutSource, ...source, ...normalizedTarget].sort((a, b) => {
          if (a.column_id !== b.column_id) return a.column_id - b.column_id;
          return bySort(a, b);
        });
      }

      setDirtyOrder(true);
      return [...normalizedOthers, ...normalizedTarget].sort((a, b) => {
        if (a.column_id !== b.column_id) return a.column_id - b.column_id;
        return bySort(a, b);
      });
    });
  }

  function onDropOnColumn(e: React.DragEvent, columnId: number) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/roadmap-card-id");
    const id = Number(raw);
    if (!Number.isFinite(id)) return;
    const targetCards = (cardsByCol.get(columnId) ?? []).sort(bySort);
    moveCardLocal(id, columnId, targetCards.length);
  }

  function onDropOnCard(e: React.DragEvent, columnId: number, beforeCardId: number) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/roadmap-card-id");
    const id = Number(raw);
    if (!Number.isFinite(id)) return;
    const targetCards = (cardsByCol.get(columnId) ?? []).sort(bySort);
    const idx = targetCards.findIndex((c) => c.id === beforeCardId);
    moveCardLocal(id, columnId, idx === -1 ? targetCards.length : idx);
  }

  function moveColumnLocal(columnId: number, delta: -1 | 1) {
    setColumns((prev) => {
      const idx = prev.findIndex((c) => c.id === columnId);
      if (idx === -1) return prev;
      const nextIdx = idx + delta;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const next = [...prev];
      const [it] = next.splice(idx, 1);
      next.splice(nextIdx, 0, it);
      const normalized = next.map((c, i) => ({ ...c, sort_order: i }));
      setDirtyOrder(true);
      return normalized;
    });
  }

  async function saveOrder() {
    setErr(null);
    const payload = {
      columns: columns.map((c, i) => ({ id: c.id, sort_order: i })),
      cards: cards
        .slice()
        .sort((a, b) => a.column_id - b.column_id || bySort(a, b))
        .map((c) => c),
    };

    // Ensure per-column contiguous sort_order.
    const byCol = new Map<number, RoadmapCardRow[]>();
    for (const c of payload.cards) {
      const list = byCol.get(c.column_id) ?? [];
      list.push(c);
      byCol.set(c.column_id, list);
    }
    const normalizedCards: { id: number; column_id: number; sort_order: number }[] = [];
    for (const [colId, list] of byCol.entries()) {
      list.sort(bySort).forEach((c, i) => {
        normalizedCards.push({ id: c.id, column_id: colId, sort_order: i });
      });
    }

    startTransition(async () => {
      const res = await saveRoadmapBoardOrder({
        columns: payload.columns,
        cards: normalizedCards,
      });
      if ("error" in res && res.error) {
        setErr(res.error);
        return;
      }
      setDirtyOrder(false);
    });
  }

  return (
    <div className="space-y-4 text-neutral-100">
      {error ? (
        <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-3 text-sm text-neutral-100">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/40 p-3 shadow-[0_10px_26px_rgba(0,0,0,0.24)]">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-100">Board controls</p>
          <p className="mt-1 text-xs text-neutral-400">
            Drag cards between columns (or within a column), then click{" "}
            <span className="font-semibold text-neutral-200">Save order</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={saveOrder}
          disabled={!dirtyOrder || isPending}
          className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
            dirtyOrder && !isPending
              ? "bg-emerald-500 text-black hover:bg-emerald-400"
              : "bg-white/10 text-white/60"
          }`}
        >
          Save order
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-3 shadow-[0_10px_26px_rgba(0,0,0,0.24)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            const title = newColumnTitle.trim();
            if (!title) return;
            startTransition(async () => {
              const res = await createRoadmapColumn(title);
              if ("error" in res && res.error) setErr(res.error);
              setNewColumnTitle("");
            });
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="flex min-w-[220px] flex-1 flex-col gap-1">
            <span className="text-xs text-neutral-400">New column</span>
            <input
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="e.g. Planned"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-white/20"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-neutral-100 hover:bg-white/15 disabled:opacity-60"
          >
            Add column
          </button>
        </form>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-start gap-4">
            {columns.map((col, colIndex) => {
              const colCards = cardsByCol.get(col.id) ?? [];
              return (
                <section
                  key={col.id}
                  className="w-[272px] shrink-0 rounded-xl border border-white/10 bg-[#0f172a]/70 text-neutral-100 shadow-[0_10px_26px_rgba(0,0,0,0.28)]"
                  onDragOver={allowDrop}
                  onDrop={(e) => onDropOnColumn(e, col.id)}
                >
                  <header className="rounded-t-xl border-b border-white/10 bg-[#0b1220]/70 px-3.5 py-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-white/45">
                        Column {colIndex + 1}
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/70">
                        {colCards.length}
                      </span>
                    </div>
                <div className="flex items-start justify-between gap-2">
                  <input
                    defaultValue={col.title}
                    onBlur={(e) => {
                      const next = e.currentTarget.value.trim();
                      if (!next || next === col.title) {
                        e.currentTarget.value = col.title;
                        return;
                      }
                      startTransition(async () => {
                        const res = await renameRoadmapColumn(col.id, next);
                        if ("error" in res && res.error) setErr(res.error);
                      });
                    }}
                    className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-neutral-100 outline-none focus:border-white/15 focus:bg-white/5"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={colIndex === 0 || isPending}
                      onClick={() => moveColumnLocal(col.id, -1)}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70 hover:bg-white/10 disabled:opacity-40"
                      title="Move left"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={colIndex === columns.length - 1 || isPending}
                      onClick={() => moveColumnLocal(col.id, 1)}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70 hover:bg-white/10 disabled:opacity-40"
                      title="Move right"
                    >
                      →
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (!confirm("Delete column and all cards?")) return;
                      startTransition(async () => {
                        const res = await deleteRoadmapColumn(col.id);
                        if ("error" in res && res.error) setErr(res.error);
                      });
                    }}
                    className="text-[11px] font-medium text-red-300 hover:underline disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
                  </header>

                  <div className="flex flex-col gap-2 p-3">
                    <NewCardForm disabled={isPending} columnId={col.id} onError={setErr} />

                    <div className="flex max-h-[52vh] flex-col gap-2 overflow-auto pr-1">
                      {colCards.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/15 bg-white/5 px-3 py-2 text-xs text-white/60">
                          Drop cards here.
                        </div>
                      ) : null}

                      {colCards.map((card) => (
                        <div
                          key={card.id}
                          draggable
                          onDragStart={(e) => onDragStartCard(e, card.id)}
                          onDragOver={allowDrop}
                          onDrop={(e) => onDropOnCard(e, col.id, card.id)}
                          className="rounded-lg bg-white/5 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.35)] ring-1 ring-white/10 hover:bg-white/7"
                        >
                          <CardEditor card={card} disabled={isPending} onError={setErr} />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
        </div>
      </div>
    </div>
  );
}

const NewCardForm = memo(function NewCardForm({
  columnId,
  disabled,
  onError,
}: {
  columnId: number;
  disabled: boolean;
  onError: (msg: string | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onError(null);
        const t = title.trim();
        if (!t) return;
        startTransition(async () => {
          const res = await createRoadmapCard(columnId, t, body);
          if ("error" in res && res.error) onError(res.error);
          setTitle("");
          setBody("");
        });
      }}
      className="rounded-lg border border-white/10 bg-black/20 p-3"
    >
      <p className="text-xs font-semibold text-white/70">New card</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        disabled={disabled || isPending}
        className="mt-2 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20 disabled:opacity-60"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Optional details"
        disabled={disabled || isPending}
        rows={3}
        className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs leading-relaxed text-white/80 placeholder:text-white/40 outline-none focus:border-white/20 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || isPending}
        className="mt-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-black hover:bg-emerald-400 disabled:opacity-60"
      >
        Add card
      </button>
    </form>
  );
});

const CardEditor = memo(function CardEditor({
  card,
  disabled,
  onError,
}: {
  card: RoadmapCardRow;
  disabled: boolean;
  onError: (msg: string | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [body, setBody] = useState(card.body ?? "");

  return (
    <div>
      {!editing ? (
        <>
          <h3 className="text-sm font-semibold text-neutral-100">{card.title}</h3>
          {card.body ? (
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-neutral-300">
              {card.body}
            </p>
          ) : null}
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              disabled={disabled || isPending}
              onClick={() => setEditing(true)}
              className="text-[11px] font-medium text-emerald-300 hover:underline disabled:opacity-60"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={disabled || isPending}
              onClick={() => {
                if (!confirm("Delete this card?")) return;
                onError(null);
                startTransition(async () => {
                  const res = await deleteRoadmapCard(card.id);
                  if ("error" in res && res.error) onError(res.error);
                });
              }}
              className="text-[11px] font-medium text-red-300 hover:underline disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onError(null);
            const t = title.trim();
            if (!t) return;
            startTransition(async () => {
              const res = await updateRoadmapCard(card.id, { title: t, body });
              if ("error" in res && res.error) onError(res.error);
              setEditing(false);
            });
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={disabled || isPending}
            className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-white/20 disabled:opacity-60"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={disabled || isPending}
            rows={4}
            className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs leading-relaxed text-white/80 outline-none focus:border-white/20 disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setTitle(card.title);
                setBody(card.body ?? "");
              }}
              className="text-[11px] font-medium text-white/60 hover:text-white/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled || isPending}
              className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
});

