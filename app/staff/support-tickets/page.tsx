import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SupportTicketsListClient, {
  type SupportTicketRow,
} from "./SupportTicketsListClient";

export const metadata = {
  title: "Support tickets | Staff",
};

export default async function StaffSupportTicketsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fallen_world_support_tickets")
    .select(
      "id, reference, subject, contact_channel, status, created_at, filed_bug_report_id",
    )
    .order("created_at", { ascending: false })
    .limit(250);

  const rows = (data ?? []) as SupportTicketRow[];
  const openRows = rows.filter((r) => r.status !== "closed");
  const closedRows = rows.filter((r) => r.status === "closed");

  return (
    <>
      <nav className="mb-3 text-sm text-[#8b949e]" aria-label="Breadcrumb">
        <Link href="/staff" className="text-[#8b949e] hover:text-[#58a6ff]">
          Staff
        </Link>
        <span className="mx-1.5 text-[#484f58]">/</span>
        <span className="text-[#c9d1d9]">Support tickets</span>
      </nav>

      <header className="mb-6 border-b border-[#30363d] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#f0f6fc] sm:text-3xl">
          Support tickets
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8b949e]">
          Submissions from{" "}
          <Link
            href="/support/bug-report"
            className="text-[#58a6ff] hover:underline"
          >
            /support/bug-report
          </Link>
          . Open a ticket for the full report (formatted), thread, and actions.
          Players use{" "}
          <Link
            href="/support/bug-report#ticket-lookup"
            className="text-[#58a6ff] hover:underline"
          >
            /support/bug-report#ticket-lookup
          </Link>
          .
        </p>
      </header>

      {error ? (
        <p className="rounded border border-[#f85149]/40 bg-[#f85149]/10 px-4 py-3 text-sm text-[#ffa198]">
          Could not load tickets: {error.message}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#8b949e]">No tickets yet.</p>
      ) : (
        <SupportTicketsListClient openRows={openRows} closedRows={closedRows} />
      )}
    </>
  );
}
