"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  source: string;
  className?: string;
};

export default function RoadmapCardMarkdown({ source, className = "" }: Props) {
  const text =
    source.length > 40_000 ? `${source.slice(0, 40_000)}\n\n…(truncated)` : source;

  return (
    <div
      className={`prose prose-invert prose-sm max-w-none break-words [overflow-wrap:anywhere]
        prose-p:my-0 prose-p:text-neutral-300 prose-p:leading-relaxed prose-p:text-xs
        prose-a:break-all prose-a:text-emerald-300 prose-a:no-underline hover:prose-a:underline
        prose-code:rounded prose-code:bg-white/5 prose-code:px-1 prose-code:text-emerald-200 prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10
        ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

