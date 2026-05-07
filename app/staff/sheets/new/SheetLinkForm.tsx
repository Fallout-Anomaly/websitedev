"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createStaffSheet } from "../actions";

export default function SheetLinkForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="max-w-lg space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
          const fd = new FormData(e.currentTarget);
          const r = await createStaffSheet(fd);
          if (r.error) setError(r.error);
          else if (r.slug) router.push(`/staff/sheets/${r.slug}`);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <label
          htmlFor="sl-title"
          className="mb-1.5 block text-sm font-medium text-[#f0f6fc]"
        >
          Title
        </label>
        <input
          id="sl-title"
          name="title"
          type="text"
          required
          placeholder="e.g. Crafting master framework"
          className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder-[#6e7681] outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
        />
      </div>

      <div>
        <label
          htmlFor="sl-url"
          className="mb-1.5 block text-sm font-medium text-[#f0f6fc]"
        >
          Google Sheets URL
        </label>
        <input
          id="sl-url"
          name="google_sheets_url"
          type="url"
          required
          placeholder="https://docs.google.com/spreadsheets/d/…/edit"
          className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder-[#6e7681] outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
        />
        <p className="mt-1 text-xs text-[#8b949e]">
          All editing happens in Google Sheets; this site only stores the link
          and staff notes.
        </p>
      </div>

      <div>
        <label
          htmlFor="sl-cat"
          className="mb-1.5 block text-sm font-medium text-[#f0f6fc]"
        >
          Category
        </label>
        <input
          id="sl-cat"
          name="category"
          type="text"
          placeholder="e.g. Crafting, QA, Modlist"
          className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder-[#6e7681] outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
        />
      </div>

      <div>
        <label
          htmlFor="sl-notes"
          className="mb-1.5 block text-sm font-medium text-[#f0f6fc]"
        >
          Notes
        </label>
        <textarea
          id="sl-notes"
          name="notes"
          rows={4}
          placeholder="Context for staff (not synced to the spreadsheet)."
          className="w-full resize-y rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder-[#6e7681] outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
        />
      </div>

      {error ? (
        <p className="rounded-md border border-[#f85149]/40 bg-[#f85149]/10 px-3 py-2 text-sm text-[#ff7b72]">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md border border-[#30363d] bg-[#21262d] px-4 py-2 text-sm font-semibold text-[#f0f6fc] transition-colors hover:bg-[#30363d] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <a
          href="/staff/sheets"
          className="text-sm text-[#58a6ff] hover:underline"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
