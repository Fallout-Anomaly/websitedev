import Link from "next/link";
import { searchBugReports, getBugStatusOptions, getBugCounts } from "../queries";
import BugTrackerClient from "./BugTrackerClient";

export default async function BugTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.search || "";
  const status = params.status || "Open";

  const [bugsResult, statusOptions, counts] = await Promise.all([
    searchBugReports(page, 20, search, status),
    getBugStatusOptions(),
    getBugCounts()
  ]);

  return (
    <>
      <nav className="mb-3 text-sm text-[#8b949e]" aria-label="Breadcrumb">
        <Link href="/staff" className="text-[#8b949e] hover:text-[#58a6ff]">
          Staff
        </Link>
        <span className="mx-1.5 text-[#484f58]">/</span>
        <span className="text-[#c9d1d9]">Bug tracker</span>
      </nav>

      <header className="mb-8 border-b border-[#30363d] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#f0f6fc] sm:text-3xl">
          Bug tracker
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#8b949e]">
          {counts.open + counts.closed > 0
            ? `${(counts.open + counts.closed).toLocaleString()} report${(counts.open + counts.closed) !== 1 ? "s" : ""} on file. Open an issue to read details and post staff notes.`
            : "No bug reports yet. Issues filed from the mod registry will appear here."}
        </p>
      </header>

      <BugTrackerClient
          initialData={bugsResult.data}
          statuses={statusOptions}
          total={bugsResult.total}
          currentPage={page}
          initialCounts={counts}
          initialStatus={status}
          initialSearch={search}
        />
    </>
  );
}
