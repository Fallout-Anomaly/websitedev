"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addStaffSheetComment, type SheetComment } from "../actions";
import { displayNameOrTeamMember } from "@/src/lib/display-name";
import ProfileAvatar from "@/src/components/ProfileAvatar";

function formatWhenUtc(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

export default function SheetComments({
  slug,
  comments,
}: {
  slug: string;
  comments: SheetComment[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <ul className="space-y-3" role="list">
        {comments.length === 0 ? (
          <li className="text-sm text-[#8b949e]">No comments yet.</li>
        ) : (
          comments.map((c) => (
            <li
              key={c.id}
              className="rounded-md border border-[#30363d] bg-[#161b22] px-3 py-2"
            >
              <p className="text-sm text-[#c9d1d9] whitespace-pre-wrap">
                {c.body}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6e7681]">
                <ProfileAvatar
                  storedPreset={c.author_avatar_preset}
                  seed={c.id}
                  label={displayNameOrTeamMember(c.author_display_name)}
                  size={20}
                />
                <span>
                  {displayNameOrTeamMember(c.author_display_name ?? undefined)}{" "}
                  ·{" "}
                  {c.created_at
                    ? formatWhenUtc(c.created_at)
                    : ""}
                </span>
              </p>
            </li>
          ))
        )}
      </ul>

      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const ta = (e.currentTarget.elements.namedItem(
            "body"
          ) as HTMLTextAreaElement);
          const body = ta.value;
          setBusy(true);
          const r = await addStaffSheetComment(slug, body);
          setBusy(false);
          if (r.error) setError(r.error);
          else {
            ta.value = "";
            router.refresh();
          }
        }}
      >
        <label htmlFor="comment-body" className="sr-only">
          New comment
        </label>
        <textarea
          id="comment-body"
          name="body"
          rows={3}
          required
          placeholder="Staff comment (stays on this site, not in the spreadsheet)."
          className="w-full max-w-2xl resize-y rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] placeholder-[#6e7681] outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
        />
        {error ? (
          <p className="text-sm text-[#ff7b72]">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="rounded-md border border-[#30363d] bg-[#21262d] px-3 py-1.5 text-sm font-medium text-[#f0f6fc] hover:bg-[#30363d] disabled:opacity-50"
        >
          {busy ? "Posting…" : "Add comment"}
        </button>
      </form>
    </div>
  );
}
