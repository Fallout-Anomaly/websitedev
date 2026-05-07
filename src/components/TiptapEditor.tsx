"use client";

import {
  useEditor,
  EditorContent,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import { Markdown } from "tiptap-markdown";
import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";

type MentionItem = { id: string; label: string };

// Shared cache across all editors on the page.
// This avoids the "first @ press" latency when multiple editors mount (task description + comment, etc.).
const mentionItemsByEndpoint = new Map<string, MentionItem[]>();
const mentionFetchByEndpoint = new Map<string, Promise<MentionItem[]>>();

async function fetchMentionItems(endpoint: string): Promise<MentionItem[]> {
  const cached = mentionItemsByEndpoint.get(endpoint);
  if (cached) return cached;

  const inFlight = mentionFetchByEndpoint.get(endpoint);
  if (inFlight) return inFlight;

  const p = fetch(endpoint, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : []))
    .then((rows: any[]) => {
      const items: MentionItem[] = Array.isArray(rows)
        ? rows
            .map((x) => ({
              id: typeof x?.id === "string" ? x.id : "",
              label: typeof x?.label === "string" ? x.label : "",
            }))
            .filter((x) => x.id && x.label)
        : [];
      mentionItemsByEndpoint.set(endpoint, items);
      return items;
    })
    .catch(() => {
      mentionItemsByEndpoint.set(endpoint, []);
      return [];
    })
    .finally(() => {
      mentionFetchByEndpoint.delete(endpoint);
    });

  mentionFetchByEndpoint.set(endpoint, p);
  return p;
}

export type TiptapEditorHandle = {
  getHTML: () => string;
  clear: () => void;
};

export function isTiptapEmptyHtml(html: string) {
  const compact = html
    .replace(/&nbsp;/gi, "")
    .replace(/\s+/g, "");
  return (
    compact === "" ||
    compact === "<p></p>" ||
    compact === "<p><br></p>" ||
    compact === "<p><br/></p>"
  );
}

type Props = {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  mentionEndpoint?: string;
};

const ON_CHANGE_DEBOUNCE_MS = 120;

const TiptapEditor = forwardRef<TiptapEditorHandle, Props>(
  function TiptapEditor(
    { content, onChange, placeholder, onSubmit, mentionEndpoint }: Props,
    ref
  ) {
    const onChangeRef = useRef(onChange);
    const onSubmitRef = useRef(onSubmit);
    const editorRef = useRef<Editor | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    );
    const mentionCacheRef = useRef<MentionItem[] | null>(null);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
      onSubmitRef.current = onSubmit;
    }, [onSubmit]);

    useEffect(() => {
      const endpoint = mentionEndpoint || "/api/staff/list";
      // Prime the cache in the background so the dropdown appears instantly.
      // (Ignore errors; suggestions fall back to empty.)
      void fetchMentionItems(endpoint).then((items) => {
        mentionCacheRef.current = items;
      });
    }, [mentionEndpoint]);

    const editor = useEditor({
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      extensions: [
        StarterKit.configure({
          undoRedo: { depth: 50 },
          link: {
            openOnClick: false,
            HTMLAttributes: {
              class: "text-emerald-500 hover:underline cursor-pointer",
            },
          },
        }),
        Placeholder.configure({
          placeholder: placeholder || "Type something...",
          emptyEditorClass: "is-editor-empty",
        }),
        Mention.configure({
          HTMLAttributes: {
            class:
              "bg-emerald-500/10 text-emerald-400 font-bold px-1 rounded border border-emerald-500/20",
          },
          suggestion: {
            // NOTE: TipTap suggestion expects item objects. We return { id, label }.
            items: async ({ query }): Promise<MentionItem[]> => {
              const q = (query ?? "").toLowerCase();
              const endpoint = mentionEndpoint || "/api/staff/list";
              const items =
                mentionCacheRef.current ??
                (await fetchMentionItems(endpoint).then((it) => {
                  mentionCacheRef.current = it;
                  return it;
                })) ??
                [];
              if (!q) return items.slice(0, 6);
              return items
                .filter((it) => it.label.toLowerCase().includes(q))
                .slice(0, 6);
            },
            command: ({ editor, range, props }) => {
              const item = props as MentionItem;
              // Insert the mention and a trailing space.
              editor
                .chain()
                .focus()
                .insertContentAt(range, [
                  {
                    type: "mention",
                    attrs: { id: item.id, label: item.label },
                  },
                  { type: "text", text: " " },
                ])
                .run();
            },
            render: () => {
              let root: HTMLDivElement | null = null;
              let list: HTMLDivElement | null = null;
              let selectedIndex = 0;

              const cleanup = () => {
                if (root?.parentNode) root.parentNode.removeChild(root);
                root = null;
                list = null;
                selectedIndex = 0;
              };

              const renderItems = (items: MentionItem[]) => {
                if (!list) return;
                list.innerHTML = "";
                items.forEach((item, idx) => {
                  const row = document.createElement("button");
                  row.type = "button";
                  row.className =
                    "w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors";
                  if (idx === selectedIndex) {
                    row.className += " bg-white/5";
                  }
                  row.textContent = item.label;
                  row.addEventListener("mousedown", (e) => {
                    // Prevent editor blur.
                    e.preventDefault();
                  });
                  row.addEventListener("click", () => {
                    (row as any).__mention_select?.();
                  });
                  // Hook for selection; filled in onUpdate where we have command()
                  (row as any).__mention_item = item;
                  list!.appendChild(row);
                });
              };

              return {
                onStart: (props: any) => {
                  cleanup();
                  root = document.createElement("div");
                  root.className =
                    "fixed z-[60] w-[280px] overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur";
                  list = document.createElement("div");
                  list.className = "max-h-[240px] overflow-auto";
                  root.appendChild(list);
                  document.body.appendChild(root);

                  selectedIndex = 0;
                  renderItems(props.items as MentionItem[]);

                  const rect = props.clientRect?.();
                  if (rect && root) {
                    root.style.left = `${Math.max(8, rect.left)}px`;
                    root.style.top = `${Math.min(window.innerHeight - 260, rect.bottom + 6)}px`;
                  }

                  // attach selection handler
                  const children = Array.from(list!.children) as any[];
                  children.forEach((el: any) => {
                    el.__mention_select = () => props.command(el.__mention_item);
                  });
                },
                onUpdate: (props: any) => {
                  selectedIndex = 0;
                  renderItems(props.items as MentionItem[]);
                  const rect = props.clientRect?.();
                  if (rect && root) {
                    root.style.left = `${Math.max(8, rect.left)}px`;
                    root.style.top = `${Math.min(window.innerHeight - 260, rect.bottom + 6)}px`;
                  }
                  const children = Array.from(list!.children) as any[];
                  children.forEach((el: any) => {
                    el.__mention_select = () => props.command(el.__mention_item);
                  });
                },
                onKeyDown: (props: any) => {
                  const items = props.items as MentionItem[];
                  if (props.event.key === "Escape") {
                    cleanup();
                    return true;
                  }
                  if (props.event.key === "ArrowDown") {
                    selectedIndex = Math.min(items.length - 1, selectedIndex + 1);
                    renderItems(items);
                    const children = Array.from(list!.children) as any[];
                    children.forEach((el: any) => {
                      el.__mention_select = () => props.command(el.__mention_item);
                    });
                    return true;
                  }
                  if (props.event.key === "ArrowUp") {
                    selectedIndex = Math.max(0, selectedIndex - 1);
                    renderItems(items);
                    const children = Array.from(list!.children) as any[];
                    children.forEach((el: any) => {
                      el.__mention_select = () => props.command(el.__mention_item);
                    });
                    return true;
                  }
                  if (props.event.key === "Enter") {
                    const item = items[selectedIndex];
                    if (item) props.command(item);
                    cleanup();
                    return true;
                  }
                  return false;
                },
                onExit: () => {
                  cleanup();
                },
              };
            },
          },
        }),
        Markdown.configure({
          html: true,
          tightLists: true,
          linkify: true,
          breaks: true,
        }),
      ],
      content,
      onUpdate: ({ editor: ed }) => {
        const html = ed.getHTML();
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          debounceTimerRef.current = null;
          onChangeRef.current(html);
        }, ON_CHANGE_DEBOUNCE_MS);
      },
      editorProps: {
        attributes: {
          class:
            "prose prose-sm prose-invert max-w-none focus:outline-none min-h-[80px] p-4 text-sm text-gray-300 custom-scrollbar",
        },
        handleKeyDown: (_view, event) => {
          const ed = editorRef.current;
          if (!ed) return false;
          if (event.key === "Enter" && !event.shiftKey && onSubmitRef.current) {
            event.preventDefault();
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
              debounceTimerRef.current = null;
            }
            const html = ed.getHTML();
            onChangeRef.current(html);
            onSubmitRef.current();
            return true;
          }
          return false;
        },
      },
    }, []);

    useEffect(() => {
      editorRef.current = editor ?? null;
    }, [editor]);

    useImperativeHandle(
      ref,
      () => ({
        getHTML: () => editor?.getHTML() ?? "",
        clear: () => {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }
          editor?.commands.clearContent();
          onChangeRef.current("");
        },
      }),
      [editor]
    );

    const states = useEditorState({
      editor,
      selector: (ctx) => ({
        isBold: ctx.editor?.isActive("bold") || false,
        isItalic: ctx.editor?.isActive("italic") || false,
        isBulletList: ctx.editor?.isActive("bulletList") || false,
        isCodeBlock: ctx.editor?.isActive("codeBlock") || false,
      }),
    });

    useEffect(() => {
      if (!editor) return;
      if (content === "" && !isTiptapEmptyHtml(editor.getHTML())) {
        editor.commands.setContent("");
      }
    }, [content, editor]);

    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    if (!editor) return null;

    return (
      <div className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden focus-within:border-emerald-500/50 transition-all shadow-inner group">
        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 bg-white/[0.02] opacity-30 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-white/10 transition-colors ${states?.isBold ? "text-emerald-500 bg-white/10" : "text-gray-500"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-white/10 transition-colors ${states?.isItalic ? "text-emerald-500 bg-white/10" : "text-gray-500"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="4" x2="10" y2="4" />
              <line x1="14" y1="20" x2="5" y2="20" />
              <line x1="15" y1="4" x2="9" y2="20" />
            </svg>
          </button>
          <div className="w-px h-3 bg-white/10 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-white/10 transition-colors ${states?.isBulletList ? "text-emerald-500 bg-white/10" : "text-gray-500"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded hover:bg-white/10 transition-colors ${states?.isCodeBlock ? "text-emerald-500 bg-white/10" : "text-gray-500"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </button>
          <div className="flex-grow" />
          <span className="text-[9px] font-bold text-gray-700 tracking-widest uppercase px-2">
            MD Support Active
          </span>
        </div>

        <EditorContent editor={editor} />

        <style jsx global>{`
          .tiptap p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #333;
            pointer-events: none;
            height: 0;
            font-style: italic;
          }
          .tiptap .mention {
            cursor: default;
          }
        `}</style>
      </div>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";

export default TiptapEditor;
