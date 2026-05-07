"use client";

import { useCallback, useEffect, useState } from "react";
import {
  profilePresetFallbackDataUrl,
  profilePresetPublicUrlsOrdered,
  resolveAvatarPreset,
  type ProfileAvatarPresetId,
} from "@/src/lib/profile-avatar";

type Props = {
  /** Saved preset on the row, if any. */
  storedPreset?: string | null;
  /** Stable id for fallback preset when `storedPreset` is missing (user id, message id, etc.). */
  seed: string;
  /** Accessible label / fallback initial. */
  label: string;
  size?: number;
  className?: string;
};

export default function ProfileAvatar({
  storedPreset,
  seed,
  label,
  size = 28,
  className = "",
}: Props) {
  const preset = resolveAvatarPreset(storedPreset, seed) as ProfileAvatarPresetId;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const remoteUrls = base ? profilePresetPublicUrlsOrdered(base, preset) : [];
  const inlineSrc = profilePresetFallbackDataUrl(preset);
  const sources = [...remoteUrls, inlineSrc];
  const [attempt, setAttempt] = useState(0);
  const urlSignature = remoteUrls.join("|");
  useEffect(() => {
    setAttempt(0);
  }, [preset, urlSignature]);
  const onErrorFinal = useCallback(() => {
    setAttempt((a) => a + 1);
  }, []);
  const initial = (label.trim().charAt(0) || "?").toUpperCase();

  if (attempt >= sources.length || sources.length === 0) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#30363d] text-[10px] font-bold uppercase text-[#c9d1d9] ${className}`}
        style={{ width: size, height: size }}
        aria-hidden={!label}
        title={label}
      >
        {initial}
      </span>
    );
  }

  const src = sources[attempt] ?? "";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ring-1 ring-white/10 ${className}`}
      onError={onErrorFinal}
    />
  );
}

/** Picker / grid: tries Supabase preset WebP, falls back to generated SVG. */
export function ProfilePresetPickerImage({
  presetId,
  size,
  className = "",
}: {
  presetId: ProfileAvatarPresetId;
  size: number;
  className?: string;
}) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const remoteUrls = base ? profilePresetPublicUrlsOrdered(base, presetId) : [];
  const inlineSrc = profilePresetFallbackDataUrl(presetId);
  const sources = [...remoteUrls, inlineSrc];
  const [attempt, setAttempt] = useState(0);
  const urlSignature = remoteUrls.join("|");
  useEffect(() => {
    setAttempt(0);
  }, [presetId, urlSignature]);
  const onError = useCallback(() => {
    setAttempt((a) => a + 1);
  }, []);

  if (attempt >= sources.length || sources.length === 0) {
    return (
      <span
        className={`flex items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-400 ${className}`}
        style={{ width: size, height: size }}
      >
        {presetId}
      </span>
    );
  }

  const src = sources[attempt] ?? "";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt=""
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={onError}
    />
  );
}
