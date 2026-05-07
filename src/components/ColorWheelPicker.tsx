"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function toHexByte(n: number) {
  const v = Math.max(0, Math.min(255, Math.round(n)));
  return v.toString(16).padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`.toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}

// HSV in [0..1] → RGB in [0..255]
function hsvToRgb(h: number, s: number, v: number) {
  const hh = ((h % 1) + 1) % 1;
  const i = Math.floor(hh * 6);
  const f = hh * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const mod = i % 6;
  const [r, g, b] =
    mod === 0
      ? [v, t, p]
      : mod === 1
        ? [q, v, p]
        : mod === 2
          ? [p, v, t]
          : mod === 3
            ? [p, q, v]
            : mod === 4
              ? [t, p, v]
              : [v, p, q];
  return { r: r * 255, g: g * 255, b: b * 255 };
}

function rgbToHsv(r: number, g: number, b: number) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case rr:
        h = (gg - bb) / d + (gg < bb ? 6 : 0);
        break;
      case gg:
        h = (bb - rr) / d + 2;
        break;
      default:
        h = (rr - gg) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h, s, v };
}

function readRecents(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string");
  } catch {
    return [];
  }
}

function writeRecents(key: string, colors: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(colors.slice(0, 12)));
  } catch {
    // ignore
  }
}

type Props = {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  presets?: string[];
  recentsKey?: string;
};

export default function ColorWheelPicker({
  value,
  onChange,
  label = "Color",
  presets = [
    "#FF5555",
    "#55AAFF",
    "#FFAA00",
    "#55FF99",
    "#AA55FF",
    "#FF77AA",
    "#44DDFF",
    "#88FF44",
    "#FFAA55",
    "#CCCCCC",
    "#3B82F6",
    "#22C55E",
  ],
  recentsKey = "staff-project-category-colors",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerDownRef = useRef(false);
  const [hexDraft, setHexDraft] = useState(value.toUpperCase());
  const [recents, setRecents] = useState<string[]>([]);

  const rgb = useMemo(() => hexToRgb(value) ?? { r: 59, g: 130, b: 246 }, [value]);
  const hsv = useMemo(() => rgbToHsv(rgb.r, rgb.g, rgb.b), [rgb.r, rgb.g, rgb.b]);

  const size = 180;
  const radius = size / 2 - 8;

  useEffect(() => {
    setHexDraft(value.toUpperCase());
  }, [value]);

  useEffect(() => {
    setRecents(readRecents(recentsKey));
  }, [recentsKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // glossy background plate
    ctx.clearRect(0, 0, size, size);
    const plate = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    plate.addColorStop(0, "rgba(255,255,255,0.05)");
    plate.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = plate;
    ctx.fillRect(0, 0, size, size);

    // wheel: hue angle + saturation radius, value fixed at 1
    const image = ctx.createImageData(size, size);
    const cx = size / 2;
    const cy = size / 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * size + x) * 4;
        if (dist > radius) {
          image.data[idx + 3] = 0;
          continue;
        }
        const sat = clamp01(dist / radius);
        const ang = Math.atan2(dy, dx); // -pi..pi
        const hue = (ang / (Math.PI * 2) + 1) % 1;
        const { r, g, b } = hsvToRgb(hue, sat, 1);
        image.data[idx] = Math.round(r);
        image.data[idx + 1] = Math.round(g);
        image.data[idx + 2] = Math.round(b);
        image.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);

    // inner vignette for gloss
    const vignette = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = vignette;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    // highlight arc
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 1, -Math.PI * 0.95, -Math.PI * 0.15);
    ctx.stroke();
  }, [size, radius]);

  function commitColor(nextHex: string) {
    const normalized = nextHex.toUpperCase();
    onChange(normalized);
    setHexDraft(normalized);
    setRecents((prev) => {
      const next = [normalized, ...prev.filter((c) => c !== normalized)].slice(0, 12);
      writeRecents(recentsKey, next);
      return next;
    });
  }

  function pickFromCanvas(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const cx = size / 2;
    const cy = size / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) return;
    const sat = clamp01(dist / radius);
    const hue = ((Math.atan2(dy, dx) / (Math.PI * 2) + 1) % 1);
    const { r, g, b } = hsvToRgb(hue, sat, 1);
    commitColor(rgbToHex(r, g, b));
  }

  const handlePos = useMemo(() => {
    const ang = hsv.h * Math.PI * 2;
    const rr = hsv.s * radius;
    return {
      x: size / 2 + Math.cos(ang) * rr,
      y: size / 2 + Math.sin(ang) * rr,
    };
  }, [hsv.h, hsv.s, radius, size]);

  return (
    <div className="w-full">
      <p className="text-xs font-semibold text-[#8b949e]">{label}</p>

      <div className="mt-2 grid gap-4 sm:grid-cols-[220px_1fr]">
        <div className="relative">
          <div className="relative rounded-full border border-white/10 bg-white/[0.02] p-4 shadow-inner">
            <canvas
              ref={canvasRef}
              className="block select-none rounded-full"
              onPointerDown={(e) => {
                (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
                pointerDownRef.current = true;
                pickFromCanvas(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (!pointerDownRef.current) return;
                pickFromCanvas(e.clientX, e.clientY);
              }}
              onPointerUp={() => {
                pointerDownRef.current = false;
              }}
            />
            <div
              className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 shadow-[0_0_0_3px_rgba(0,0,0,0.35)]"
              style={{
                left: `${handlePos.x}px`,
                top: `${handlePos.y}px`,
                background: value,
              }}
              aria-hidden
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-full border border-white/15 shadow-inner"
                style={{ background: value }}
                aria-hidden
              />
              <span className="text-xs font-mono text-[#c9d1d9]">{value.toUpperCase()}</span>
            </div>
            <span className="text-[10px] text-[#6e7681]">Wheel</span>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block sm:col-span-1">
              <span className="text-[11px] font-semibold text-[#8b949e]">HEX</span>
              <input
                value={hexDraft}
                onChange={(e) => setHexDraft(e.target.value.toUpperCase())}
                onBlur={() => {
                  const parsed = hexToRgb(hexDraft);
                  if (!parsed) {
                    setHexDraft(value.toUpperCase());
                    return;
                  }
                  commitColor(rgbToHex(parsed.r, parsed.g, parsed.b));
                }}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm font-mono text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
                placeholder="#3B82F6"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-[#8b949e]">R</span>
              <input
                inputMode="numeric"
                value={String(rgb.r)}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  commitColor(rgbToHex(n, rgb.g, rgb.b));
                }}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm font-mono text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-[#8b949e]">G</span>
              <input
                inputMode="numeric"
                value={String(rgb.g)}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  commitColor(rgbToHex(rgb.r, n, rgb.b));
                }}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm font-mono text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-[#8b949e]">B</span>
              <input
                inputMode="numeric"
                value={String(rgb.b)}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  commitColor(rgbToHex(rgb.r, rgb.g, n));
                }}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm font-mono text-[#f0f6fc] outline-none focus:border-[#58a6ff]/60"
              />
            </label>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#8b949e]">Presets</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {presets.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => commitColor(c)}
                  className="h-7 w-7 rounded-full border border-white/10 shadow-inner transition-transform hover:scale-[1.03]"
                  style={{ background: c }}
                  aria-label={`Preset ${c}`}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#8b949e]">Recent</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {recents.length === 0 ? (
                <span className="text-xs text-[#6e7681]">No recent colors yet</span>
              ) : (
                recents.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => commitColor(c)}
                    className="h-7 w-7 rounded-full border border-white/10 shadow-inner transition-transform hover:scale-[1.03]"
                    style={{ background: c }}
                    aria-label={`Recent ${c}`}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

