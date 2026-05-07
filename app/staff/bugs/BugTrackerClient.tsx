"use client";

import React, { useCallback, useState, memo } from "react";
import Link from "next/link";
import { searchBugReports } from "../queries";
import BugDetailDrawer, {
  type BugReport,
} from "@/src/components/BugDetailDrawer";
import { plainTextPreview } from "@/src/lib/plain-text-preview";
import { formatReporterLabel } from "@/src/lib/reporter-label";

type Props = {
  initialData: BugReport[];
  statuses: string[];
  total: number;
  currentPage: number;
  initialCounts: { open: number; closed: number };
  initialStatus: string;
  initialSearch?: string;
};

function formatBugDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 3600 * 24)
  );

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  // Stable output (avoid locale/timezone differences during hydration).
  return `on ${date.toISOString().slice(5, 10)}`;
}

const BugIssueRow = memo(function BugIssueRow({
  bug,
  onSelect,
}: {
  bug: BugReport;
  onSelect: (b: BugReport) => void;
}) {
  const raw = bug.issue_description || "";
  const preview = plainTextPreview(raw, 120);
  const truncated = preview.endsWith("…");
  const commentCount = Array.isArray(bug.comments) ? bug.comments.length : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(bug)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(bug);
        }
      }}
      className="group flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-[#161b22]"
    >
      <div className="mt-1">
        {bug.status === "Closed" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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
        )}
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="truncate text-sm font-semibold text-[#c9d1d9] transition-colors group-hover:text-[#58a6ff]">
            {bug.mod_name}: {preview}
            {truncated ? "..." : ""}
          </span>
          {bug.severity && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold border border-white/10 text-gray-500 group-hover:border-gray-400 group-hover:text-gray-300 transition-all">
              {bug.severity}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8b949e]">
          <span>#{bug.id}</span>
          <span>
            opened {formatBugDate(bug.date_reported)} by{" "}
            <span className="font-semibold">
              {formatReporterLabel(bug.reported_by)}
            </span>
          </span>
        </div>
      </div>

      {commentCount > 0 && (
        <div className="mt-1 hidden items-center gap-1 text-[#6e7681] md:flex">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-[10px] font-bold">{commentCount}</span>
        </div>
      )}
    </div>
  );
});

BugIssueRow.displayName = "BugIssueRow";

export default function BugTrackerClient({ 
  initialData, 
  statuses, 
  total, 
  currentPage, 
  initialCounts,
  initialStatus,
  initialSearch = "",
}: Props) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(currentPage);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState(false);
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = useCallback(async (overridingStatus?: string) => {
    setLoading(true);
    setPage(1);
    const targetStatus = overridingStatus !== undefined ? overridingStatus : status;
    const result = await searchBugReports(1, pageSize, search, targetStatus);
    setData(result.data || []);
    // Update the local count for the active tab based on result total
    if (targetStatus === "Open") {
       setCounts(prev => ({ ...prev, open: result.total }));
    } else if (targetStatus === "Closed") {
       setCounts(prev => ({ ...prev, closed: result.total }));
    }
    setLoading(false);
  }, [search, status]);

  const handlePageChange = useCallback(
    async (newPage: number) => {
      setLoading(true);
      const result = await searchBugReports(newPage, pageSize, search, status);
      setData(result.data || []);
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setLoading(false);
    },
    [search, status]
  );

  const selectBug = useCallback((b: BugReport) => setSelectedBug(b), []);

  return (
    <div className="space-y-6">
      {/* GitHub-style Header Tabs */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setStatus("Open"); handleSearch("Open"); }}
            className={`flex items-center gap-2 border-b-2 py-2 text-sm font-semibold transition-all ${status === "Open" ? "border-[#f0f6fc] text-[#f0f6fc]" : "border-transparent text-[#8b949e] hover:text-[#c9d1d9]"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#3fb950]"><circle cx="12" cy="12" r="10"/><path d="m12 8-4 4 4 4"/><path d="M16 12H8"/></svg>
            Open
            <span className="rounded-full bg-[#21262d] px-2 py-0.5 text-[10px] text-[#8b949e]">{counts.open}</span>
          </button>
          <button 
            onClick={() => { setStatus("Closed"); handleSearch("Closed"); }}
            className={`flex items-center gap-2 border-b-2 py-2 text-sm font-semibold transition-all ${status === "Closed" ? "border-purple-500 text-purple-400" : "border-transparent text-[#8b949e] hover:text-[#c9d1d9]"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Closed
            <span className="rounded-full bg-[#21262d] px-2 py-0.5 text-[10px] text-[#8b949e]">{counts.closed}</span>
          </button>
        </div>
        
        <Link
          href="/staff/modlist"
          className="rounded-md border border-[#30363d] bg-[#21262d] px-4 py-1.5 text-xs font-semibold text-[#c9d1d9] transition-colors hover:bg-[#30363d] hover:text-[#f0f6fc]"
        >
          Report from modlist
        </Link>
      </div>

      {/* Main Issue Container */}
      <div className="overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]">
        <div className="flex items-center gap-4 border-b border-[#30363d] bg-[#161b22] p-3">
          <div className="relative flex-grow">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7681]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input
              type="text"
              placeholder="Search all issues"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full rounded-md border border-[#30363d] bg-[#0d1117] py-2 pl-9 pr-4 text-sm text-[#e6edf3] placeholder-[#6e7681] outline-none transition-all focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
            />
          </div>
          <div className="hidden items-center gap-3 text-xs font-medium text-[#8b949e] md:flex">
            <span className="cursor-not-allowed opacity-50">Labels</span>
            <span className="cursor-not-allowed opacity-50">Milestones</span>
            <span className="cursor-not-allowed opacity-50">Sort</span>
          </div>
        </div>

        <div className="divide-y divide-[#30363d]">
          {loading ? (
            <div className="py-16 text-center text-sm text-[#8b949e]">Loading…</div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center">
              <h3 className="mb-1 font-semibold text-[#f0f6fc]">No issues found</h3>
              <p className="text-sm text-[#8b949e]">Clear your filters to see more issues.</p>
            </div>
          ) : (
            data.map((bug) => (
              <BugIssueRow key={bug.id} bug={bug} onSelect={selectBug} />
            ))
          )}
        </div>
      </div>

      {/* GitHub-style Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || loading}
            className="text-sm font-medium text-[#58a6ff] hover:underline disabled:cursor-not-allowed disabled:opacity-30 disabled:no-underline"
          >
            ← Previous
          </button>
          
          <div className="text-xs text-[#8b949e]">
            {page} / {totalPages}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || loading}
            className="text-sm font-medium text-[#58a6ff] hover:underline disabled:cursor-not-allowed disabled:opacity-30 disabled:no-underline"
          >
            Next →
          </button>
        </div>
      )}

      {/* Bug Detail Drawer */}
      <BugDetailDrawer 
        bug={selectedBug}
        onClose={() => setSelectedBug(null)}
      />
    </div>
  );
}
