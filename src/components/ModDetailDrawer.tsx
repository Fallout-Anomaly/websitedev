"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  addModComment,
  reportModBug,
  deleteModComment,
  getModActivity,
  updateModDetails,
  getBugReportsForModName,
  loadModDrawerInitial,
} from "@/app/staff/modlist/actions";
import TiptapEditor, {
  type TiptapEditorHandle,
  isTiptapEmptyHtml,
} from "./TiptapEditor";
import { displayNameOrTeamMember } from "@/src/lib/display-name";
import { formatReporterLabel } from "@/src/lib/reporter-label";
import ProfileAvatar from "@/src/components/ProfileAvatar";

type ModlistEntry = {
  id: number;
  load_order: number;
  mod_name: string;
  status: string;
  category: string;
  author: string;
  version: string;
  nexus_url: string;
  notes: string;
};

type Comment = {
  id: number;
  content: string;
  user_email: string;
  display_name?: string | null;
  author_avatar_preset?: string | null;
  created_at: string;
  user_id: string;
  parent_id: number | null;
};

type Activity = {
  id: number;
  action_type: string;
  details: string;
  user_email: string;
  user_display_name?: string | null;
  user_id?: string | null;
  created_at: string;
};

type ModBugRow = {
  id: number;
  status: string;
  severity: string | null;
  issue_description: string | null;
  date_reported: string | null;
  reported_by: string | null;
};

type Props = {
  mod: ModlistEntry | null;
  onClose: () => void;
  /** Registry category names (from modlist_categories + legacy values on mods). */
  categoryOptions?: string[];
};

type TabId = "notes" | "bugs" | "activity" | "manage";

type DrawerCounts = {
  threads: number;
  activityEntries: number;
  bugs: number;
  timeline: number;
};

const emptyCounts: DrawerCounts = {
  threads: 0,
  activityEntries: 0,
  bugs: 0,
  timeline: 0,
};

function TabButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative whitespace-nowrap border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${
        active
          ? "border-[#f78166] text-[#f0f6fc]"
          : "border-transparent text-[#8b949e] hover:text-[#c9d1d9]"
      }`}
    >
      {children}
      {count !== undefined ? (
        <span className="ml-2 rounded-full bg-[#21262d] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#8b949e]">
          {count}
        </span>
      ) : null}
    </button>
  );
}

function MetaRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-[11px] font-medium text-[#6e7681]">{label}</p>
      <p className="break-words text-[13px] text-[#c9d1d9]">{value}</p>
    </div>
  );
}

export default function ModDetailDrawer({
  mod,
  onClose,
  categoryOptions = [],
}: Props) {
  const modId = mod?.id ?? null;
  const modName = mod?.mod_name ?? "";

  const [activeTab, setActiveTab] = useState<TabId>("notes");
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [bugs, setBugs] = useState<ModBugRow[]>([]);
  const [drawerCounts, setDrawerCounts] = useState<DrawerCounts>(emptyCounts);
  const [newComment, setNewComment] = useState("");
  const [threadReply, setThreadReply] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [activityReady, setActivityReady] = useState(false);
  const [bugsReady, setBugsReady] = useState(false);
  const mainEditorRef = useRef<TiptapEditorHandle>(null);
  const threadEditorRef = useRef<TiptapEditorHandle>(null);
  const hasLoadedActivityRef = useRef(false);
  const hasLoadedBugsRef = useRef(false);
  const [isReportingBug, setIsReportingBug] = useState(false);
  const [bugDesc, setBugDesc] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [selectedThread, setSelectedThread] = useState<Comment | null>(null);

  const [editName, setEditName] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editNexusUrl, setEditNexusUrl] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadBugsFull = useCallback(async () => {
    if (!modName) return;
    try {
      const res = await getBugReportsForModName(modName);
      if (!res.error) setBugs((res.data as ModBugRow[]) || []);
    } finally {
      setBugsReady(true);
    }
  }, [modName]);

  const loadActivityFull = useCallback(async () => {
    if (modId == null) return;
    try {
      const res = await getModActivity(modId);
      if (!res.error) setActivity(res.data as Activity[]);
    } finally {
      setActivityReady(true);
    }
  }, [modId]);

  const syncAfterMutation = useCallback(async () => {
    if (modId == null || !modName) return;
    const init = await loadModDrawerInitial(modId, modName);
    if (!init.error) {
      setComments(init.comments as Comment[]);
      setDrawerCounts(init.counts);
    }
    if (hasLoadedActivityRef.current) {
      const a = await getModActivity(modId);
      if (!a.error) setActivity(a.data as Activity[]);
    }
    if (hasLoadedBugsRef.current) {
      const b = await getBugReportsForModName(modName);
      if (!b.error) {
        setBugs((b.data as ModBugRow[]) || []);
        setBugsReady(true);
      }
    }
  }, [modId, modName]);

  useEffect(() => {
    if (modId == null || !modName) return;
    hasLoadedActivityRef.current = false;
    hasLoadedBugsRef.current = false;
    setNewComment("");
    setThreadReply("");
    setSelectedThread(null);
    setActiveTab("notes");
    setIsReportingBug(false);
    setComments([]);
    setActivity([]);
    setBugs([]);
    setDrawerCounts(emptyCounts);
    setActivityReady(false);
    setBugsReady(false);
    mainEditorRef.current?.clear();
    threadEditorRef.current?.clear();

    let cancelled = false;
    setLoadingInitial(true);
    void loadModDrawerInitial(modId, modName).then((res) => {
      if (cancelled) return;
      if (!res.error) {
        setComments(res.comments as Comment[]);
        setDrawerCounts(res.counts);
      }
      setLoadingInitial(false);
    });
    return () => {
      cancelled = true;
    };
  }, [modId, modName]);

  useEffect(() => {
    if (modId == null || !modName) return;
    if (activeTab === "activity" && !hasLoadedActivityRef.current) {
      hasLoadedActivityRef.current = true;
      void loadActivityFull();
    }
    if (activeTab === "bugs" && !hasLoadedBugsRef.current) {
      hasLoadedBugsRef.current = true;
      void loadBugsFull();
    }
  }, [activeTab, modId, modName, loadActivityFull, loadBugsFull]);

  useEffect(() => {
    if (mod && activeTab === "manage") {
      setEditName(mod.mod_name || "");
      setEditAuthor(mod.author || "");
      setEditVersion(mod.version || "");
      setEditNexusUrl(mod.nexus_url || "");
      setEditStatus(mod.status || "");
      setEditCategory(mod.category || "");
    }
  }, [mod, activeTab]);

  const handleSubmitComment = useCallback(async () => {
    if (modId == null) return;
    const html = selectedThread
      ? (threadEditorRef.current?.getHTML() ?? "")
      : (mainEditorRef.current?.getHTML() ?? "");
    if (isTiptapEmptyHtml(html)) return;
    const parentId = selectedThread?.id || null;
    const res = await addModComment(modId, html, parentId);
    if (!res.error) {
      if (selectedThread) {
        setThreadReply("");
        threadEditorRef.current?.clear();
      } else {
        setNewComment("");
        mainEditorRef.current?.clear();
      }
      void syncAfterMutation();
    }
  }, [modId, selectedThread, syncAfterMutation]);

  async function handleDeleteComment(id: number) {
    if (!confirm("Are you sure you want to delete this note?")) return;
    const res = await deleteModComment(id);
    if (res.success) {
      void syncAfterMutation();
      if (selectedThread?.id === id) setSelectedThread(null);
    } else if (res.error) {
      alert(res.error);
    }
  }

  async function handleReportBug() {
    if (modId == null || !modName || !bugDesc.trim()) return;
    const res = await reportModBug(modId, modName, bugDesc, severity);
    if (!res.error) {
      setBugDesc("");
      setIsReportingBug(false);
      setActiveTab("bugs");
      hasLoadedBugsRef.current = true;
      void syncAfterMutation();
    }
  }

  async function handleUpdateMod() {
    if (!mod) return;
    setIsSaving(true);
    const res = await updateModDetails(mod.id, {
      mod_name: editName,
      author: editAuthor,
      version: editVersion,
      nexus_url: editNexusUrl,
      status: editStatus,
      category: editCategory,
    });

    if (!res.error) {
      alert("Mod updated successfully. Refreshing list...");
      window.location.reload();
    } else {
      alert("Error: " + res.error);
    }
    setIsSaving(false);
  }

  const rootComments = useMemo(
    () => comments.filter((c) => !c.parent_id),
    [comments]
  );

  const threadReplies = useMemo(() => {
    if (!selectedThread) return [];
    return comments.filter((r) => r.parent_id === selectedThread.id);
  }, [comments, selectedThread]);

  const replyCountByParent = useMemo(() => {
    const m = new Map<number, number>();
    for (const c of comments) {
      if (c.parent_id != null) {
        m.set(c.parent_id, (m.get(c.parent_id) ?? 0) + 1);
      }
    }
    return m;
  }, [comments]);

  const categorySelectOptions = useMemo(() => {
    const list = [...categoryOptions];
    const cur = mod?.category;
    if (cur && !list.includes(cur)) list.push(cur);
    const ec = editCategory;
    if (ec && !list.includes(ec)) list.push(ec);
    return list;
  }, [categoryOptions, mod?.category, editCategory]);

  const mergedTimeline = useMemo(() => {
    type Entry =
      | { kind: "activity"; created_at: string; payload: Activity }
      | {
          kind: "comment";
          created_at: string;
          payload: Pick<
            Comment,
            | "id"
            | "user_id"
            | "user_email"
            | "content"
            | "display_name"
            | "author_avatar_preset"
          >;
        };
    const out: Entry[] = [];
    for (const a of activity) {
      out.push({ kind: "activity", created_at: a.created_at, payload: a });
    }
    for (const c of rootComments) {
      out.push({
        kind: "comment",
        created_at: c.created_at,
        payload: {
          id: c.id,
          user_id: c.user_id,
          user_email: c.user_email,
          display_name: c.display_name,
          author_avatar_preset: c.author_avatar_preset,
          content: c.content,
        },
      });
    }
    return out.sort(
      (x, y) =>
        new Date(y.created_at).getTime() - new Date(x.created_at).getTime()
    );
  }, [activity, rootComments]);

  if (!mod) return null;

  const bugsTrackerHref = `/staff/bugs?search=${encodeURIComponent(mod.mod_name)}&status=Open`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 animate-in fade-in"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative flex h-full w-full max-w-[min(100vw,1180px)] flex-col overflow-hidden border-l border-[#30363d] bg-[#0d1117] shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <header className="shrink-0 border-b border-[#30363d] px-5 pt-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[#8b949e]">
                    <span className="font-mono tabular-nums text-[#c9d1d9]">
                      #{mod.load_order}
                    </span>
                    <span className="text-[#484f58]">·</span>
                    <span
                      className={
                        mod.status === "Enabled"
                          ? "text-[#3fb950]"
                          : mod.status === "Testing"
                            ? "text-[#d29922]"
                            : "text-[#8b949e]"
                      }
                    >
                      {mod.status}
                    </span>
                    {mod.category ? (
                      <>
                        <span className="text-[#484f58]">·</span>
                        <span>{mod.category}</span>
                      </>
                    ) : null}
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-[#f0f6fc] sm:text-2xl">
                    {mod.mod_name}
                  </h2>
                  <p className="mt-1 text-sm text-[#8b949e]">
                    {mod.author ? (
                      <>
                        by{" "}
                        <span className="text-[#c9d1d9]">{mod.author}</span>
                      </>
                    ) : (
                      "Author unknown"
                    )}
                    {mod.version ? (
                      <span className="text-[#484f58]">
                        {" "}
                        · v{mod.version}
                      </span>
                    ) : null}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-md p-2 text-[#8b949e] transition-colors hover:bg-[#21262d] hover:text-[#f0f6fc]"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <div className="no-scrollbar -mx-1 mt-4 flex gap-5 overflow-x-auto border-b border-[#30363d]">
                <TabButton
                  active={activeTab === "notes"}
                  onClick={() => setActiveTab("notes")}
                  count={drawerCounts.threads}
                >
                  Conversation
                </TabButton>
                <TabButton
                  active={activeTab === "bugs"}
                  onClick={() => setActiveTab("bugs")}
                  count={drawerCounts.bugs}
                >
                  Issues
                </TabButton>
                <TabButton
                  active={activeTab === "activity"}
                  onClick={() => setActiveTab("activity")}
                  count={drawerCounts.timeline}
                >
                  Timeline
                </TabButton>
                <TabButton
                  active={activeTab === "manage"}
                  onClick={() => setActiveTab("manage")}
                >
                  Settings
                </TabButton>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
              <div className="mb-8 grid grid-cols-2 gap-x-4 gap-y-3 border-b border-[#21262d] pb-6 text-sm lg:hidden">
                <MetaRow label="Load order" value={mod.load_order} />
                <MetaRow label="Status" value={mod.status} />
                <MetaRow label="Category" value={mod.category || "—"} />
                <MetaRow label="Version" value={mod.version || "—"} />
                <MetaRow
                  className="col-span-2"
                  label="Nexus"
                  value={
                    mod.nexus_url ? (
                      <a
                        href={mod.nexus_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#58a6ff] hover:underline"
                      >
                        Open link
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
              </div>

              {activeTab === "manage" && (
                <div className="max-w-2xl space-y-6 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#8b949e]">
                        Mod name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border-b border-[#30363d] bg-transparent py-2 text-sm text-[#e6edf3] outline-none transition-colors focus:border-[#58a6ff]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#8b949e]">
                        Author
                      </label>
                      <input
                        type="text"
                        value={editAuthor}
                        onChange={(e) => setEditAuthor(e.target.value)}
                        className="w-full border-b border-[#30363d] bg-transparent py-2 text-sm text-[#e6edf3] outline-none transition-colors focus:border-[#58a6ff]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#8b949e]">
                        Version
                      </label>
                      <input
                        type="text"
                        value={editVersion}
                        onChange={(e) => setEditVersion(e.target.value)}
                        className="w-full border-b border-[#30363d] bg-transparent py-2 text-sm text-[#e6edf3] outline-none transition-colors focus:border-[#58a6ff]"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-[#8b949e]">
                        Category
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full cursor-pointer border border-[#30363d] bg-[#0d1117] py-2 pl-3 pr-8 text-sm text-[#e6edf3] outline-none transition-colors focus:border-[#58a6ff] rounded-md"
                      >
                        <option value="">— None —</option>
                        {categorySelectOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#6e7681]">
                        Extend the list by adding rows to{" "}
                        <span className="font-mono text-[#8b949e]">modlist_categories</span>.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#8b949e]">
                      Nexus URL
                    </label>
                    <input
                      type="url"
                      value={editNexusUrl}
                      onChange={(e) => setEditNexusUrl(e.target.value)}
                      placeholder="https://…"
                      className="w-full border-b border-[#30363d] bg-transparent py-2 text-sm text-[#e6edf3] outline-none transition-colors focus:border-[#58a6ff]"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-medium text-[#8b949e]">
                      Status
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {["Enabled", "Disabled", "Testing", "Deprecated"].map(
                        (s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setEditStatus(s)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                              editStatus === s
                                ? "bg-[#21262d] text-[#f0f6fc] ring-1 ring-[#30363d]"
                                : "text-[#8b949e] hover:text-[#c9d1d9]"
                            }`}
                          >
                            {s}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#21262d] pt-6">
                    <button
                      type="button"
                      onClick={() => void handleUpdateMod()}
                      disabled={isSaving}
                      className="text-sm font-semibold text-[#58a6ff] hover:underline disabled:opacity-50"
                    >
                      {isSaving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-6">
                  {mod.notes ? (
                    <div className="border-l-2 border-[#d29922]/60 pl-4 text-sm leading-relaxed text-[#c9d1d9]">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#d29922]">
                        Registry notes
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{mod.notes}</p>
                    </div>
                  ) : null}

                  <div className="space-y-0 divide-y divide-[#21262d]">
                    {loadingInitial ? (
                      <div className="py-12 text-center text-sm text-[#8b949e]">
                        Loading…
                      </div>
                    ) : rootComments.length === 0 ? (
                      <div className="py-12 text-center text-sm text-[#8b949e]">
                        No notes yet. Add one below.
                      </div>
                    ) : (
                      rootComments.map((c) => {
                        const replyCount = replyCountByParent.get(c.id) ?? 0;
                        return (
                          <div
                            key={c.id}
                            role="button"
                            tabIndex={0}
                            onDoubleClick={() => setSelectedThread(c)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedThread(c);
                              }
                            }}
                            className="group py-5 first:pt-0"
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2 text-xs text-[#8b949e]">
                                <ProfileAvatar
                                  storedPreset={c.author_avatar_preset}
                                  seed={c.user_id}
                                  label={displayNameOrTeamMember(c.display_name)}
                                  size={22}
                                />
                                <span className="font-semibold text-[#c9d1d9]">
                                  {displayNameOrTeamMember(c.display_name)}
                                </span>
                                <span className="text-[#484f58]">·</span>
                                <span>
                                  {new Date(c.created_at).toLocaleString()}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDeleteComment(c.id);
                                }}
                                className="opacity-0 transition-opacity group-hover:opacity-100 text-[#8b949e] hover:text-[#f85149]"
                                aria-label="Delete note"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none text-[#c9d1d9]">
                              <div
                                dangerouslySetInnerHTML={{ __html: c.content }}
                              />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#6e7681]">
                              {replyCount > 0 ? (
                                <span>
                                  {replyCount}{" "}
                                  {replyCount === 1 ? "reply" : "replies"}
                                </span>
                              ) : null}
                              <span className="opacity-0 transition-opacity group-hover:opacity-100">
                                Double-click or Enter to open thread
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeTab === "bugs" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setIsReportingBug(!isReportingBug)}
                      className="text-sm font-semibold text-[#58a6ff] hover:underline"
                    >
                      {isReportingBug ? "Cancel report" : "New issue for this mod"}
                    </button>
                    <Link
                      href={bugsTrackerHref}
                      className="text-sm text-[#8b949e] hover:text-[#58a6ff] hover:underline"
                    >
                      Open in tracker →
                    </Link>
                  </div>

                  {isReportingBug ? (
                    <div className="space-y-4 border-b border-[#21262d] pb-6">
                      <textarea
                        value={bugDesc}
                        onChange={(e) => setBugDesc(e.target.value)}
                        placeholder="Describe the issue…"
                        className="min-h-[120px] w-full resize-y border-0 border-b border-[#30363d] bg-transparent py-2 text-sm text-[#e6edf3] outline-none focus:border-[#58a6ff]"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {["Low", "Medium", "High", "Critical"].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setSeverity(s)}
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                severity === s
                                  ? "bg-[#21262d] text-[#f0f6fc] ring-1 ring-[#30363d]"
                                  : "text-[#8b949e] hover:text-[#c9d1d9]"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleReportBug()}
                          className="text-sm font-semibold text-[#58a6ff] hover:underline"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {!bugsReady ? (
                    <div className="py-12 text-center text-sm text-[#8b949e]">
                      Loading…
                    </div>
                  ) : bugs.length === 0 ? (
                    <p className="py-12 text-center text-sm text-[#8b949e]">
                      No issues filed for this mod name yet.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#21262d]" role="list">
                      {bugs.map((b) => (
                        <li key={b.id} className="py-4 first:pt-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#8b949e]">
                            <span className="font-mono text-[#c9d1d9]">
                              #{b.id}
                            </span>
                            <span
                              className={
                                b.status === "Closed"
                                  ? "text-[#a371f7]"
                                  : "text-[#3fb950]"
                              }
                            >
                              {b.status}
                            </span>
                            {b.severity ? (
                              <span className="text-[#484f58]">·</span>
                            ) : null}
                            {b.severity ? (
                              <span>{b.severity}</span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-[#c9d1d9]">
                            {(b.issue_description || "").slice(0, 200)}
                            {(b.issue_description || "").length > 200
                              ? "…"
                              : ""}
                          </p>
                          <p className="mt-1 text-xs text-[#6e7681]">
                            {b.date_reported} · {formatReporterLabel(b.reported_by)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === "activity" && (
                <div>
                  {!activityReady ? (
                    <div className="py-12 text-center text-sm text-[#8b949e]">
                      Loading…
                    </div>
                  ) : mergedTimeline.length === 0 ? (
                    <p className="py-12 text-center text-sm text-[#8b949e]">
                      No timeline entries yet.
                    </p>
                  ) : (
                    <ul className="relative space-y-0 pl-3 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-[#30363d]">
                      {mergedTimeline.map((item, i) => (
                        <li
                          key={
                            item.kind === "activity"
                              ? `a-${item.payload.id}`
                              : `c-${item.payload.id}-${i}`
                          }
                          className="relative pb-8 pl-5 last:pb-0"
                        >
                          <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-[#30363d] ring-4 ring-[#0d1117]" />
                          <p className="text-[11px] text-[#6e7681]">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                          {item.kind === "activity" ? (
                            <>
                              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#c9d1d9]">
                                <ProfileAvatar
                                  storedPreset={undefined}
                                  seed={
                                    item.payload.user_id ||
                                    String(item.payload.id)
                                  }
                                  label={displayNameOrTeamMember(
                                    item.payload.user_display_name
                                  )}
                                  size={22}
                                />
                                <span className="font-semibold text-[#58a6ff]">
                                  {displayNameOrTeamMember(
                                    item.payload.user_display_name
                                  )}
                                </span>{" "}
                                <span className="text-[#8b949e]">
                                  {item.payload.action_type.replace(/_/g, " ")}
                                </span>
                              </p>
                              <p className="mt-0.5 text-xs text-[#8b949e]">
                                {item.payload.details}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#c9d1d9]">
                                <ProfileAvatar
                                  storedPreset={item.payload.author_avatar_preset}
                                  seed={item.payload.user_id}
                                  label={displayNameOrTeamMember(
                                    item.payload.display_name
                                  )}
                                  size={22}
                                />
                                <span className="font-semibold text-[#58a6ff]">
                                  {displayNameOrTeamMember(
                                    item.payload.display_name
                                  )}
                                </span>{" "}
                                <span className="text-[#8b949e]">
                                  posted a note
                                </span>
                              </p>
                              <div
                                className="prose prose-invert prose-sm mt-1 max-w-none line-clamp-3 text-[#8b949e]"
                                dangerouslySetInnerHTML={{
                                  __html: item.payload.content,
                                }}
                              />
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {activeTab === "notes" && !selectedThread ? (
              <div className="shrink-0 border-t border-[#30363d] bg-[#0d1117] px-5 py-4 sm:px-6">
                <div className="flex gap-3 items-end">
                  <div className="min-w-0 flex-1">
                    <TiptapEditor
                      ref={mainEditorRef}
                      content={newComment}
                      onChange={setNewComment}
                      onSubmit={handleSubmitComment}
                      placeholder="Add a staff note…"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSubmitComment()}
                    className="mb-1 shrink-0 rounded-md p-2.5 text-[#58a6ff] transition-colors hover:bg-[#21262d]"
                    aria-label="Send"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m5 12 7-7 7 7" />
                      <path d="M12 19V5" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-[#6e7681]">
                  Enter to send · Shift+Enter newline
                </p>
              </div>
            ) : null}
          </div>

          <aside className="hidden w-[260px] shrink-0 overflow-y-auto border-l border-[#30363d] bg-[#010409] px-5 py-6 lg:block">
            <h3 className="mb-4 text-xs font-semibold text-[#8b949e]">
              Details
            </h3>
            <div className="space-y-4">
              <MetaRow label="Load order" value={mod.load_order} />
              <MetaRow label="Status" value={mod.status} />
              <MetaRow label="Category" value={mod.category || "—"} />
              <MetaRow label="Author" value={mod.author || "—"} />
              <MetaRow label="Version" value={mod.version || "—"} />
              <MetaRow
                label="Nexus"
                value={
                  mod.nexus_url ? (
                    <a
                      href={mod.nexus_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#58a6ff] hover:underline"
                    >
                      Open
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          </aside>
        </div>

        {selectedThread ? (
          <div className="absolute inset-0 z-[60] flex flex-col bg-[#0d1117] animate-in slide-in-from-right duration-200">
            <div className="flex shrink-0 items-center justify-between border-b border-[#30363d] px-5 py-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedThread(null)}
                  className="rounded-md p-2 text-[#8b949e] hover:bg-[#21262d] hover:text-[#f0f6fc]"
                  aria-label="Back"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <span className="text-xs font-medium text-[#8b949e]">
                  Thread
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedThread(null)}
                className="text-xs text-[#58a6ff] hover:underline"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
              <div className="mb-8 border-b border-[#21262d] pb-8">
                <div className="mb-2 flex items-center gap-2 text-xs text-[#8b949e]">
                  <ProfileAvatar
                    storedPreset={selectedThread.author_avatar_preset}
                    seed={selectedThread.user_id}
                    label={displayNameOrTeamMember(selectedThread.display_name)}
                    size={22}
                  />
                  <span className="font-semibold text-[#c9d1d9]">
                    {displayNameOrTeamMember(selectedThread.display_name)}
                  </span>
                  <span className="text-[#484f58]">·</span>
                  <span>
                    {new Date(selectedThread.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="prose prose-invert max-w-none text-[#e6edf3]">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: selectedThread.content,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="text-xs font-medium text-[#6e7681]">
                  Replies
                </h4>
                {threadReplies.length === 0 ? (
                  <p className="text-sm text-[#8b949e]">No replies yet.</p>
                ) : (
                  threadReplies.map((reply) => (
                    <div key={reply.id} className="group border-b border-[#21262d] pb-5 last:border-0">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                          <ProfileAvatar
                            storedPreset={reply.author_avatar_preset}
                            seed={reply.user_id}
                            label={displayNameOrTeamMember(reply.display_name)}
                            size={20}
                          />
                          <span className="font-semibold text-[#c9d1d9]">
                            {displayNameOrTeamMember(reply.display_name)}
                          </span>
                          <span className="text-[#484f58]"> · </span>
                          <span>
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteComment(reply.id)}
                          className="opacity-0 transition-opacity group-hover:opacity-100 text-[#8b949e] hover:text-[#f85149]"
                          aria-label="Delete reply"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none text-[#c9d1d9]">
                        <div
                          dangerouslySetInnerHTML={{ __html: reply.content }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-[#30363d] px-5 py-4">
              <div className="flex gap-3 items-end">
                <div className="min-w-0 flex-1">
                  <TiptapEditor
                    ref={threadEditorRef}
                    content={threadReply}
                    onChange={setThreadReply}
                    onSubmit={handleSubmitComment}
                    placeholder="Reply…"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleSubmitComment()}
                  className="mb-1 shrink-0 rounded-md p-2.5 text-[#58a6ff] hover:bg-[#21262d]"
                  aria-label="Send reply"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m5 12 7-7 7 7" />
                    <path d="M12 19V5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
