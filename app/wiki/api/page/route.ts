import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/src/db/client";
import { wikiPages } from "@/src/db/schema";
import { createClient } from "@/lib/supabase/server";
import { isStaffAccount } from "@/src/lib/staff-access";
import { slugify } from "@/src/lib/slugify";

type Body = {
  path?: string;
  title?: string;
  contentMd?: string;
  published?: boolean; // staff: publish now, non-staff: request publish
};

function normalizePath(raw: string) {
  return raw
    .trim()
    .replaceAll("\\", "/")
    .replaceAll(/\/+/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replaceAll(" ", "-")
    .replaceAll(/-+/g, "-")
    .toLowerCase();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const isStaff = await isStaffAccount(supabase, user);

  const body = (await request.json()) as Body;
  const title = (body.title ?? "").trim();
  let path = body.path ? normalizePath(body.path) : "";
  const contentMd = body.contentMd ?? "";
  const wantsPublish = Boolean(body.published);

  if (!title) return new NextResponse("Missing title", { status: 400 });

  if (!path || path === "new") {
    path = slugify(title);
  }

  if (!path) return new NextResponse("Missing path", { status: 400 });
  // Non-staff cannot publish directly, but may request publication.

  const db = getDb();

  const existing = await db
    .select({ id: wikiPages.id, createdBy: wikiPages.createdBy })
    .from(wikiPages)
    .where(eq(wikiPages.path, path))
    .limit(1);

  const row = existing[0] ?? null;
  if (row && row.createdBy !== user.id && !isStaff) {
    return new NextResponse("Not found", { status: 404 });
  }

  await db
    .insert(wikiPages)
    .values({
      path,
      title,
      contentMd,
      published: isStaff ? wantsPublish : false,
      publishRequestedAt: !isStaff && wantsPublish ? new Date() : null,
      publishRequestedBy: !isStaff && wantsPublish ? user.id : null,
      publishedAt: isStaff && wantsPublish ? new Date() : null,
      publishedBy: isStaff && wantsPublish ? user.id : null,
      createdBy: row?.createdBy ?? user.id,
      updatedBy: user.id,
    })
    .onConflictDoUpdate({
      target: wikiPages.path,
      set: {
        title,
        contentMd,
        published: isStaff ? wantsPublish : false,
        publishRequestedAt: !isStaff && wantsPublish ? new Date() : null,
        publishRequestedBy: !isStaff && wantsPublish ? user.id : null,
        publishedAt: isStaff && wantsPublish ? new Date() : null,
        publishedBy: isStaff && wantsPublish ? user.id : null,
        updatedBy: user.id,
      },
    });

  return NextResponse.json({ path });
}

