"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  /** User-submitted markdown — no raw HTML (XSS-safe). */
  source: string;
  className?: string;
};

/**
 * Renders support ticket / player report bodies with GitHub-flavored markdown.
 * Keep one instance per page — thread lines should use plain text for performance.
 */
export default function SupportTicketMarkdown({ source, className = "" }: Props) {
  const text =
    source.length > 120_000 ? `${source.slice(0, 120_000)}\n\n…(truncated for display)` : source;
  return (
    <div
      className={`prose prose-invert prose-sm max-w-none
        prose-headings:scroll-mt-20 prose-headings:text-[#f0f6fc]
        prose-h1:text-xl prose-h1:font-semibold prose-h1:border-b prose-h1:border-[#30363d] prose-h1:pb-2
        prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3
        prose-h3:text-base prose-h3:font-semibold prose-h3:mt-6
        prose-p:text-[#c9d1d9] prose-p:leading-relaxed prose-p:text-sm
        prose-li:text-[#c9d1d9] prose-li:text-sm prose-li:marker:text-[#8b949e]
        prose-strong:text-white prose-strong:font-semibold
        prose-a:text-[#58a6ff] prose-a:no-underline hover:prose-a:underline
        prose-hr:border-[#30363d]
        prose-code:rounded prose-code:bg-[#161b22] prose-code:px-1 prose-code:text-[#79c0ff] prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-[#30363d] prose-pre:text-[#c9d1d9]
        ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
