import { nanoid } from "nanoid";

export function buildWikiAssetPath(userId: string, originalName: string) {
  const safeName = originalName
    .trim()
    .replaceAll("\\", "-")
    .replaceAll("/", "-")
    .replaceAll("..", ".")
    .replaceAll(":", "-");

  return `${userId}/${nanoid(10)}-${safeName}`;
}

