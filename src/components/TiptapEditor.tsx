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
};

const STAFF_MEMBERS = ["falloutanomaly", "voidframe", "staff", "admin"];

const ON_CHANGE_DEBOUNCE_MS = 120;

const TiptapEditor = forwardRef<TiptapEditorHandle, Props>(
  function TiptapEditor(
    { content, onChange, placeholder, onSubmit }: Props,
    ref
  ) {
    const onChangeRef = useRef(onChange);
    const onSubmitRef = useRef(onSubmit);
    const editorRef = useRef<Editor | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
      onSubmitRef.current = onSubmit;
    }, [onSubmit]);

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
            items: ({ query }) => {
              return STAFF_MEMBERS.filter((item) =>
                item.toLowerCase().startsWith(query.toLowerCase())
              ).slice(0, 5);
            },
            render: () => {
              return {
                onStart: () => {},
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
