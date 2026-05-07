import type { ReactNode } from "react";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/src/db/client";
import { wikiPages } from "@/src/db/schema";
import WikiShell from "./wiki-shell";

export const dynamic = "force-dynamic";

type Category = {
  key: string;
  label: string;
  count: number;
};

function labelForCategoryKey(key: string) {
  return key
    .split(/[-_]/g)
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");
}

function categoryKeyFromPath(path: string) {
  const first = path.split("/").filter(Boolean)[0] ?? "";
  return first;
}

export default async function WikiLayout({ children }: { children: ReactNode }) {
  const db = getDb();

  const publishedPaths = await db
    .select({ path: wikiPages.path })
    .from(wikiPages)
    .where(eq(wikiPages.published, true))
    .limit(5000);

  const counts = new Map<string, number>();
  for (const row of publishedPaths) {
    const key = categoryKeyFromPath(row.path);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const categories: Category[] = [...counts.entries()]
    .map(([key, count]) => ({ key, label: labelForCategoryKey(key), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const recent = await db
    .select({
      path: wikiPages.path,
      title: wikiPages.title,
      updatedAt: wikiPages.updatedAt,
    })
    .from(wikiPages)
    .where(eq(wikiPages.published, true))
    .orderBy(desc(wikiPages.updatedAt))
    .limit(8);

  return (
    <WikiShell categories={categories} recent={recent}>
      {children}
    </WikiShell>
  );
}

