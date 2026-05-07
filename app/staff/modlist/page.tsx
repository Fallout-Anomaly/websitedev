import Link from "next/link";
import { searchModlist, getModlistFilters } from "../queries";
import ModlistClient from "./ModlistClient";

export default async function ModlistPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.search || "";
  const status = params.status || "";
  const category = params.category || "";

  const [modlistResult, filtersResult] = await Promise.all([
    searchModlist(page, 50, search, status, category),
    getModlistFilters(),
  ]);

  return (
    <>
      <nav className="mb-3 text-sm text-[#8b949e]" aria-label="Breadcrumb">
        <Link href="/staff" className="text-[#8b949e] hover:text-[#58a6ff]">
          Staff
        </Link>
        <span className="mx-1.5 text-[#484f58]">/</span>
        <span className="text-[#c9d1d9]">Mod registry</span>
      </nav>

      <header className="mb-8 border-b border-[#30363d] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#f0f6fc] sm:text-3xl">
          Mod registry
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#8b949e]">
          {modlistResult.total.toLocaleString()} mods in the Fallen World package.
          Search, filter by status and category, open a mod for notes and activity.
        </p>
      </header>

      <ModlistClient
          initialData={modlistResult.data}
          statuses={filtersResult.statuses}
          categories={filtersResult.categories}
          total={modlistResult.total}
          currentPage={page}
        />
    </>
  );
}
