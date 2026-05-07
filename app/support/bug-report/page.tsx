import type { Metadata } from "next";
import Link from "next/link";
import FallenWorldBugReportForm from "@/src/components/FallenWorldBugReportForm";
import SupportTicketLookup from "@/src/components/SupportTicketLookup";

export const metadata: Metadata = {
  title: "Bug Report & Support | Fallen World",
  description:
    "Standardized Fallen World (Fallout 4 modlist) bug report template — system requirements, reproduction steps, logs, and Discord support.",
};

export default function FallenWorldBugReportPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="mx-auto max-w-xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:pt-16">
        <nav className="mb-8 text-xs text-neutral-500">
          <Link href="/" className="text-neutral-400 hover:text-white">
            Home
          </Link>
          <span className="mx-2 text-neutral-700">/</span>
          <span className="text-neutral-400">Report a bug</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Report a bug
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-500">
            A few quick steps — then we copy a ready-to-paste report for{" "}
            <a
              href="https://discord.gg/mg2hhGvVKB"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-400/90 underline-offset-2 hover:underline"
            >
              Discord
            </a>
            . After you submit, save your ticket number and use{" "}
            <Link
              href="#ticket-lookup"
              className="font-medium text-emerald-400/90 underline-offset-2 hover:underline"
            >
              Look up your ticket
            </Link>{" "}
            to read replies and respond. Fallen World expects{" "}
            <span className="text-neutral-400">6 GB+ VRAM</span> and an{" "}
            <span className="text-neutral-400">SSD or NVMe</span>.
          </p>
        </header>

        <FallenWorldBugReportForm />

        <div id="ticket-lookup" className="mt-14 border-t border-neutral-800 pt-10 scroll-mt-24">
          <header className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Ticket lookup
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              Already submitted? Enter your ticket number to read staff replies
              and respond. Keep it private — anyone with the number can open the
              ticket.
            </p>
          </header>
          <SupportTicketLookup />
        </div>

        <p className="mt-10 text-center text-[11px] text-neutral-600">
          Fallen World · 2026
        </p>
      </div>
    </div>
  );
}
