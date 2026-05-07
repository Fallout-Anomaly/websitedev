"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type Category = {
  key: string;
  label: string;
  count: number;
};

type RecentItem = {
  path: string;
  title: string;
  updatedAt: string | Date;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/wiki") return pathname === "/wiki";
  return pathname.startsWith(href);
}

function formatUpdated(updatedAt: string | Date) {
  const d = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
  if (Number.isNaN(d.getTime())) return "";
  // Stable across server/client.
  return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

export default function WikiShell({
  categories,
  recent,
  children,
}: {
  categories: Category[];
  recent: RecentItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const q = (searchParams?.get("q") ?? "").trim();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const nav = useMemo(
    () => [
      { href: "/wiki", label: "Explore" },
      { href: "/wiki?view=recent", label: "Recent" },
    ],
    [],
  );

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-[#09090b] text-zinc-100 font-sans selection:bg-emerald-500/30">
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } transition-[width] duration-300 overflow-hidden border-r border-zinc-800 flex flex-col bg-[#09090b]`}
      >
        <div className="p-5 flex items-center justify-between">
          <Link href="/wiki" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black">
              <span className="font-black">W</span>
            </div>
            <span>Wiki</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
              Navigation
            </p>
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActivePath(pathname, item.href.split("?")[0]!)
                        ? "bg-emerald-500/10 text-emerald-400 font-medium"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {categories.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
                Categories
              </p>
              <ul className="space-y-1">
                {categories.map((cat) => (
                  <li key={cat.key}>
                    <Link
                      href={`/wiki?category=${encodeURIComponent(cat.key)}`}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-all text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                    >
                      <span className="truncate">{cat.label}</span>
                      <span className="text-[11px] text-zinc-500 tabular-nums">
                        {cat.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {recent.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">
                Recent updates
              </p>
              <ul className="space-y-1">
                {recent.map((r) => (
                  <li key={r.path}>
                    <Link
                      href={`/wiki/${r.path}`}
                      className="block rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                      title={r.title}
                    >
                      <div className="truncate font-medium text-zinc-200">
                        {r.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-500">
                        {formatUpdated(r.updatedAt)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500">Search: {q || "—"}</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400 transition-colors"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? "×" : "≡"}
            </button>

            <form action="/wiki" className="relative w-full max-w-xl group">
              <input
                type="text"
                name="q"
                placeholder="Search documentation…"
                defaultValue={q}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-4 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/wiki/edit/new"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-semibold rounded-md transition-colors shadow-lg shadow-emerald-500/10"
            >
              <span className="text-lg leading-none">+</span>
              <span>Create page</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

