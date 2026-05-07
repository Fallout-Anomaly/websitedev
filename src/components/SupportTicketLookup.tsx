"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { displayNameOrTeamMember } from "@/src/lib/display-name";
import ProfileAvatar from "@/src/components/ProfileAvatar";
import { useRealtime } from "@/lib/realtime-client";
import SupportTicketMarkdown from "@/src/components/staff/SupportTicketMarkdown";

type Ticket = {
  id: string;
  reference: string;
  subject: string | null;
  contact_channel: string | null;
  status: string;
  created_at: string;
  report_body: string;
};

type Msg = {
  id: string;
  author_role: string;
  body: string;
  staff_display_name?: string | null;
  staff_avatar_preset?: string | null;
  created_at: string;
};

export default function SupportTicketLookup() {
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const load = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/support/ticket/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: reference.trim(),
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          message?: string;
          ticket?: Ticket;
          messages?: Msg[];
        };

        if (!res.ok || !data.ok || !data.ticket) {
          setError(
            data.error === "Ticket not found"
              ? "No ticket with that number."
              : data.message ?? "Could not load ticket.",
          );
          setTicket(null);
          setMessages([]);
          return;
        }

        setTicket(data.ticket);
        setMessages(data.messages ?? []);
      } catch {
        setError("Network error. Try again.");
        setTicket(null);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    },
    [reference],
  );

  const ticketChannel = useMemo(() => {
    const ref = ticket?.reference?.trim();
    return ref ? `ticket:${ref}` : null;
  }, [ticket?.reference]);

  useRealtime({
    channels: ticketChannel ? [ticketChannel] : undefined,
    events: ["notification.created"],
    onData() {
      if (!ticket?.reference) return;
      fetch("/api/support/ticket/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ticket.reference }),
      })
        .then((r) => r.json())
        .then((data: { ok?: boolean; ticket?: Ticket; messages?: Msg[] }) => {
          if (data?.ok && data.ticket) {
            setTicket(data.ticket);
            setMessages(data.messages ?? []);
          }
        })
        .catch(() => {});
    },
  });

  useEffect(() => {
    if (!ticket) return;
    setReference(ticket.reference);
  }, [ticket]);

  const sendReply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!ticket) return;
      const message = replyText.trim();
      if (!message || replySending) return;
      setReplySending(true);
      setReplyError(null);
      try {
        const res = await fetch("/api/support/ticket/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: reference.trim(),
            message,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          message?: Msg;
        };
        if (!res.ok || !data.ok || !data.message) {
          setReplyError(data.error ?? "Could not send");
          return;
        }
        const newMsg = data.message;
        setMessages((m) => [...m, newMsg]);
        setReplyText("");
      } catch {
        setReplyError("Network error");
      } finally {
        setReplySending(false);
      }
    },
    [reference, replySending, replyText, ticket],
  );

  return (
    <div className="space-y-8">
      <form onSubmit={load} className="space-y-4">
        <label className="block text-xs font-medium text-neutral-400">
          Ticket number
          <input
            className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500/45 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder="e.g. FW-A1B2C3D4E5"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            autoComplete="off"
            name="support-ticket-reference"
          />
        </label>
        {error ? (
          <p className="text-sm text-red-300/95" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading || !reference.trim()}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Loading…" : "Open ticket"}
        </button>
      </form>

      {ticket ? (
        <div className="space-y-6 rounded-2xl border border-white/[0.06] bg-[#0c0c0c]/80 p-5 sm:p-7">
          <header className="border-b border-white/[0.06] pb-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-mono text-lg font-semibold text-white">
                {ticket.reference}
              </h2>
              <span
                className={
                  ticket.status === "open"
                    ? "text-xs font-medium text-emerald-400"
                    : ticket.status === "closed"
                      ? "text-xs text-neutral-500"
                      : "text-xs text-amber-400"
                }
              >
                {ticket.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-400">
              {ticket.subject?.trim() || "—"}
              {ticket.contact_channel ? (
                <span className="text-neutral-600">
                  {" "}
                  · {ticket.contact_channel}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              Submitted{" "}
              {new Date(ticket.created_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </header>

          <details className="rounded-lg border border-white/[0.06] bg-white/[0.02]">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-neutral-400">
              Original report
            </summary>
            <div className="max-h-64 overflow-auto border-t border-white/[0.06] p-3">
              <SupportTicketMarkdown source={ticket.report_body ?? ""} />
            </div>
          </details>

          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Conversation
            </h3>
            {messages.length === 0 ? (
              <p className="text-sm text-neutral-500">No replies yet.</p>
            ) : (
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-lg border px-3 py-2.5 text-sm ${
                      m.author_role === "staff"
                        ? "border-emerald-500/20 bg-emerald-950/15 text-neutral-200"
                        : "border-white/[0.06] bg-white/[0.03] text-neutral-300"
                    }`}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-neutral-500">
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
                            : "You"
                        }
                        size={22}
                        className="ring-neutral-700"
                      />
                      <span className="font-medium text-neutral-400">
                        {m.author_role === "staff"
                          ? displayNameOrTeamMember(m.staff_display_name)
                          : "You"}
                      </span>
                      <span>
                        {new Date(m.created_at).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap">
                      <SupportTicketMarkdown source={m.body ?? ""} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {ticket.status === "closed" ? (
            <p className="text-sm text-neutral-500">This ticket is closed — new replies are disabled.</p>
          ) : (
            <form onSubmit={sendReply} className="space-y-2 border-t border-white/[0.06] pt-4">
              <label className="block text-xs font-medium text-neutral-400">
                Your reply
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Add details or answer staff questions…"
                  className="mt-1.5 w-full resize-y rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500/45 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>
              {replyError ? (
                <p className="text-xs text-red-300">{replyError}</p>
              ) : null}
              <button
                type="submit"
                disabled={replySending || !replyText.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {replySending ? "Sending…" : "Send reply"}
              </button>
            </form>
          )}

          <p className="text-xs text-neutral-600">
            Filed a new bug?{" "}
            <Link href="/support/bug-report" className="text-emerald-400/90 hover:underline">
              Start a new report
            </Link>{" "}
            (you’ll get a new ticket number).
          </p>
        </div>
      ) : null}
    </div>
  );
}
