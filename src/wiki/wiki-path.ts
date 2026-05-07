export function normalizeWikiPath(rawSegments: string[]) {
  const segments = rawSegments
    .flatMap((s) => s.split("/"))
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase())
    .map((s) => s.replaceAll(" ", "-"));

  const path = segments.join("/");
  return { segments, path };
}

