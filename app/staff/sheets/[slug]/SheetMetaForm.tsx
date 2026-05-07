"use client";

import { useState } from "react";
import { updateStaffSheetMeta } from "../actions";

type Props = {
  slug: string;
  title: string;
  googleSheetsUrl: string;
  category: string | null;
  notes: string | null;
};

export default function SheetMetaForm({
  slug,
  title: initialTitle,
  googleSheetsUrl: initialUrl,
  category: initialCat,
  notes: initialNotes,
}: Props) {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setMessage(null);
        const fd = new FormData(e.currentTarget);
        const r = await updateStaffSheetMeta(fd);
        if (r.error) setMessage(r.error);
        else setMessage("Saved.");
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <div>
        <label
          htmlFor="meta-title"
          className="mb-1.5 block text-sm font-medium text-[#f0f6fc]"
        >
          Title
        </label>
        <input
          id="meta-title"
          name="title"
          type="text"
          required
          defaultValue={initialTitle}
          className="w-full max-w-xl rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
        />
      </div>
      <div>
        <label
          htmlFor="meta-url"
          className="mb-1.5 block text-sm font-medium text-[#f0f6fc]"
        >
          Google Sheets URL
        </label>
        <input
          id="meta-url"
          name="google_sheets_url"
          type="url"
          required
          defaultValue={initialUrl}
          className="w-full max-w-xl rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
        />
      </div>
      <div>
        <label
          htmlFor="meta-cat"
          className="mb-1.5 block text-sm font-medium text-[#f0f6fc]"
        >
          Category
        </label>
        <input
          id="meta-cat"
          name="category"
          type="text"
          defaultValue={initialCat ?? ""}
          className="w-full max-w-xl rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
        />
      </div>
      <div>
        <label
          htmlFor="meta-notes"
          className="mb-1.5 block text-sm font-medium text-[#f0f6fc]"
        >
          Notes
        </label>
        <textarea
          id="meta-notes"
          name="notes"
          rows={5}
          defaultValue={initialNotes ?? ""}
          className="w-full max-w-2xl resize-y rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-md border border-[#30363d] bg-[#21262d] px-4 py-2 text-sm font-semibold text-[#f0f6fc] hover:bg-[#30363d]"
        >
          Save details
        </button>
        {message ? (
          <span
            className={
              message === "Saved."
                ? "text-sm text-[#3fb950]"
                : "text-sm text-[#ff7b72]"
            }
          >
            {message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
