import Link from "next/link";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { getDb } from "@/src/db/client";
import { wikiPages } from "@/src/db/schema";
import { plainTextPreview } from "@/src/lib/plain-text-preview";

export const dynamic = "force-dynamic";

export default async function WikiIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const view = (sp.view ?? "").trim();
  const category = (sp.category ?? "").trim().toLowerCase();

  const db = getDb();

  let where: SQL<unknown> = eq(wikiPages.published, true);
  if (q) {
    const nextWhere = and(
      where,
      or(
        ilike(wikiPages.title, `%${q}%`),
        ilike(wikiPages.path, `%${q}%`),
        ilike(wikiPages.contentMd, `%${q}%`),
      ),
    );
    // Drizzle's `and()` can return undefined when given only undefined inputs.
    // Here we always have a base predicate, so this is safe.
    if (nextWhere) where = nextWhere;
  }

  if (category) {
    const nextWhere = and(
      where,
      or(eq(wikiPages.path, category), ilike(wikiPages.path, `${category}/%`)),
    );
    if (nextWhere) where = nextWhere;
  }

  const pagesRaw = await db
    .select({
      path: wikiPages.path,
      title: wikiPages.title,
      updatedAt: wikiPages.updatedAt,
      contentMd: wikiPages.contentMd,
    })
    .from(wikiPages)
    .where(where)
    .orderBy(desc(wikiPages.updatedAt))
    .limit(200);

  const pages =
    view === "recent"
      ? pagesRaw
      : pagesRaw;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-10 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight">
            {view === "recent"
              ? "Recent updates"
              : category
                ? `Category: ${category}`
                : "Wiki"}
          </h1>
          <p className="text-zinc-400 text-lg">
            {q
              ? `Results for “${q}”.`
              : "Central hub for documentation and project notes."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((p) => (
          <Link
            key={p.path}
            href={`/wiki/${p.path}`}
            className="group text-left p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-emerald-500/50 hover:bg-zinc-800/40 transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-lg font-bold truncate group-hover:text-emerald-400 transition-colors">
                  {p.title}
                </div>
                <div className="mt-1 text-xs text-zinc-500 truncate">
                  {p.path}
                </div>
                <div className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  {plainTextPreview(p.contentMd, 140)}
                </div>
              </div>
              <span className="shrink-0 text-xs text-zinc-500">
                {new Date(p.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {pages.length === 0 ? (
        <div className="mt-10 text-sm text-zinc-400">
          {q ? "No results." : "No published pages yet."}
        </div>
      ) : null}
    </div>
  );
}

