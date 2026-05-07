"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TiptapEditor, {
  isTiptapEmptyHtml,
  type TiptapEditorHandle,
} from "@/src/components/TiptapEditor";
import ColorWheelPicker from "@/src/components/ColorWheelPicker";
import {
  createProjectCategory,
  createProjectTask,
  createProjectTaskComment,
  deleteProjectTask,
  listProjectTaskComments,
  updateProjectCategory,
  updateProjectTask,
  type StaffProjectCategory,
  type StaffProjectTask,
} from "./actions";

const COLUMNS = [
  { key: "Backlog", color: "#8b949e" },
  { key: "Planned", color: "#55aaff" },
  { key: "In Progress", color: "#ffaa00" },
  { key: "Testing", color: "#55ff99" },
  { key: "Completed", color: "#44dd44" },
  { key: "Blocked", color: "#ff5555" },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];

const COLUMN_COLOR_BY_KEY: Record<ColumnKey, string> = {
  Backlog: "#8b949e",
  Planned: "#55aaff",
  "In Progress": "#ffaa00",
  Testing: "#55ff99",
  Completed: "#44dd44",
  Blocked: "#ff5555",
};

function clampProgress(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeDateInput(d: string) {
  const trimmed = d.trim();
  if (!trimmed) return null;
  // accept YYYY-MM-DD only (native date input format)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function plainTextToHtml(text: string) {
  const t = text.trim();
  if (!t) return "";
  const lines = t.split(/\r?\n/).map((l) => l.trim());
  const body = lines.map((l) => escapeHtml(l)).join("<br/>");
  return `<p>${body}</p>`;
}

function chipColorClass(priority: string) {
  switch (priority) {
    case "Low":
      return "bg-emerald-500/15 text-emerald-200 border-emerald-500/25";
    case "Medium":
      return "bg-sky-500/15 text-sky-200 border-sky-500/25";
    case "High":
      return "bg-amber-500/20 text-amber-100 border-amber-500/25";
    case "Critical":
      return "bg-rose-500/20 text-rose-100 border-rose-500/25";
    default:
      return "bg-white/5 text-[#c9d1d9] border-white/10";
  }
}

function statusLeftBorderColor(status: string) {
  return (COLUMN_COLOR_BY_KEY as any)[status] ?? "#30363d";
}

function columnDropId(status: ColumnKey) {
  return `column:${status}`;
}

function computeBetweenOrder(before?: number, after?: number) {
  if (typeof before !== "number" && typeof after !== "number") return Date.now();
  if (typeof before !== "number") return after! - 1024;
  if (typeof after !== "number") return before + 1024;
  if (before === after) return before + 1;
  return (before + after) / 2;
}

function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SortableTaskCard({
  task,
  onOpen,
}: {
  task: StaffProjectTask;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id as UniqueIdentifier });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-60" : "opacity-100"}>
      <div
        className={[
          "group relative w-full text-left",
          "rounded-2xl border border-white/10 bg-white/[0.02]",
          "px-3 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
          "hover:-translate-y-[1px] hover:bg-white/[0.05] hover:border-white/15 transition-all",
        ].join(" ")}
        style={{ borderLeft: `3px solid ${statusLeftBorderColor(task.status)}` }}
      >
        <button
          type="button"
          onClick={onOpen}
          className="block w-full text-left"
        >
          {task.thumbnail_url ? (
            <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <img
                src={task.thumbnail_url}
                alt=""
                className="h-28 w-full object-cover opacity-90"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : null}

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#f0f6fc]">
                {task.title}
              </p>
              <p className="mt-1 text-[11px] text-[#8b949e]">
                Updated {new Date(task.updated_at).toLocaleString()}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={[
                  "rounded-full border px-2 py-1 text-[10px] font-semibold",
                  chipColorClass(task.priority),
                ].join(" ")}
              >
                {task.priority}
              </span>
              <span
                className="inline-flex w-9 justify-center cursor-grab select-none rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-[10px] text-[#c9d1d9] hover:bg-white/[0.05] active:cursor-grabbing"
                {...attributes}
                {...listeners}
                // dnd-kit injects an aria-describedby with non-deterministic ids during SSR,
                // which triggers Next hydration mismatch warnings. Override to keep markup stable.
                aria-describedby={undefined}
                suppressHydrationWarning
                aria-label="Drag handle"
                title="Drag"
              >
                ⋮⋮
              </span>
            </div>
          </div>

          {task.external_url ? (
            <p className="mt-2 line-clamp-1 text-[11px] text-[#6e7681]">
              {task.external_url}
            </p>
          ) : null}

          {task.progress > 0 ? (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold text-[#8b949e]">
                  Percentage Complete
                </span>
                <span className="text-[10px] text-[#6e7681]">
                  Phase: {task.status}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-[width] duration-300 ease-in-out"
                  style={{ width: `${clampProgress(task.progress)}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-[#6e7681]">
                <span>{clampProgress(task.progress)}%</span>
                <span className="font-mono tabular-nums">{clampProgress(task.progress)} / 100</span>
              </div>
            </div>
          ) : null}

          {task.due_date ? (
            <p className="mt-2 text-[11px] text-[#c9d1d9]">
              Due <span className="font-mono">{task.due_date}</span>
            </p>
          ) : null}

          {task.description_html ? (
            <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-[#8b949e]">
              {task.description_html.replace(/<[^>]*>/g, "").trim()}
            </p>
          ) : null}
        </button>
      </div>
    </div>
  );
}

function Column({
  title,
  color,
  tasks,
  onCreate,
  onOpenTask,
}: {
  title: ColumnKey;
  color: string;
  tasks: StaffProjectTask[];
  onCreate: (status: ColumnKey) => void;
  onOpenTask: (taskId: string) => void;
}) {
  const dropId = columnDropId(title);
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <h2 className="min-w-0 truncate text-sm font-semibold text-[#f0f6fc]">
            {title}
          </h2>
          <span className="shrink-0 text-xs font-mono text-[#6e7681]">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onCreate(title)}
          className="shrink-0 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-[11px] text-[#c9d1d9] hover:bg-white/[0.05] transition-colors"
        >
          + Add
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "flex-1 rounded-2xl border bg-white/[0.02] p-3 transition-colors",
          isOver ? "border-[#58a6ff]/40" : "border-white/10",
        ].join(" ")}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-3 py-8 text-center text-xs text-[#6e7681]">
                Drop tasks here
              </div>
            ) : null}
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onOpen={() => onOpenTask(task.id)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
  widthClassName,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  widthClassName?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <GlassCard
        className={[
          "relative w-full max-h-[85vh] overflow-auto",
          widthClassName ?? "max-w-2xl",
        ].join(" ")}
      >
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0d1117]/70 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-[#f0f6fc]">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-[#c9d1d9] hover:bg-white/[0.05] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
        <div className="px-5 py-5">{children}</div>
      </GlassCard>
    </div>
  );
}

export default function ProjectsClient({
  initialCategories,
  initialTasks,
}: {
  initialCategories: StaffProjectCategory[];
  initialTasks: StaffProjectTask[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [, startTransition] = useTransition();

  // Prevent the `?task=` auto-open effect from immediately reopening a task
  // while we are in the middle of closing / clearing the URL.
  const suppressUrlTaskAutopenRef = useRef(false);

  const [categories, setCategories] = useState<StaffProjectCategory[]>(initialCategories);
  const [tasks, setTasks] = useState<StaffProjectTask[]>(initialTasks);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    initialCategories[0]?.id ?? ""
  );
  const [search, setSearch] = useState("");
  const [mobileStatus, setMobileStatus] = useState<ColumnKey>("Backlog");

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [createTaskStatus, setCreateTaskStatus] = useState<ColumnKey>("Backlog");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskExternalUrl, setNewTaskExternalUrl] = useState("");
  const [newTaskThumbnailUrl, setNewTaskThumbnailUrl] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [createTaskError, setCreateTaskError] = useState<string | null>(null);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskComments, setTaskComments] = useState<any[] | null>(null);
  const [commentHtml, setCommentHtml] = useState("");
  const commentEditorRef = useRef<TiptapEditorHandle | null>(null);
  const [activeTaskDescriptionDraft, setActiveTaskDescriptionDraft] = useState("");
  const descriptionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? null,
    [categories, activeCategoryId]
  );

  const createTaskValidation = useMemo(() => {
    const externalUrl = newTaskExternalUrl.trim();
    const thumbUrl = newTaskThumbnailUrl.trim();
    const descLen = newTaskDescription.trim().length;
    const valid =
      externalUrl.includes("nexusmods.com") &&
      /^https?:\/\//i.test(thumbUrl) &&
      descLen >= 10;
    return { valid, descLen };
  }, [newTaskExternalUrl, newTaskThumbnailUrl, newTaskDescription]);

  const visibleTasks = useMemo(() => {
    const s = search.trim().toLowerCase();
    return tasks
      .filter((t) => t.category_id === activeCategoryId)
      .filter((t) => {
        if (!s) return true;
        return (
          t.title.toLowerCase().includes(s) ||
          (t.description_html ?? "").toLowerCase().includes(s) ||
          (t.status ?? "").toLowerCase().includes(s) ||
          (t.priority ?? "").toLowerCase().includes(s)
        );
      });
  }, [tasks, activeCategoryId, search]);

  const tasksByStatus = useMemo(() => {
    const map = new Map<string, StaffProjectTask[]>();
    for (const col of COLUMNS) map.set(col.key, []);
    for (const t of visibleTasks) {
      const key = map.has(t.status) ? t.status : "Backlog";
      map.get(key)!.push(t);
    }
    for (const [k, list] of map) {
      list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      map.set(k, list);
    }
    return map;
  }, [visibleTasks]);

  const activeTask = useMemo(
    () => (activeTaskId ? tasks.find((t) => t.id === activeTaskId) ?? null : null),
    [tasks, activeTaskId]
  );

  useEffect(() => {
    const taskId = searchParams.get("task");
    if (!taskId) {
      suppressUrlTaskAutopenRef.current = false;
      return;
    }
    if (suppressUrlTaskAutopenRef.current) return;
    if (!tasks.some((t) => t.id === taskId)) return;
    if (activeTaskId === taskId) return;
    void openTaskAndSyncUrl(taskId);
  }, [searchParams, tasks, activeTaskId]);

  useEffect(() => {
    // Reset local draft when switching tasks.
    setActiveTaskDescriptionDraft(activeTask?.description_html ?? "");
  }, [activeTask?.id]);

  useEffect(() => {
    return () => {
      if (descriptionDebounceRef.current) clearTimeout(descriptionDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const onCategoryChange = (payload: any) => {
      setCategories((prev) => {
        const next = [...prev];
        const id = payload?.new?.id ?? payload?.old?.id;
        if (!id) return prev;
        if (payload.eventType === "DELETE") {
          return next.filter((c) => c.id !== id);
        }
        const row = payload.new as any;
        const idx = next.findIndex((c) => c.id === id);
        if (idx >= 0) next[idx] = row;
        else next.push(row);
        next.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        return next.filter((c) => !c.archived);
      });
    };

    const onTaskChange = (payload: any) => {
      const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as any;
      const id = row?.id;
      if (!id) return;

      // Keep tasks in memory scoped to the active category only.
      const rowCategoryId = String(row?.category_id ?? "");
      if (!rowCategoryId || rowCategoryId !== activeCategoryId) {
        // If a task moved away from the active category, remove it locally.
        if (payload.eventType !== "INSERT") {
          setTasks((prev) => prev.filter((t) => t.id !== id));
        }
        return;
      }

      setTasks((prev) => {
        const next = [...prev];
        if (payload.eventType === "DELETE") {
          return next.filter((t) => t.id !== id);
        }
        const idx = next.findIndex((t) => t.id === id);
        if (idx >= 0) next[idx] = payload.new as any;
        else next.push(payload.new as any);
        return next;
      });
    };

    function subscribe() {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

      channel = supabase
        .channel("staff-projects")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "staff_project_categories" },
          onCategoryChange,
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "staff_project_categories" },
          onCategoryChange,
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "staff_project_categories" },
          onCategoryChange,
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "staff_project_tasks",
            filter: `category_id=eq.${activeCategoryId}`,
          },
          onTaskChange,
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "staff_project_tasks",
            filter: `category_id=eq.${activeCategoryId}`,
          },
          onTaskChange,
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "staff_project_tasks",
            filter: `category_id=eq.${activeCategoryId}`,
          },
          onTaskChange,
        )
        .subscribe();
    }

    function unsubscribe() {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    }

    const onVisibility = () => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") subscribe();
      else unsubscribe();
    };

    subscribe();
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      cancelled = true;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
      unsubscribe();
    };
  }, [supabase, activeCategoryId]);

  useEffect(() => {
    if (!activeCategoryId && categories[0]?.id) setActiveCategoryId(categories[0].id);
  }, [activeCategoryId, categories]);

  async function openTask(taskId: string) {
    setActiveTaskId(taskId);
    setTaskComments(null);
    try {
      const comments = await listProjectTaskComments({ taskId });
      setTaskComments(comments);
    } catch {
      setTaskComments([]);
    }
  }

  async function openTaskAndSyncUrl(taskId: string) {
    router.replace(`/staff/projects?task=${taskId}`);
    await openTask(taskId);
  }

  async function onCreateCategory() {
    setCategoryError(null);
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const created = await createProjectCategory({ name, color: newCategoryColor });
      setNewCategoryName("");
      setCategoryModalOpen(false);
      setActiveCategoryId(created.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create category.";
      setCategoryError(msg);
    }
  }

  async function onCreateTask() {
    setCreateTaskError(null);
    if (!activeCategoryId) return;
    const title = newTaskTitle.trim();
    if (!title) return;
    const descriptionText = newTaskDescription.trim();
    const externalUrl = newTaskExternalUrl.trim();
    const thumbnailUrl = newTaskThumbnailUrl.trim();
    const valid =
      externalUrl.includes("nexusmods.com") &&
      /^https?:\/\//i.test(thumbnailUrl) &&
      descriptionText.length >= 10;
    if (!valid) return;
    try {
      const created = await createProjectTask({
        categoryId: activeCategoryId,
        title,
        status: createTaskStatus,
        priority: newTaskPriority,
        descriptionHtml: plainTextToHtml(descriptionText),
        externalUrl: externalUrl || null,
        thumbnailUrl: thumbnailUrl || null,
      });
      setNewTaskTitle("");
      setNewTaskExternalUrl("");
      setNewTaskThumbnailUrl("");
      setNewTaskDescription("");
      setCreateTaskOpen(false);
      setActiveTaskId(created.id);
      setTaskComments([]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create task.";
      setCreateTaskError(msg);
    }
  }

  function onDragStart(event: DragStartEvent) {
    const id = event.active.id;
    setDraggingTaskId(typeof id === "string" ? id : String(id));
  }

  async function onDragEnd(event: DragEndEvent) {
    setDraggingTaskId(null);
    if (!activeCategoryId) return;

    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    // Determine destination column by probing current lists.
    const sourceTask = tasks.find((t) => t.id === activeId);
    if (!sourceTask) return;

    const overTask = tasks.find((t) => t.id === overId) ?? null;
    const destinationStatus: ColumnKey = overId.startsWith("column:")
      ? (overId.slice("column:".length) as ColumnKey)
      : ((overTask?.status as ColumnKey) ||
          (sourceTask.status as ColumnKey) ||
          "Backlog");

    // Build destination list (sorted) excluding active task.
    const destinationList = (tasksByStatus.get(destinationStatus) ?? [])
      .filter((t) => t.id !== activeId)
      .slice();

    const overIndex = destinationList.findIndex((t) => t.id === overId);
    const insertIndex =
      overId.startsWith("column:") || overIndex < 0 ? destinationList.length : overIndex;
    const before = destinationList[insertIndex - 1]?.sort_order;
    const after = destinationList[insertIndex]?.sort_order;
    const nextOrder = computeBetweenOrder(before, after);

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? {
              ...t,
              status: destinationStatus,
              sort_order: nextOrder,
              category_id: activeCategoryId,
            }
          : t
      )
    );

    try {
      await updateProjectTask({
        id: activeId,
        status: destinationStatus,
        categoryId: activeCategoryId,
        sortOrder: nextOrder,
      });
    } catch {
      // best-effort; realtime will reconcile
    }
  }

  async function saveActiveTaskPatch(
    patch: Partial<StaffProjectTask>,
    options?: { optimistic?: boolean }
  ) {
    if (!activeTask) return;
    const optimistic = options?.optimistic ?? true;
    if (optimistic) {
      startTransition(() => {
        setTasks((prev) =>
          prev.map((t) => (t.id === activeTask.id ? { ...t, ...patch } : t))
        );
      });
    }
    try {
      await updateProjectTask({
        id: activeTask.id,
        title: patch.title,
        descriptionHtml: patch.description_html,
        priority: patch.priority,
        status: patch.status,
        dueDate: (patch as any).due_date,
        progress: patch.progress,
        categoryId: (patch as any).category_id,
        externalUrl: (patch as any).external_url,
        thumbnailUrl: (patch as any).thumbnail_url,
      });
    } catch {
      // ignore; realtime will reconcile
    }
  }

  async function onDeleteActiveTask() {
    if (!activeTask) return;
    const id = activeTask.id;
    setActiveTaskId(null);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteProjectTask({ id });
    } catch {
      // ignore
    }
  }

  async function onSubmitComment() {
    if (!activeTask) return;
    const html = commentEditorRef.current?.getHTML() ?? commentHtml;
    if (!html || isTiptapEmptyHtml(html)) return;
    setCommentHtml("");
    commentEditorRef.current?.clear();
    try {
      const created = await createProjectTaskComment({
        taskId: activeTask.id,
        bodyHtml: html,
      });
      setTaskComments((prev) => (prev ? [...prev, created] : [created]));
    } catch {
      // ignore
    }
  }

  const draggingTask = draggingTaskId
    ? tasks.find((t) => t.id === draggingTaskId) ?? null
    : null;

  return (
    <div className="pb-12">
      <GlassCard className="mb-5">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#6e7681]">Category</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-[#f0f6fc]">
              {activeCategory ? activeCategory.name : "—"}
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:max-w-md">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects, tasks, categories, or tags..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[#f0f6fc] placeholder:text-[#6e7681] outline-none focus:border-[#58a6ff]/60 focus:ring-2 focus:ring-[#58a6ff]/10 transition"
              />
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#6e7681]">
                ⌘K
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreateTaskStatus("Backlog");
                  setCreateTaskOpen(true);
                }}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-[#f0f6fc] hover:bg-white/[0.06] transition-colors"
              >
                + New Task
              </button>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[#c9d1d9] hover:bg-white/[0.05] transition-colors"
              >
                + New Category
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const active = cat.id === activeCategoryId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                className={[
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-white/15 bg-white/[0.06] text-[#f0f6fc]"
                    : "border-white/10 bg-white/[0.02] text-[#c9d1d9] hover:bg-white/[0.05]",
                ].join(" ")}
              >
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                  style={{ backgroundColor: cat.color }}
                  aria-hidden
                />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {/* Mobile: stacked list with status filter */}
        <div className="sm:hidden">
          <GlassCard className="mb-4 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#8b949e]">Status</p>
                <select
                  value={mobileStatus}
                  onChange={(e) => setMobileStatus(e.target.value as ColumnKey)}
                  className="mt-1 w-48 rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
                >
                  {COLUMNS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.key}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreateTaskStatus(mobileStatus);
                  setCreateTaskOpen(true);
                }}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-[#f0f6fc] hover:bg-white/[0.06] transition-colors"
              >
                + Add
              </button>
            </div>
          </GlassCard>

          <Column
            title={mobileStatus}
            color={COLUMN_COLOR_BY_KEY[mobileStatus]}
            tasks={(tasksByStatus.get(mobileStatus) ?? []) as StaffProjectTask[]}
            onCreate={(status) => {
              setCreateTaskStatus(status);
              setCreateTaskOpen(true);
            }}
            onOpenTask={(taskId) => openTaskAndSyncUrl(taskId)}
          />
        </div>

        {/* Desktop: responsive grid (no horizontal scroll) */}
        <div className="hidden sm:block">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 pb-4">
            {/* Primary columns always visible */}
            {COLUMNS.slice(0, 4).map((col) => (
              <Column
                key={col.key}
                title={col.key}
                color={col.color}
                tasks={(tasksByStatus.get(col.key) ?? []) as StaffProjectTask[]}
                onCreate={(status) => {
                  setCreateTaskStatus(status);
                  setCreateTaskOpen(true);
                }}
                onOpenTask={(taskId) => openTaskAndSyncUrl(taskId)}
              />
            ))}
          </div>

          {/* Tablet: lower-priority columns in accordions; Desktop+: show them in grid */}
          <div className="md:hidden space-y-3">
            {COLUMNS.slice(4).map((col) => (
              <details
                key={col.key}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-3"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: col.color }}
                        aria-hidden
                      />
                      <span className="text-sm font-semibold text-[#f0f6fc]">
                        {col.key}
                      </span>
                      <span className="text-xs font-mono text-[#6e7681]">
                        {(tasksByStatus.get(col.key) ?? []).length}
                      </span>
                    </div>
                    <span className="text-xs text-[#6e7681]">Expand</span>
                  </div>
                </summary>
                <div className="mt-3">
                  <Column
                    title={col.key}
                    color={col.color}
                    tasks={(tasksByStatus.get(col.key) ?? []) as StaffProjectTask[]}
                    onCreate={(status) => {
                      setCreateTaskStatus(status);
                      setCreateTaskOpen(true);
                    }}
                    onOpenTask={(taskId) => openTaskAndSyncUrl(taskId)}
                  />
                </div>
              </details>
            ))}
          </div>

          <div className="hidden md:block">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 pb-4">
              {COLUMNS.slice(4).map((col) => (
                <Column
                  key={col.key}
                  title={col.key}
                  color={col.color}
                  tasks={(tasksByStatus.get(col.key) ?? []) as StaffProjectTask[]}
                  onCreate={(status) => {
                    setCreateTaskStatus(status);
                    setCreateTaskOpen(true);
                  }}
                  onOpenTask={(taskId) => openTaskAndSyncUrl(taskId)}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {draggingTask ? (
            <div className="w-[320px]">
              <div className="rounded-xl border border-white/15 bg-[#0d1117]/90 px-3 py-3 shadow-2xl backdrop-blur">
                <p className="text-sm font-semibold text-[#f0f6fc]">
                  {draggingTask.title}
                </p>
                <p className="mt-1 text-[11px] text-[#8b949e]">
                  {draggingTask.status}
                </p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Modal
        open={categoryModalOpen}
        title="Create category"
        onClose={() => {
          setCategoryError(null);
          setCategoryModalOpen(false);
        }}
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-[#8b949e]">Name</span>
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
              placeholder="Weapons"
            />
          </label>

          <ColorWheelPicker value={newCategoryColor} onChange={setNewCategoryColor} />
          {categoryError ? (
            <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
              {categoryError}
            </div>
          ) : null}
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setCategoryModalOpen(false)}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[#c9d1d9] hover:bg-white/[0.05]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCreateCategory}
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15"
          >
            Create
          </button>
        </div>
      </Modal>

      <Modal
        open={createTaskOpen}
        title="Create task"
        onClose={() => {
          setCreateTaskError(null);
          setCreateTaskOpen(false);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-[#8b949e]">Title</span>
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
              placeholder="Implement weapon recoil tuning pass"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#8b949e]">Status</span>
            <select
              value={createTaskStatus}
              onChange={(e) => setCreateTaskStatus(e.target.value as ColumnKey)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
            >
              {COLUMNS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.key}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#8b949e]">Priority</span>
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
            >
              {["Low", "Medium", "High", "Critical"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-[#8b949e]">NexusMods URL</span>
            <input
              value={newTaskExternalUrl}
              onChange={(e) => setNewTaskExternalUrl(e.target.value)}
              placeholder="https://www.nexusmods.com/..."
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-[#8b949e]">Thumbnail URL</span>
            <input
              value={newTaskThumbnailUrl}
              onChange={(e) => setNewTaskThumbnailUrl(e.target.value)}
              placeholder="Paste image URL (Copy Image Address)"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
            />
            <p className="mt-1 text-[11px] text-[#6e7681]">
              Tip: right-click the mod image on NexusMods → “Copy image address”.
            </p>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-[#8b949e]">Description</span>
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="At least 10 characters…"
              rows={4}
              className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
            />
            <p className="mt-1 text-[11px] text-[#6e7681]">
              {createTaskValidation.descLen}/10 characters
            </p>
          </label>
          {createTaskError ? (
            <div className="sm:col-span-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
              {createTaskError}
            </div>
          ) : null}
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setCreateTaskOpen(false)}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[#c9d1d9] hover:bg-white/[0.05]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCreateTask}
            disabled={!createTaskValidation.valid}
            className={[
              "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
              createTaskValidation.valid
                ? "border-[#58a6ff]/20 bg-[#58a6ff]/10 text-[#c9e6ff] hover:bg-[#58a6ff]/15"
                : "border-white/10 bg-white/[0.02] text-[#6e7681] opacity-50 cursor-not-allowed",
            ].join(" ")}
          >
            Create
          </button>
        </div>
      </Modal>

      <Modal
        open={!!activeTask}
        title={activeTask ? activeTask.title : "Task"}
        onClose={() => {
          suppressUrlTaskAutopenRef.current = true;
          setActiveTaskId(null);
          router.replace("/staff/projects");
        }}
        widthClassName="w-[90vw] max-w-7xl"
      >
        {activeTask ? (
          <div className="grid max-h-[85vh] overflow-hidden lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-8 lg:overflow-y-auto lg:border-r lg:border-white/10">
              <div className="p-6">
              <label className="block">
                <span className="text-xs font-semibold text-[#8b949e]">Title</span>
                <input
                  value={activeTask.title}
                  onChange={(e) => saveActiveTaskPatch({ title: e.target.value } as any)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
                />
              </label>

              <div className="mt-4">
                <p className="text-xs font-semibold text-[#8b949e]">Description</p>
                <div className="mt-2">
                  <TiptapEditor
                    content={activeTaskDescriptionDraft}
                    onChange={(html) => {
                      setActiveTaskDescriptionDraft(html);
                      if (descriptionDebounceRef.current) {
                        clearTimeout(descriptionDebounceRef.current);
                      }
                      descriptionDebounceRef.current = setTimeout(() => {
                        descriptionDebounceRef.current = null;
                        saveActiveTaskPatch(
                          { description_html: html } as any,
                          { optimistic: true }
                        );
                      }, 350);
                    }}
                    placeholder="Write details, acceptance criteria, links..."
                    mentionEndpoint="/api/staff/list"
                  />
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold text-[#8b949e]">Comments</p>
                <div className="mt-3 space-y-3">
                  {taskComments === null ? (
                    <div className="text-xs text-[#6e7681]">Loading…</div>
                  ) : taskComments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-[#6e7681]">
                      No comments yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {taskComments.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] text-[#8b949e]">
                              {c.author_name ?? c.created_by ?? "Team member"} ·{" "}
                              {new Date(c.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div
                            className="prose prose-sm prose-invert mt-2 max-w-none text-sm"
                            dangerouslySetInnerHTML={{ __html: c.body_html }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                    <TiptapEditor
                      ref={commentEditorRef as any}
                      content={commentHtml}
                      onChange={setCommentHtml}
                      placeholder="Add a comment…"
                      onSubmit={onSubmitComment}
                      mentionEndpoint="/api/staff/list"
                    />
                    <div className="mt-3 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={onSubmitComment}
                        className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>

            <div className="lg:col-span-4 lg:overflow-y-auto">
              <div className="p-6 space-y-4 bg-white/[0.02]">
              <GlassCard className="p-4">
                <p className="text-xs font-semibold text-[#8b949e]">Category</p>
                <select
                  value={activeTask.category_id}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    startTransition(() => setActiveCategoryId(nextId));
                    void saveActiveTaskPatch({ category_id: nextId } as any);
                  }}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <p className="text-xs font-semibold text-[#8b949e]">Status</p>
                <select
                  value={activeTask.status}
                  onChange={(e) =>
                    saveActiveTaskPatch({ status: e.target.value } as any)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
                >
                  {COLUMNS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.key}
                    </option>
                  ))}
                </select>

                <p className="mt-4 text-xs font-semibold text-[#8b949e]">Priority</p>
                <select
                  value={activeTask.priority}
                  onChange={(e) =>
                    saveActiveTaskPatch({ priority: e.target.value } as any)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
                >
                  {["Low", "Medium", "High", "Critical"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <p className="mt-4 text-xs font-semibold text-[#8b949e]">Due date</p>
                <input
                  type="date"
                  value={activeTask.due_date ?? ""}
                  onChange={(e) =>
                    saveActiveTaskPatch({ due_date: normalizeDateInput(e.target.value) } as any)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
                />

                <p className="mt-4 text-xs font-semibold text-[#8b949e]">Progress</p>
                <div className="mt-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold text-[#8b949e]">
                      Percentage Complete
                    </span>
                    <span className="text-[11px] text-[#6e7681]">
                      Phase: {String(activeTask.status)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-[width] duration-300 ease-in-out"
                      style={{ width: `${clampProgress(activeTask.progress ?? 0)}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      value={clampProgress(activeTask.progress ?? 0)}
                      onChange={(e) =>
                        saveActiveTaskPatch({ progress: clampProgress(Number(e.target.value)) } as any)
                      }
                      className="w-24 rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm font-mono text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
                    />
                    <span className="text-xs text-[#6e7681]">%</span>
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={() =>
                        saveActiveTaskPatch({ progress: clampProgress((activeTask.progress ?? 0) - 5) } as any)
                      }
                      className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-[#c9d1d9] hover:bg-white/[0.05]"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        saveActiveTaskPatch({ progress: clampProgress((activeTask.progress ?? 0) + 5) } as any)
                      }
                      className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-[#c9d1d9] hover:bg-white/[0.05]"
                    >
                      +5
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onDeleteActiveTask}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/15"
                  >
                    Delete task
                  </button>
                </div>
              </GlassCard>

              <div className="text-xs text-[#6e7681]">
                <p>
                  Created {new Date(activeTask.created_at).toLocaleString()}
                </p>
                <p>
                  Updated {new Date(activeTask.updated_at).toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs font-semibold text-[#8b949e]">External media</p>
                <label className="mt-3 block">
                  <span className="text-[11px] font-semibold text-[#8b949e]">NexusMods URL</span>
                  <input
                    value={(activeTask as any).external_url ?? ""}
                    onChange={(e) =>
                      saveActiveTaskPatch({ external_url: e.target.value } as any)
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
                    placeholder="https://www.nexusmods.com/..."
                  />
                </label>
                <label className="mt-3 block">
                  <span className="text-[11px] font-semibold text-[#8b949e]">Thumbnail URL</span>
                  <input
                    value={(activeTask as any).thumbnail_url ?? ""}
                    onChange={(e) =>
                      saveActiveTaskPatch({ thumbnail_url: e.target.value } as any)
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
                    placeholder="Paste image URL (Copy Image Address)"
                  />
                </label>
                {(activeTask as any).external_url ? (
                  <a
                    href={(activeTask as any).external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#da5921]/30 bg-[#da5921]/10 px-3 py-2 text-xs font-semibold text-[#da5921] hover:bg-[#da5921]/15"
                  >
                    Open on NexusMods →
                  </a>
                ) : null}
              </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

