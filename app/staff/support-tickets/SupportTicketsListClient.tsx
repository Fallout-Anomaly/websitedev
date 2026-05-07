"use client";

import Link from "next/link";
import { useState } from "react";
import { plainTextPreview } from "@/src/lib/plain-text-preview";

export type SupportTicketRow = {
  id: string;
  reference: string;
  subject: string | null;
  contact_channel: string | null;
  status: string;
  created_at: string;
  filed_bug_report_id: number | null;
};

function formatWhenUtc(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

function SupportTicketListItem({ row }: { row: SupportTicketRow }) {
  const when = formatWhenUtc(row.created_at);
  const href = `/staff/support-tickets/${encodeURIComponent(row.reference)}`;
  const subjectLine = row.subject?.trim()
    ? plainTextPreview(row.subject, 240)
    : "— no subject —";

  return (
    <li>
      <Link
        href={href}
        className="block px-4 py-4 transition-colors hover:bg-[#21262d]"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-mono text-sm font-semibold text-[#58a6ff]">
            {row.reference}
          </span>
          <span className="text-xs text-[#6e7681]">{when}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[#8b949e]">
          <span className="line-clamp-2">{subjectLine}</span>
          {row.contact_channel ? (
            <span className="text-[#6e7681]">· {row.contact_channel}</span>
          ) : null}
          <span
            className={
              row.status === "open"
                ? "text-[#3fb950]"
                : row.status === "closed"
                  ? "text-[#8b949e]"
                  : "text-[#d29922]"
            }
          >
            · {row.status}
          </span>
          {row.filed_bug_report_id != null ? (
            <span className="text-[#6e7681]">
              · Bug #{row.filed_bug_report_id}
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

type Tab = "open" | "closed";

type Props = {
  openRows: SupportTicketRow[];
  closedRows: SupportTicketRow[];
};

export default function SupportTicketsListClient({
  openRows,
  closedRows,
}: Props) {
  const [tab, setTab] = useState<Tab>("open");
  const rows = tab === "open" ? openRows : closedRows;
  const emptyHint =
    tab === "open"
      ? "No open tickets — switch to Closed or wait for new submissions."
      : "No closed tickets yet.";

  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-4 border-b border-[#30363d]"
        role="tablist"
        aria-label="Ticket status"
      >
        <button
          type="button"
          role="tab"
          id="support-tab-open"
          aria-selected={tab === "open"}
          aria-controls="support-panel-open"
          onClick={() => setTab("open")}
          className={`flex items-center gap-2 border-b-2 py-2 text-sm font-semibold transition-all ${
            tab === "open"
              ? "border-[#f0f6fc] text-[#f0f6fc]"
              : "border-transparent text-[#8b949e] hover:text-[#c9d1d9]"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#3fb950]"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m12 8-4 4 4 4" />
            <path d="M16 12H8" />
          </svg>
          Open
          <span className="rounded-full bg-[#21262d] px-2 py-0.5 text-[10px] text-[#8b949e]">
            {openRows.length}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          id="support-tab-closed"
          aria-selected={tab === "closed"}
          aria-controls="support-panel-closed"
          onClick={() => setTab("closed")}
          className={`flex items-center gap-2 border-b-2 py-2 text-sm font-semibold transition-all ${
            tab === "closed"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-[#8b949e] hover:text-[#c9d1d9]"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-purple-500"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Closed
          <span className="rounded-full bg-[#21262d] px-2 py-0.5 text-[10px] text-[#8b949e]">
            {closedRows.length}
          </span>
        </button>
      </div>

      <div
        role="tabpanel"
        id={tab === "open" ? "support-panel-open" : "support-panel-closed"}
        aria-labelledby={tab === "open" ? "support-tab-open" : "support-tab-closed"}
      >
        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed border-[#30363d] bg-[#0d1117]/50 px-4 py-6 text-center text-sm text-[#6e7681]">
            {emptyHint}
          </p>
        ) : (
          <ul className="divide-y divide-[#30363d] rounded-md border border-[#30363d] bg-[#161b22]">
            {rows.map((row) => (
              <SupportTicketListItem key={row.id} row={row} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
