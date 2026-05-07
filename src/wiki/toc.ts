export type TocItem = {
  depth: number;
  text: string;
  id: string;
};

function slugHeading(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split(/\r?\n/g);
  const out: TocItem[] = [];
  const seen = new Map<string, number>();

  for (const line of lines) {
    const m = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const depth = m[1]!.length;
    const text = m[2]!.replace(/\s+#+\s*$/, "").trim();
    const base = slugHeading(text);
    if (!base) continue;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const id = n === 1 ? base : `${base}-${n}`;
    out.push({ depth, text, id });
  }

  return out;
}

