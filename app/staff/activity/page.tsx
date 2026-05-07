import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { canViewStaffAuditLog } from "@/src/lib/staff-audit-admin";
import { getAllActivity } from "../modlist/actions";

function formatTimestampUtc(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

export default async function GlobalActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !(await canViewStaffAuditLog(supabase, user))) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="max-w-md rounded-md border border-[#f85149]/30 bg-[#161b22] p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#f85149]/40 bg-[#f85149]/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 className="text-lg font-semibold text-[#f0f6fc]">Access restricted</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8b949e]">
            You do not have access to this page. If your project uses{" "}
            <code className="rounded bg-[#21262d] px-1">STAFF_AUDIT_LOG_EMAIL</code>
            , only that account may open the audit log.
          </p>
          <Link href="/staff" className="mt-6 inline-block rounded-md border border-[#30363d] bg-[#21262d] px-4 py-2 text-sm font-medium text-[#c9d1d9] hover:bg-[#30363d]">
            Back to overview
          </Link>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const result = await getAllActivity(page, 50);

  const groupedActivity = result.data.reduce((groups: any, activity: any) => {
    const key = activity.user_id || activity.user_email || "unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(activity);
    return groups;
  }, {});

  return (
    <>
      <nav className="mb-3 text-sm text-[#8b949e]" aria-label="Breadcrumb">
        <Link href="/staff" className="text-[#8b949e] hover:text-[#58a6ff]">
          Staff
        </Link>
        <span className="mx-1.5 text-[#484f58]">/</span>
        <span className="text-[#c9d1d9]">Activity</span>
      </nav>

      <header className="mb-10 border-b border-[#30363d] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#f0f6fc] sm:text-3xl">
          Activity log
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#8b949e]">
          Grouped audit trail of staff actions. Visible to staff; set{" "}
          <code className="rounded bg-[#21262d] px-1">STAFF_AUDIT_LOG_EMAIL</code>{" "}
          to restrict to one account.
        </p>
      </header>

      <div className="max-w-4xl">

        <div className="space-y-16">
          {Object.keys(groupedActivity).length === 0 ? (
            <div className="rounded-md border border-dashed border-[#30363d] py-16 text-center text-sm text-[#8b949e]">
              No activity recorded yet
            </div>
          ) : (
            Object.entries(groupedActivity).map(([groupKey, activities]: [string, any]) => (
              <div key={groupKey} className="space-y-6">
                <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-[#30363d] bg-[#0d1117] py-3">
                  <div className="h-px flex-grow bg-[#30363d]" />
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#58a6ff]" aria-hidden />
                    <h2 className="text-sm font-semibold text-[#f0f6fc]">
                      {(activities[0]?.user_display_name as string | undefined)?.trim() ||
                        "Team member"}
                    </h2>
                    <span className="rounded-full border border-[#30363d] bg-[#161b22] px-2 py-0.5 text-xs text-[#8b949e]">
                      {activities.length} actions
                    </span>
                  </div>
                  <div className="h-px flex-grow bg-[#30363d]" />
                </div>

                <div className="relative ml-3 space-y-6 border-l border-[#30363d] pl-8">
                  {activities.map((a: any) => (
                    <div key={a.id} className="group relative">
                      <div className="absolute -left-[37px] top-1.5 h-3 w-3 rounded-full border-2 border-[#30363d] bg-[#0d1117] group-hover:border-[#58a6ff] transition-colors" />

                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="rounded-md border border-[#30363d] bg-[#161b22] px-2 py-0.5 text-xs font-medium text-[#8b949e]">
                          {String(a.action_type).replace("_", " ")}
                        </span>
                        <time
                          className="text-xs text-[#6e7681]"
                          dateTime={a.created_at}
                        >
                          {formatTimestampUtc(a.created_at)}
                        </time>
                      </div>

                      <div className="rounded-md border border-[#30363d] bg-[#161b22] p-4 transition-colors group-hover:border-[#58a6ff]/35">
                        <p className="text-sm leading-relaxed text-[#c9d1d9]">{a.details}</p>
                        {a.modlist_entries && (
                          <div className="mt-3 flex items-center justify-between border-t border-[#30363d] pt-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#8b949e]">Mod</span>
                              <span className="text-sm font-medium text-[#58a6ff]">{a.modlist_entries.mod_name}</span>
                            </div>
                            <Link
                              href={`/staff/modlist?search=${encodeURIComponent(a.modlist_entries.mod_name)}`}
                              className="text-xs font-medium text-[#58a6ff] hover:underline"
                            >
                              View in registry
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {result.total > 50 && (
          <div className="mt-12 flex justify-center">
            <Link
              href={`/staff/activity?page=${page + 1}`}
              className="rounded-md border border-[#30363d] bg-[#21262d] px-4 py-2 text-sm font-medium text-[#c9d1d9] transition-colors hover:bg-[#30363d] hover:text-[#f0f6fc]"
            >
              Load more
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

