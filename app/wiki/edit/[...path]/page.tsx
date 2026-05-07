import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isStaffAccount } from "@/src/lib/staff-access";
import { getDb } from "@/src/db/client";
import { wikiPages } from "@/src/db/schema";
import WikiEditForm from "@/src/wiki/WikiEditForm";
import { normalizeWikiPath } from "@/src/wiki/wiki-path";

export const dynamic = "force-dynamic";

export default async function WikiEditPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = normalizeWikiPath((await params).path);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/wiki/edit/${path}`)}`);
  }

  const isStaff = await isStaffAccount(supabase, user);

  const db = getDb();

  const existing = await db
    .select()
    .from(wikiPages)
    .where(eq(wikiPages.path, path))
    .limit(1);

  const page = existing[0] ?? null;

  if (page && page.createdBy !== user.id && !isStaff) {
    notFound();
  }

  return (
    <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {page ? "Edit wiki page" : "Create wiki page"}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Drafts are visible only to you (and staff) until published.
          </p>
        </div>
        <Link
          href={page ? `/wiki/${page.path}` : "/wiki"}
          className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
        >
          Back
        </Link>
      </div>

      <WikiEditForm
        initialPath={page?.path ?? path}
        initialTitle={page?.title ?? ""}
        initialContentMd={page?.contentMd ?? ""}
        initialPublished={page?.published ?? false}
        initialPublishRequested={Boolean(page?.publishRequestedAt)}
        canPublish={isStaff}
      />
    </main>
  );
}

