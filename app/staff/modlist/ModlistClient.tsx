"use client";

import React, {
  useCallback,
  useState,
  useEffect,
  useMemo,
  memo,
  useRef,
} from "react";
import { searchModlist } from "../queries";
import ModDetailDrawer from "@/src/components/ModDetailDrawer";

type ModlistEntry = {
  id: number;
  load_order: number;
  mod_name: string;
  status: string;
  category: string;
  author: string;
  version: string;
  nexus_url: string;
  size_mb: number;
  esp_count: number;
  esm_count: number;
  esl_count: number;
  notes: string;
};

// Optimized Row Component with minimal transitions
const ModRow = memo(({ mod, onSelect }: { mod: ModlistEntry; onSelect: (m: ModlistEntry) => void }) => {
  return (
    <tr
      onClick={() => onSelect(mod)}
      className="group cursor-pointer border-b border-[#30363d] transition-colors duration-75 last:border-0 hover:bg-[#161b22]"
    >
      <td className="px-4 py-2.5">
        <span className="text-[10px] font-mono tabular-nums text-[#6e7681] transition-colors duration-75 group-hover:text-[#58a6ff]">
          #{mod.load_order}
        </span>
      </td>
      <td className="px-4 py-2.5 truncate">
        <div className="flex flex-col">
          <div className="truncate text-[13px] font-medium text-[#c9d1d9] transition-colors duration-75 group-hover:text-[#f0f6fc]">
            {mod.mod_name}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="truncate text-[11px] text-[#8b949e]">{mod.author || "—"}</span>
            {mod.nexus_url && (
              <a
                href={mod.nexus_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[11px] font-medium text-[#58a6ff] hover:underline"
              >
                Nexus
              </a>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${mod.status === "Enabled" ? "bg-[#3fb950]" : "bg-[#6e7681]"}`}
          />
          <span
            className={`text-xs font-medium ${mod.status === "Enabled" ? "text-[#3fb950]" : "text-[#8b949e]"} transition-colors duration-75`}
          >
            {mod.status}
          </span>
        </div>
      </td>
      <td className="px-4 py-2.5 text-center">
        <span className="text-xs font-mono tabular-nums text-[#8b949e]">{mod.version || "—"}</span>
      </td>
      <td className="px-4 py-2.5 text-right">
        <span className="text-xs tabular-nums text-[#8b949e]">{mod.size_mb > 0 ? `${mod.size_mb}M` : "—"}</span>
      </td>
    </tr>
  );
});

ModRow.displayName = "ModRow";

function SortIcon({
  column,
  sortBy,
  sortOrder,
}: {
  column: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}) {
  if (sortBy !== column) {
    return (
      <svg
        className="w-3 h-3 ml-1 opacity-20"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    );
  }
  return sortOrder === "asc" ? (
    <svg
      className="ml-1 h-3 w-3 text-[#58a6ff]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        d="M5 15l7-7 7 7"
      />
    </svg>
  ) : (
    <svg
      className="ml-1 h-3 w-3 text-[#58a6ff]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

type Props = {
  initialData: ModlistEntry[];
  statuses: string[];
  categories: string[];
  total: number;
  currentPage: number;
};

export default function ModlistClient({ initialData, statuses, categories, total, currentPage }: Props) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(currentPage);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("load_order");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(false);
  const [selectedMod, setSelectedMod] = useState<ModlistEntry | null>(null);

  const pageSize = 50;
  const totalPages = Math.ceil(total / pageSize);

  const fetchRef = useRef({
    search,
    status,
    category,
    sortBy,
    sortOrder,
  });
  fetchRef.current = { search, status, category, sortBy, sortOrder };

  const doFetchPage = useCallback(async (targetPage: number) => {
    const p = fetchRef.current;
    setLoading(true);
    setPage(targetPage);
    const result = await searchModlist(
      targetPage,
      pageSize,
      p.search,
      p.status,
      p.category,
      p.sortBy,
      p.sortOrder
    );
    setData(result.data || []);
    setLoading(false);
  }, [pageSize]);

  const skipInitialSearchEffect = useRef(true);
  useEffect(() => {
    if (skipInitialSearchEffect.current) {
      skipInitialSearchEffect.current = false;
      return;
    }
    if (!(search.length > 2 || search.length === 0)) return;
    const timer = setTimeout(() => {
      void doFetchPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, doFetchPage]);

  const skipInitialFilterEffect = useRef(true);
  useEffect(() => {
    if (skipInitialFilterEffect.current) {
      skipInitialFilterEffect.current = false;
      return;
    }
    void doFetchPage(1);
  }, [status, category, sortBy, sortOrder, doFetchPage]);

  const handlePageChange = useCallback(
    async (newPage: number) => {
      await doFetchPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [doFetchPage]
  );

  const toggleSort = useCallback(
    (column: string) => {
      if (sortBy === column) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        setSortOrder("desc");
      }
    },
    [sortBy]
  );

  const selectMod = useCallback((m: ModlistEntry) => setSelectedMod(m), []);

  const groupedData = useMemo(() => {
    const groups: Record<string, ModlistEntry[]> = {};
    data.forEach(mod => {
      const cat = mod.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(mod);
    });
    return groups;
  }, [data]);

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="w-full space-y-6 lg:w-64">
        <div className="space-y-3">
          <h3 className="px-1 text-xs font-semibold text-[#f0f6fc]">Filters</h3>
          <div className="space-y-1">
            <button
              onClick={() => { setCategory(""); setPage(1); }}
              className={`w-full border-l-2 py-2 pl-3 text-left text-xs font-medium transition-colors ${!category ? "border-[#f78166] text-[#f0f6fc]" : "border-transparent text-[#8b949e] hover:border-[#30363d] hover:text-[#c9d1d9]"}`}
            >
              All categories
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`w-full truncate border-l-2 py-2 pl-3 text-left text-xs font-medium transition-colors ${category === cat ? "border-[#f78166] text-[#f0f6fc]" : "border-transparent text-[#8b949e] hover:border-[#30363d] hover:text-[#c9d1d9]"}`}
                title={cat}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t border-[#30363d] pt-6">
          <h3 className="px-1 text-xs font-semibold text-[#f0f6fc]">Status</h3>
          <div className="grid grid-cols-1 gap-1">
            {["", ...statuses].map(s => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`flex items-center gap-2 border-l-2 py-2 pl-3 text-xs font-medium transition-colors ${status === s ? "border-[#f78166] text-[#f0f6fc]" : "border-transparent text-[#8b949e] hover:border-[#30363d] hover:text-[#c9d1d9]"}`}
              >
                <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${s === "Enabled" ? "bg-[#3fb950]" : s === "Testing" ? "bg-[#d29922]" : s === "Disabled" ? "bg-[#f85149]" : "bg-[#6e7681]"}`} />
                {s || "All statuses"}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search registry…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-4 py-2.5 text-sm text-[#e6edf3] placeholder-[#6e7681] outline-none transition-colors focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6e7681]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>

          <p className="shrink-0 text-xs text-[#8b949e]">
            <span className="font-mono font-semibold tabular-nums text-[#f0f6fc]">{total}</span>{" "}
            mods
          </p>
        </div>

        <div className="min-h-[400px] space-y-8">
          {loading ? (
            <div className="animate-pulse py-20 text-center text-sm text-[#8b949e]">Loading…</div>
          ) : Object.entries(groupedData).map(([cat, mods]) => (
            <div key={cat} className="space-y-3">
              {!category && (
                <div className="flex items-center gap-3 px-1">
                  <h2 className="text-sm font-semibold text-[#f0f6fc]">{cat}</h2>
                  <div className="h-px flex-grow bg-[#30363d]" />
                  <span className="text-xs text-[#8b949e]">{mods.length} in view</span>
                </div>
              )}

              <div className="overflow-hidden border-y border-[#30363d] bg-[#0d1117]">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#30363d] text-left text-xs font-medium text-[#8b949e]">
                        <th className="w-14 cursor-pointer px-4 py-3 transition-colors hover:text-[#f0f6fc]" onClick={() => toggleSort("load_order")}>
                          <div className="flex items-center">
                            Order <SortIcon column="load_order" sortBy={sortBy} sortOrder={sortOrder} />
                          </div>
                        </th>
                        <th className="cursor-pointer px-4 py-3 transition-colors hover:text-[#f0f6fc]" onClick={() => toggleSort("mod_name")}>
                          <div className="flex items-center">
                            Mod <SortIcon column="mod_name" sortBy={sortBy} sortOrder={sortOrder} />
                          </div>
                        </th>
                        <th className="w-32 px-4 py-3">Status</th>
                        <th className="w-24 px-4 py-3 text-center">Version</th>
                        <th className="w-24 px-4 py-3 text-right">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mods.map((mod) => (
                        <ModRow key={mod.id} mod={mod} onSelect={selectMod} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#30363d] pt-6">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="text-sm font-medium text-[#58a6ff] hover:underline disabled:cursor-not-allowed disabled:opacity-30 disabled:no-underline"
            >
              Previous
            </button>
            <div className="text-xs text-[#8b949e]">
              Page <span className="font-mono text-[#f0f6fc]">{page}</span> of{" "}
              <span className="font-mono text-[#f0f6fc]">{totalPages}</span>
            </div>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || loading}
              className="text-sm font-medium text-[#58a6ff] hover:underline disabled:cursor-not-allowed disabled:opacity-30 disabled:no-underline"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ModDetailDrawer
        mod={selectedMod}
        onClose={() => setSelectedMod(null)}
        categoryOptions={categories}
      />
    </div>
  );
}
