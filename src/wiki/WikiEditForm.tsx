"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import WikiMarkdown from "@/src/components/WikiMarkdown";

type Props = {
  initialPath: string;
  initialTitle: string;
  initialContentMd: string;
  initialPublished: boolean;
  initialPublishRequested: boolean;
  canPublish: boolean;
};

export default function WikiEditForm({
  initialPath,
  initialTitle,
  initialContentMd,
  initialPublished,
  initialPublishRequested,
  canPublish,
}: Props) {
  const router = useRouter();
  useMemo(() => createClient(), []);

  const [path, setPath] = useState(initialPath);
  const [title, setTitle] = useState(initialTitle);
  const [contentMd, setContentMd] = useState(initialContentMd);
  const [published, setPublished] = useState(initialPublished);
  const [publishRequested, setPublishRequested] = useState(
    initialPublishRequested,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/wiki/api/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          title,
          contentMd,
          // Staff: publish now. Non-staff: request approval.
          published: canPublish ? published : publishRequested,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to save.");
      }

      const data = (await res.json()) as { path: string };
      router.push(`/wiki/${data.path}`);
      // Navigation to the page is enough; avoid extra refresh.
    } catch (e) {
      setError((e as Error)?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 grid gap-4">
      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-2">
        <label className="text-xs font-bold text-neutral-400 tracking-widest uppercase">
          Path
        </label>
        <input
          value={path === "new" ? "" : path}
          onChange={(e) => setPath(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/40"
          placeholder="getting-started/installation"
        />
        {initialPath === "new" ? (
          <div className="text-xs text-white/50">
            Leave blank to auto-generate from the title.
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-bold text-neutral-400 tracking-widest uppercase">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/40"
          placeholder="Getting started"
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-4">
          <label className="text-xs font-bold text-neutral-400 tracking-widest uppercase">
            Markdown
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
              <button
                type="button"
                onClick={() => setMode("edit")}
                className={`rounded-md px-2 py-1 text-[11px] font-bold tracking-widest uppercase transition-colors ${
                  mode === "edit"
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`rounded-md px-2 py-1 text-[11px] font-bold tracking-widest uppercase transition-colors ${
                  mode === "preview"
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Preview
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs text-neutral-300 select-none">
              <input
                type="checkbox"
                checked={canPublish ? published : publishRequested}
                onChange={(e) =>
                  canPublish
                    ? setPublished(e.target.checked)
                    : setPublishRequested(e.target.checked)
                }
              />
              <span>{canPublish ? "Published" : "Request publish"}</span>
              {!canPublish && publishRequested ? (
                <span className="text-[11px] text-amber-200/80">
                  (pending approval)
                </span>
              ) : !canPublish ? (
                <span className="text-[11px] text-white/45">(staff approval)</span>
              ) : null}
            </label>
          </div>
        </div>
        {mode === "edit" ? (
          <textarea
            value={contentMd}
            onChange={(e) => setContentMd(e.target.value)}
            className="w-full min-h-[420px] rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/40"
            placeholder="Write markdown here…"
          />
        ) : (
          <div className="w-full min-h-[420px] rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            {title ? (
              <div className="mb-4 text-2xl font-bold tracking-tight text-white">
                {title}
              </div>
            ) : null}
            {contentMd.trim() ? (
              <WikiMarkdown source={contentMd} />
            ) : (
              <div className="text-sm text-white/50">Nothing to preview yet.</div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-semibold text-neutral-200 hover:border-white/20"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

