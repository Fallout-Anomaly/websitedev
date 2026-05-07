import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  source: string;
  className?: string;
};

function slugHeading(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function WikiMarkdown({ source, className = "" }: Props) {
  const text =
    source.length > 200_000 ? `${source.slice(0, 200_000)}\n\n…(truncated)` : source;

  function headingTextFromChildren(children: unknown): string {
    if (typeof children === "string") return children;
    if (Array.isArray(children)) {
      const first = children[0];
      return typeof first === "string" ? first : "";
    }
    return "";
  }

  return (
    <div
      className={`prose prose-invert max-w-none break-words [overflow-wrap:anywhere]
        prose-p:text-neutral-200 prose-a:text-emerald-300 prose-a:no-underline hover:prose-a:underline
        prose-code:rounded prose-code:bg-white/5 prose-code:px-1 prose-code:text-emerald-200 prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10
        ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2({ children, ...props }) {
            const headingText = headingTextFromChildren(children).trim();
            const id = slugHeading(headingText);
            return (
              <h2 id={id} {...props}>
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            const headingText = headingTextFromChildren(children).trim();
            const id = slugHeading(headingText);
            return (
              <h3 id={id} {...props}>
                {children}
              </h3>
            );
          },
          h4({ children, ...props }) {
            const headingText = headingTextFromChildren(children).trim();
            const id = slugHeading(headingText);
            return (
              <h4 id={id} {...props}>
                {children}
              </h4>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

