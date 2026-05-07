"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Props = {
  reference: string;
  initialStatus: string;
  filedBugReportId: number | null;
};

export default function StaffSupportTicketActions({
  reference,
  initialStatus,
  filedBugReportId: initialFiledId,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState<"close" | "reopen" | "bug" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filedId, setFiledId] = useState(initialFiledId);

  useEffect(() => {
    setStatus(initialStatus);
    setFiledId(initialFiledId);
  }, [initialStatus, initialFiledId]);

  const setClosed = useCallback(
    async (next: "open" | "closed") => {
      setBusy(next === "closed" ? "close" : "reopen");
      setError(null);
      try {
        const res = await fetch("/api/staff/support-tickets/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, status: next === "closed" ? "closed" : "open" }),
        });
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          status?: string;
        } | null;
        if (!res.ok || !data?.ok) {
          setError(data?.error ?? "Could not update status");
          return;
        }
        setStatus(data.status ?? next);
        router.refresh();
      } catch {
        setError("Network error");
      } finally {
        setBusy(null);
      }
    },
    [reference, router],
  );

  const fileBug = useCallback(async () => {
    if (filedId != null) return;
    if (!confirm("Create a new row in the modlist bug tracker from this ticket?")) {
      return;
    }
    setBusy("bug");
    setError(null);
    try {
      const res = await fetch("/api/staff/support-tickets/file-bug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        bugReportId?: number;
      } | null;

      if (res.status === 409 && data?.bugReportId != null) {
        setFiledId(data.bugReportId);
        router.refresh();
        return;
      }

      if (!res.ok || !data?.ok || data.bugReportId == null) {
        setError(data?.error ?? "Could not file bug report");
        return;
      }

      setFiledId(data.bugReportId);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }, [filedId, reference, router]);

  const isClosed = status === "closed";

  return (
    <div className="flex flex-col gap-3 border-b border-[#30363d] pb-6">
      <div className="flex flex-wrap items-center gap-2">
        {isClosed ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void setClosed("open")}
            className="rounded-md border border-[#30363d] bg-[#21262d] px-3 py-1.5 text-sm font-medium text-[#c9d1d9] hover:bg-[#30363d] disabled:opacity-50"
          >
            {busy === "reopen" ? "Reopening…" : "Reopen ticket"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void setClosed("closed")}
            className="rounded-md border border-[#f85149]/50 bg-[#f85149]/15 px-3 py-1.5 text-sm font-medium text-[#ffa198] hover:bg-[#f85149]/25 disabled:opacity-50"
          >
            {busy === "close" ? "Closing…" : "Close ticket"}
          </button>
        )}

        {filedId != null ? (
          <span className="text-sm text-[#8b949e]">
            Bug tracker:{" "}
            <Link
              href="/staff/bugs"
              className="font-mono text-[#58a6ff] hover:underline"
            >
              #{filedId}
            </Link>{" "}
            <span className="text-[#6e7681]">(search or open list)</span>
          </span>
        ) : (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void fileBug()}
            className="rounded-md border border-[#238636]/50 bg-[#238636]/20 px-3 py-1.5 text-sm font-medium text-[#3fb950] hover:bg-[#238636]/30 disabled:opacity-50"
          >
            {busy === "bug" ? "Filing…" : "File as bug report"}
          </button>
        )}
      </div>
      {error ? <p className="text-xs text-[#f85149]">{error}</p> : null}
    </div>
  );
}
