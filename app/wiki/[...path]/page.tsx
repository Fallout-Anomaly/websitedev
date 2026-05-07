import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/src/db/client";
import { wikiPages } from "@/src/db/schema";
import WikiMarkdown from "@/src/components/WikiMarkdown";
import { createClient } from "@/lib/supabase/server";
import { isStaffAccount } from "@/src/lib/staff-access";
import { normalizeWikiPath } from "@/src/wiki/wiki-path";
import { extractToc } from "@/src/wiki/toc";

export const dynamic = "force-dynamic";

export default async function WikiPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = normalizeWikiPath((await params).path);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isStaff = user ? await isStaffAccount(supabase, user) : false;

  const db = getDb();

  const rows = await db
    .select()
    .from(wikiPages)
    .where(eq(wikiPages.path, path))
    .limit(1);

  const page = rows[0];
  if (!page) notFound();

  const canView =
    page.published ||
    (user && page.createdBy === user.id) ||
    Boolean(isStaff);

  if (!canView) notFound();

  const toc = extractToc(page.contentMd);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex gap-10">
        <article className="flex-1 min-w-0 max-w-3xl">
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
            <Link href="/wiki" className="hover:text-zinc-300 transition-colors">
              Explore
            </Link>
            <span className="text-zinc-700">›</span>
            <span className="text-emerald-400">{page.path}</span>
          </div>

          <div className="flex items-start justify-between gap-4 mb-8">
            <h1 className="text-5xl font-black tracking-tighter">{page.title}</h1>
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/wiki/edit/${page.path}`}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800/40"
                >
                  Edit
                </Link>
              </div>
            ) : null}
          </div>

          {!page.published && page.publishRequestedAt ? (
            <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Pending approval — a staff member must approve before this page is
              public.
            </div>
          ) : !page.published ? (
            <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Draft — not published.
            </div>
          ) : null}

          <div className="prose prose-invert prose-emerald max-w-none">
            <WikiMarkdown source={page.contentMd} />
          </div>
        </article>

        {toc.length > 0 ? (
          <aside className="hidden xl:block w-72 h-fit sticky top-24">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
              On this page
            </p>
            <nav className="space-y-2 text-sm">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`block text-zinc-500 hover:text-emerald-400 transition-colors ${
                    item.depth === 3 ? "pl-4" : item.depth === 4 ? "pl-7" : ""
                  }`}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

