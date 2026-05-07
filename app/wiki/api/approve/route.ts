import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/src/db/client";
import { wikiPages } from "@/src/db/schema";
import { assertStaffSession } from "@/src/lib/assert-staff-session";

type Body = {
  path?: string;
  action?: "approve" | "reject" | "unpublish";
};

export async function POST(request: Request) {
  let body: Body | null = null;
  try {
    body = (await request.json()) as Body;
  } catch {
    body = null;
  }

  const action = body?.action ?? "approve";
  const path = (body?.path ?? "").trim().toLowerCase();
  if (!path) return new NextResponse("Missing path", { status: 400 });

  const { user } = await assertStaffSession();
  const db = getDb();

  if (action === "approve") {
    await db
      .update(wikiPages)
      .set({
        published: true,
        publishedAt: new Date(),
        publishedBy: user.id,
        publishRequestedAt: null,
        publishRequestedBy: null,
        updatedBy: user.id,
      })
      .where(eq(wikiPages.path, path));
  } else if (action === "unpublish") {
    await db
      .update(wikiPages)
      .set({
        published: false,
        publishedAt: null,
        publishedBy: null,
        updatedBy: user.id,
      })
      .where(eq(wikiPages.path, path));
  } else {
    // reject
    await db
      .update(wikiPages)
      .set({
        publishRequestedAt: null,
        publishRequestedBy: null,
        updatedBy: user.id,
      })
      .where(
        and(eq(wikiPages.path, path), eq(wikiPages.published, false)),
      );
  }

  return NextResponse.json({ ok: true });
}

