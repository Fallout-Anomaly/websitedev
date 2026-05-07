"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Props = {
  reference: string;
};

export default function StaffTicketReplyForm({ reference }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const message = text.trim();
      if (!message || sending) return;
      setSending(true);
      setError(null);
      try {
        const res = await fetch("/api/staff/support-tickets/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, message }),
        });
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          hint?: string;
        } | null;
        if (!res.ok || !data?.ok) {
          const parts = [data?.error, data?.hint].filter(Boolean);
          setError(parts.length > 0 ? parts.join(" — ") : "Could not send");
          return;
        }
        setText("");
        router.refresh();
      } catch {
        setError("Network error");
      } finally {
        setSending(false);
      }
    },
    [reference, router, sending, text],
  );

  return (
    <form onSubmit={send} className="mt-4 space-y-2 border-t border-[#30363d] pt-4">
      <label className="block text-xs font-medium text-[#8b949e]">
        Staff reply
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Visible to the player when they look up this ticket with their ticket number."
          className="mt-1.5 w-full resize-y rounded border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:outline-none"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-md bg-[#238636] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Sending…" : "Post reply"}
        </button>
        {error ? (
          <span className="text-xs text-[#f85149]">{error}</span>
        ) : null}
      </div>
    </form>
  );
}
