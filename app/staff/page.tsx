import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { canViewStaffAuditLog } from "@/src/lib/staff-audit-admin";

export default async function StaffPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [modsResult, bugsResult] = await Promise.all([
    supabase.from("modlist_entries").select("id", { count: "exact", head: true }),
    supabase.from("bug_reports").select("id", { count: "exact", head: true }),
  ]);

  const modCount = modsResult.count ?? 0;
  const bugCount = bugsResult.count ?? 0;
  const showAudit = await canViewStaffAuditLog(supabase, user);

  const resources = [
    {
      href: "/staff/modlist",
      title: "Mod registry",
      body: "Browse the full package, filter by status and category, open mod notes.",
    },
    {
      href: "/staff/bugs",
      title: "Bug tracker",
      body: "Review reports, add staff discussion, and keep issues moving.",
    },
    {
      href: "/staff/support-tickets",
      title: "Support tickets",
      body: "Public /support/bug-report submissions (reference id, full markdown body).",
    },
    {
      href: "/staff/sheets",
      title: "Google Sheets",
      body: "Curated doc links with categories, notes, and staff comments.",
    },
    ...(showAudit
      ? ([
          {
            href: "/staff/activity",
            title: "Activity log",
            body: "Audit trail of staff actions.",
          },
        ] as const)
      : []),
  ];

  return (
    <>
      <nav
        className="mb-3 text-sm text-[#8b949e]"
        aria-label="Breadcrumb"
      >
        <span className="text-[#8b949e]">Staff</span>
        <span className="mx-1.5 text-[#484f58]">/</span>
        <span className="text-[#c9d1d9]">Overview</span>
      </nav>

      <header className="border-b border-[#30363d] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#f0f6fc] sm:text-3xl">
          Overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8b949e]">
          Quick read on registry size and open issues. Use the workspace on the
          left to move between tools on any staff page.
        </p>
      </header>

      <section
        className="mt-8 divide-y divide-[#30363d] border-y border-[#30363d]"
        aria-label="Key metrics"
      >
        <Link
          href="/staff/modlist"
          className="group flex items-baseline justify-between gap-4 py-5 transition-colors hover:bg-[#161b22]/50"
        >
          <div>
            <p className="text-xs font-medium text-[#8b949e]">Mods in package</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#f0f6fc] group-hover:text-[#58a6ff] sm:text-3xl">
              {modCount.toLocaleString()}
            </p>
          </div>
          <span className="shrink-0 text-xs text-[#58a6ff] group-hover:underline">
            Registry →
          </span>
        </Link>

        <Link
          href="/staff/bugs"
          className="group flex items-baseline justify-between gap-4 py-5 transition-colors hover:bg-[#161b22]/50"
        >
          <div>
            <p className="text-xs font-medium text-[#8b949e]">Known issues</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#f0f6fc] group-hover:text-[#f85149] sm:text-3xl">
              {bugCount.toLocaleString()}
            </p>
          </div>
          <span className="shrink-0 text-xs text-[#58a6ff] group-hover:underline">
            Tracker →
          </span>
        </Link>

        {showAudit ? (
          <Link
            href="/staff/activity"
            className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-[#161b22]/50"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3fb950]"
                aria-hidden
              />
              <div>
                <p className="text-xs font-medium text-[#8b949e]">
                  Activity log
                </p>
                <p className="mt-0.5 text-sm text-[#c9d1d9]">Audit trail</p>
              </div>
            </div>
            <span className="shrink-0 text-xs text-[#58a6ff] group-hover:underline">
              Open →
            </span>
          </Link>
        ) : null}
      </section>

      <section className="mt-10" aria-labelledby="resources-heading">
        <h2
          id="resources-heading"
          className="text-sm font-semibold text-[#f0f6fc]"
        >
          Resources
        </h2>
        <p className="mt-1 text-xs text-[#8b949e]">
          Same destinations as the workspace links.
        </p>

        <div className="mt-4 border-y border-[#30363d]">
          <ul className="divide-y divide-[#30363d]" role="list">
            {resources.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-start justify-between gap-4 px-4 py-4 transition-colors hover:bg-[#161b22]"
                >
                  <div>
                    <p className="text-sm font-medium text-[#58a6ff]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#8b949e]">
                      {item.body}
                    </p>
                  </div>
                  <span className="shrink-0 text-[#8b949e]" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
