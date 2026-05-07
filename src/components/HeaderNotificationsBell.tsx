"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRealtime } from "@/lib/realtime-client";

type NotificationPayload = {
  id: string;
  title: string;
  body?: string;
  href?: string;
  createdAt: string;
  readAt?: string | null;
};

type Props = {
  userId: string | null;
  isStaff: boolean;
};

export default function HeaderNotificationsBell({ userId, isStaff }: Props) {
  const channels = useMemo(() => {
    const out: string[] = [];
    if (userId) out.push(`user:${userId}`);
    if (isStaff) out.push("staff");
    return out;
  }, [isStaff, userId]);

  const [items, setItems] = useState<NotificationPayload[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            unread?: number;
            items?: NotificationPayload[];
          }
        | null;
      if (!res.ok || !data?.ok) return;
      setUnread(typeof data.unread === "number" ? data.unread : 0);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      // ignore
    }
  }, []);

  useRealtime({
    channels,
    events: ["notification.created"],
    onData({ data }) {
      setItems((prev) => [data, ...prev].slice(0, 50));
      setUnread((n) => Math.min(99, n + 1));
    },
  });

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = useCallback(async () => {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void markRead();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const el = panelRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  if (channels.length === 0) return null;

  return (
    <div ref={panelRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.06] hover:text-white transition-colors"
        aria-expanded={open}
        aria-label="Notifications"
        title="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
            {Math.min(unread, 99)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <div className="text-xs font-semibold text-white">Notifications</div>
            <button
              type="button"
              onClick={() => {
                setItems([]);
                setUnread(0);
                void fetch("/api/notifications/read", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({}),
                }).catch(() => {});
              }}
              className="text-[11px] text-white/60 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="max-h-[50vh] overflow-auto">
            {items.length === 0 ? (
              <div className="px-3 py-4 text-xs text-white/60">
                No notifications.
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {items.map((n) => (
                  <li key={n.id} className="px-3 py-3">
                    {n.href ? (
                      <a
                        href={n.href}
                        className="block text-sm font-medium text-white hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        {n.title}
                      </a>
                    ) : (
                      <div className="text-sm font-medium text-white">{n.title}</div>
                    )}
                    {n.body ? (
                      <div className="mt-1 text-xs text-white/60">{n.body}</div>
                    ) : null}
                    <div className="mt-1 text-[10px] text-white/40">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

