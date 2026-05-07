"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "fw_brand_rename_ack_v1";

export default function BrandRenameModal() {
  const [open, setOpen] = useState(false);

  const canUseStorage = useMemo(() => {
    try {
      return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!canUseStorage) return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      // ignore
    }
  }, [canUseStorage]);

  const close = () => {
    setOpen(false);
    if (!canUseStorage) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Fallout Anomaly rename notice"
    >
      <div className="w-full max-w-xl border-2 border-emerald-500 bg-[#0a0a0a] shadow-[0_0_60px_rgba(16,185,129,0.25)]">
        <div className="border-b-2 border-emerald-500/30 bg-[#111] px-5 py-4">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">
            Important update
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            Fallout Anomaly is now{" "}
            <span className="text-emerald-500 italic">Fallen World</span>
          </h2>
        </div>

        <div className="px-5 py-6 text-sm leading-relaxed text-gray-300">
          <p>
            This change comes from big changes — for the better.
            <span className="text-white font-semibold"> Fallen World</span> has
            evolved into a far more brutal experience and we want it to stand on
            its own.
          </p>
          <p className="mt-4 text-gray-400">
            We don’t want the project to feel like it’s living in the shadow of
            games like STALKER. The gameplay you came to love isn’t going
            anywhere — this is about identity and direction, so Fallen World can
            be its own thing.
          </p>
          <p className="mt-4 text-gray-400">
            You’re in the right place. Links, docs, and branding will continue
            to update as the transition finishes.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={close}
              className="rounded border-2 border-emerald-500 bg-emerald-500 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-black transition hover:bg-transparent hover:text-emerald-500"
            >
              Got it
            </button>
            <a
              href="/guide"
              onClick={close}
              className="rounded border-2 border-[#2e2e2e] bg-black px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#2e2e2e]"
            >
              Installation guide
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

