import type { User } from "@supabase/supabase-js";
import { normalizeSupabaseUrlToProjectApiUrl } from "@/src/lib/normalize-supabase-url";

/**
 * Curated WebP files in bucket `profile_pictures`.
 * Default object keys: `presets/{n}.webp`, then `{n}.webp` at bucket root.
 * Use `PROFILE_PRESET_STORAGE_OVERRIDES` when a slot uses a custom filename (spaces, etc.).
 */
export const PROFILE_AVATAR_PRESET_IDS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
] as const;

export type ProfileAvatarPresetId = (typeof PROFILE_AVATAR_PRESET_IDS)[number];

const PRESET_COUNT = PROFILE_AVATAR_PRESET_IDS.length;
const BUCKET = "profile_pictures";

/**
 * When a slot’s file is not named `presets/{n}.webp`, set the Storage object key here
 * (path inside the bucket, e.g. `presets/89096 (1).webp`).
 */
/** Map a UI slot to a custom Storage object key when it is not `presets/{n}.webp`. */
export const PROFILE_PRESET_STORAGE_OVERRIDES: Partial<
  Record<ProfileAvatarPresetId, string>
> = {};

function presetStorageKeysInTryOrder(id: ProfileAvatarPresetId): string[] {
  const primary = `presets/${id}.webp`;
  const secondary = `${id}.webp`;
  const custom = PROFILE_PRESET_STORAGE_OVERRIDES[id];
  if (custom) {
    const keys: string[] = [];
    const seen = new Set<string>();
    const add = (k: string) => {
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
    };
    add(custom);
    // Same filename at bucket root (your other presets often live next to each other).
    if (custom.startsWith("presets/")) {
      add(custom.slice("presets/".length));
    }
    if (custom !== primary) add(primary);
    if (custom !== secondary) add(secondary);
    return keys;
  }
  return [primary, secondary];
}

/**
 * Public object URLs for one Storage key. Tries RFC3986 segment encoding first, then
 * “space only” encoding (matches browsers that leave `(` unescaped), since Storage keys
 * are compared after decode.
 */
function publicUrlsForBucketObject(prefix: string, objectKey: string): string[] {
  const segments = objectKey.split("/").filter((s) => s.length > 0);
  if (segments.length === 0) return [];
  const strict = `${prefix}/${segments.map((seg) => encodeURIComponent(seg)).join("/")}`;
  const loose = `${prefix}/${segments.map((seg) => seg.replace(/ /g, "%20")).join("/")}`;
  return strict === loose ? [strict] : [strict, loose];
}

export function avatarPresetFromSeed(seed: string): ProfileAvatarPresetId {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const n = (h % PRESET_COUNT) + 1;
  return String(n) as ProfileAvatarPresetId;
}

function normalizePresetId(raw: string | null | undefined): ProfileAvatarPresetId | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  if (n <= PRESET_COUNT) return String(n) as ProfileAvatarPresetId;
  // Legacy `avatar_preset` from when twelve slots existed — fold into 1…PRESET_COUNT.
  return String(((n - 1) % PRESET_COUNT) + 1) as ProfileAvatarPresetId;
}

/** Preset from JWT metadata `avatar_preset`, else stable default from user id. */
export function avatarPresetForUser(user: User | null | undefined): ProfileAvatarPresetId {
  if (!user) return "1";
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fromMeta = normalizePresetId(
    typeof meta?.avatar_preset === "string" ? meta.avatar_preset : null
  );
  if (fromMeta) return fromMeta;
  return avatarPresetFromSeed(user.id);
}

export function profilePresetStoragePath(presetId: string): string {
  const id = (normalizePresetId(presetId) ?? "1") as ProfileAvatarPresetId;
  return PROFILE_PRESET_STORAGE_OVERRIDES[id] ?? `presets/${id}.webp`;
}

/** Public URLs to try in order until one loads (or use SVG fallback in the component). */
export function profilePresetPublicUrlsOrdered(
  supabaseUrl: string,
  presetId: string
): string[] {
  const base = normalizeSupabaseUrlToProjectApiUrl(supabaseUrl);
  if (!base) return [];
  const id = (normalizePresetId(presetId) ?? "1") as ProfileAvatarPresetId;
  const prefix = `${base}/storage/v1/object/public/${BUCKET}`;
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const key of presetStorageKeysInTryOrder(id)) {
    for (const u of publicUrlsForBucketObject(prefix, key)) {
      if (!seen.has(u)) {
        seen.add(u);
        urls.push(u);
      }
    }
  }
  return urls;
}

export function profilePresetPublicUrl(
  supabaseUrl: string,
  presetId: string
): string {
  const [first] = profilePresetPublicUrlsOrdered(supabaseUrl, presetId);
  return first ?? "";
}

/** Inline SVG when storage has no preset files yet (avoids broken image icons). */
export function profilePresetFallbackDataUrl(presetId: string): string {
  const id = normalizePresetId(presetId) ?? "1";
  const n = parseInt(id, 10);
  const hue = Number.isFinite(n) ? ((n - 1) * 30) % 360 : 160;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue} 42% 38%)"/><stop offset="100%" stop-color="hsl(${(hue + 40) % 360} 38% 22%)"/></linearGradient></defs><circle cx="32" cy="32" r="32" fill="url(#g)"/><text x="32" y="40" text-anchor="middle" fill="rgba(255,255,255,0.92)" font-size="22" font-weight="700" font-family="ui-sans-serif,system-ui,sans-serif">${id}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** For rows with optional stored preset (denormalized) + stable seed (e.g. user_id or message id). */
export function resolveAvatarPreset(
  stored: string | null | undefined,
  seed: string
): ProfileAvatarPresetId {
  return normalizePresetId(stored) ?? avatarPresetFromSeed(seed);
}
