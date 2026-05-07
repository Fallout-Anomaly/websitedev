import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SheetComment } from "../actions";
import DeleteSheetButton from "../DeleteSheetButton";
import SheetComments from "./SheetComments";
import SheetMetaForm from "./SheetMetaForm";

export default async function StaffSheetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: sheet, error } = await supabase
    .from("staff_google_sheets")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !sheet) {
    notFound();
  }

  const comments: SheetComment[] = Array.isArray(sheet.comments)
    ? [...(sheet.comments as SheetComment[])].sort(
        (a, b) =>
          String(b.created_at).localeCompare(String(a.created_at))
      )
    : [];

  return (
    <>
      <nav className="mb-3 text-sm text-[#8b949e]" aria-label="Breadcrumb">
        <Link href="/staff" className="text-[#8b949e] hover:text-[#58a6ff]">
          Staff
        </Link>
        <span className="mx-1.5 text-[#484f58]">/</span>
        <Link href="/staff/sheets" className="text-[#8b949e] hover:text-[#58a6ff]">
          Google Sheets
        </Link>
        <span className="mx-1.5 text-[#484f58]">/</span>
        <span className="text-[#c9d1d9]">{sheet.title}</span>
      </nav>

      <header className="mb-8 flex flex-col gap-4 border-b border-[#30363d] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#f0f6fc] sm:text-3xl">
            {sheet.title}
          </h1>
          {sheet.category ? (
            <p className="mt-1 text-sm text-[#8b949e]">
              Category:{" "}
              <span className="text-[#c9d1d9]">{sheet.category}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={sheet.google_sheets_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[#30363d] bg-[#21262d] px-4 py-2 text-sm font-semibold text-[#f0f6fc] transition-colors hover:bg-[#30363d]"
          >
            Open in Google Sheets
          </a>
          <DeleteSheetButton slug={slug} />
        </div>
      </header>

      <section className="mb-10" aria-labelledby="details-heading">
        <h2
          id="details-heading"
          className="mb-4 text-sm font-semibold text-[#f0f6fc]"
        >
          Details
        </h2>
        <SheetMetaForm
          slug={slug}
          title={sheet.title}
          googleSheetsUrl={sheet.google_sheets_url}
          category={sheet.category}
          notes={sheet.notes}
        />
      </section>

      <section aria-labelledby="comments-heading">
        <h2
          id="comments-heading"
          className="mb-4 text-sm font-semibold text-[#f0f6fc]"
        >
          Staff comments
        </h2>
        <SheetComments slug={slug} comments={comments} />
      </section>
    </>
  );
}
