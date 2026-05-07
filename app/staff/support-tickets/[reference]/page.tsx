import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeTicketReference } from "@/lib/support-ticket-token";
import StaffTicketReplyForm from "@/src/components/StaffTicketReplyForm";
import StaffSupportTicketActions from "@/src/components/staff/StaffSupportTicketActions";
import SupportTicketMarkdown from "@/src/components/staff/SupportTicketMarkdown";
import { displayNameOrTeamMember } from "@/src/lib/display-name";
import ProfileAvatar from "@/src/components/ProfileAvatar";

type PageProps = {
  params: Promise<{ reference: string }>;
};

type MessageRow = {
  id: string;
  author_role: string;
  body: string;
  staff_display_name: string | null;
  staff_avatar_preset: string | null;
  staff_email: string | null;
  created_at: string;
};

function formatWhenUtc(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

export async function generateMetadata({ params }: PageProps) {
  const { reference: raw } = await params;
  const reference = normalizeTicketReference(decodeURIComponent(raw));
  return {
    title: reference ? `${reference} | Support ticket` : "Support ticket",
  };
}

export default async function StaffSupportTicketDetailPage({ params }: PageProps) {
  const { reference: raw } = await params;
  const reference = normalizeTicketReference(decodeURIComponent(raw));
  if (!reference) {
    notFound();
  }

  const supabase = await createClient();
  const { data: ticket, error } = await supabase
    .from("fallen_world_support_tickets")
    .select(
      "id, reference, subject, contact_channel, status, created_at, report_body, filed_bug_report_id",
    )
    .eq("reference", reference)
    .maybeSingle();

  if (error || !ticket) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("fallen_world_support_ticket_messages")
    .select(
      "id, author_role, body, staff_display_name, staff_avatar_preset, staff_email, created_at",
    )
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true });

  const thread = (messages ?? []) as MessageRow[];
  const when = formatWhenUtc(ticket.created_at);

  const filedId =
    ticket.filed_bug_report_id != null
      ? Number(ticket.filed_bug_report_id)
      : null;

  return (
    <>
      <nav className="mb-3 text-sm text-[#8b949e]" aria-label="Breadcrumb">
        <Link href="/staff" className="text-[#8b949e] hover:text-[#58a6ff]">
          Staff
        </Link>
        <span className="mx-1.5 text-[#484f58]">/</span>
        <Link
          href="/staff/support-tickets"
          className="text-[#8b949e] hover:text-[#58a6ff]"
        >
          Support tickets
        </Link>
        <span className="mx-1.5 text-[#484f58]">/</span>
        <span className="text-[#c9d1d9]">{ticket.reference}</span>
      </nav>

      <header className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-[#f0f6fc]">
            {ticket.reference}
          </h1>
          <span
            className={
              ticket.status === "open"
                ? "rounded-full bg-[#238636]/25 px-2.5 py-0.5 text-xs font-medium text-[#3fb950]"
                : ticket.status === "closed"
                  ? "rounded-full bg-[#30363d] px-2.5 py-0.5 text-xs text-[#8b949e]"
                  : "rounded-full bg-[#9e6a03]/25 px-2.5 py-0.5 text-xs font-medium text-[#d29922]"
            }
          >
            {ticket.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-[#8b949e]">
          {ticket.subject?.trim() || "— no subject —"}
          {ticket.contact_channel ? (
            <span className="text-[#6e7681]"> · {ticket.contact_channel}</span>
          ) : null}
          <span className="text-[#6e7681]"> · {when}</span>
        </p>
      </header>

      <StaffSupportTicketActions
        reference={ticket.reference}
        initialStatus={ticket.status}
        filedBugReportId={Number.isFinite(filedId) ? filedId : null}
      />

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-[#6e7681]">
          Original report
        </h2>
        <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
          <SupportTicketMarkdown source={ticket.report_body ?? ""} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-[#6e7681]">
          Thread
        </h2>
        {thread.length === 0 ? (
          <p className="text-sm text-[#8b949e]">No messages yet.</p>
        ) : (
          <ul className="space-y-3">
            {thread.map((m) => (
              <li
                key={m.id}
                className={`rounded-lg border px-4 py-3 text-sm ${
                  m.author_role === "staff"
                    ? "border-[#238636]/35 bg-[#238636]/10"
                    : "border-[#30363d] bg-[#161b22]"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[#6e7681]">
                  <ProfileAvatar
                    storedPreset={
                      m.author_role === "staff"
                        ? m.staff_avatar_preset
                        : undefined
                    }
                    seed={m.id}
                    label={
                      m.author_role === "staff"
                        ? displayNameOrTeamMember(m.staff_display_name)
                        : "Player"
                    }
                    size={24}
                  />
                  <span>
                    {m.author_role === "staff" ? (
                      <>
                        <span className="text-[#c9d1d9]">
                          {displayNameOrTeamMember(m.staff_display_name)}
                        </span>
                        {m.staff_email ? (
                          <span className="ml-1.5 font-mono text-[#8b949e]">
                            ({m.staff_email})
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "Player"
                    )}{" "}
                    ·{" "}
                    {formatWhenUtc(m.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#c9d1d9]">
                  {m.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ticket.status === "closed" ? (
        <p className="mb-6 text-sm text-[#8b949e]">
          Ticket is closed — reopen it to post more staff replies.
        </p>
      ) : (
        <StaffTicketReplyForm reference={ticket.reference} />
      )}
    </>
  );
}
