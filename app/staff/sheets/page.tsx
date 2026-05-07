import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteSheetButton from "./DeleteSheetButton";

type SheetRow = {
  id: string;
  slug: string;
  title: string;
  google_sheets_url: string;
  category: string | null;
  updated_at: string | null;
};

export default async function StaffSheetsIndexPage() {
  const supabase = await createClient();
  const { data: sheets, error } = await supabase
    .from("staff_google_sheets")
    .select("id, slug, title, google_sheets_url, category, updated_at")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    return (
      <>
        <nav className="mb-3 text-sm text-[#8b949e]" aria-label="Breadcrumb">
          <Link href="/staff" className="text-[#8b949e] hover:text-[#58a6ff]">
            Staff
          </Link>
          <span className="mx-1.5 text-[#484f58]">/</span>
          <span className="text-[#c9d1d9]">Google Sheets</span>
        </nav>
        <div className="rounded-md border border-[#f85149]/30 bg-[#161b22] p-6 text-sm text-[#ff7b72]">
          Could not load sheet links. Run{" "}
          <code className="rounded bg-[#0d1117] px-1 font-mono text-xs">
            supabase/migrations/20260210120000_staff_google_sheets.sql
          </code>{" "}
          in the SQL editor.
          <p className="mt-2 text-xs text-[#8b949e]">{error.message}</p>
        </div>
      </>
    );
  }

  const grouped = new Map<string, SheetRow[]>();
  for (const row of (sheets ?? []) as SheetRow[]) {
    const key = row.category?.trim() || "Uncategorized";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  const groupKeys = Array.from(grouped.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  return (
    <>
      <nav className="mb-3 text-sm text-[#8b949e]" aria-label="Breadcrumb">
        <Link href="/staff" className="text-[#8b949e] hover:text-[#58a6ff]">
          Staff
        </Link>
        <span className="mx-1.5 text-[#484f58]">/</span>
        <span className="text-[#c9d1d9]">Google Sheets</span>
      </nav>

      <header className="mb-8 flex flex-col gap-4 border-b border-[#30363d] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#f0f6fc] sm:text-3xl">
            Google Sheets
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#8b949e]">
            Curated links for staff. Categories and notes live here; all cell
            edits stay in Google Sheets.
          </p>
        </div>
        <Link
          href="/staff/sheets/new"
          className="shrink-0 rounded-md border border-[#30363d] bg-[#21262d] px-4 py-2 text-center text-sm font-semibold text-[#f0f6fc] transition-colors hover:bg-[#30363d]"
        >
          Add sheet
        </Link>
      </header>

      {!sheets?.length ? (
        <div className="rounded-md border border-dashed border-[#30363d] py-16 text-center">
          <p className="text-sm text-[#8b949e]">No sheets linked yet.</p>
          <Link
            href="/staff/sheets/new"
            className="mt-3 inline-block text-sm font-medium text-[#58a6ff] hover:underline"
          >
            Add your first link →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {groupKeys.map((cat) => (
            <section key={cat}>
              <h2 className="mb-3 text-sm font-semibold text-[#f0f6fc]">
                {cat}
              </h2>
              <div className="overflow-hidden rounded-md border border-[#30363d]">
                <ul className="divide-y divide-[#30363d]" role="list">
                  {grouped.get(cat)!.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/staff/sheets/${s.slug}`}
                          className="font-medium text-[#58a6ff] hover:underline"
                        >
                          {s.title}
                        </Link>
                        <p className="mt-1 truncate text-xs text-[#6e7681]">
                          {s.google_sheets_url}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <a
                          href={s.google_sheets_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md border border-[#30363d] bg-[#21262d] px-3 py-1.5 text-xs font-semibold text-[#f0f6fc] hover:bg-[#30363d]"
                        >
                          Open in Sheets
                        </a>
                        <DeleteSheetButton slug={s.slug} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
