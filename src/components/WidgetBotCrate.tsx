"use client";

import Script from "next/script";
import { useCallback } from "react";

function env(key: string): string | undefined {
  const v = process.env[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export default function WidgetBotCrate() {
  const server = env("NEXT_PUBLIC_WIDGETBOT_SERVER_ID");
  const channel = env("NEXT_PUBLIC_WIDGETBOT_CHANNEL_ID");

  // Keep it opt-in and non-breaking in dev/CI.
  if (!server || !channel) return null;

  const init = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      if (window.__fwWidgetBotCrateInitialized) return;

      const attempt = () => {
        const Crate = window.Crate;
        if (typeof Crate !== "function") return false;
        window.__fwWidgetBotCrateInitialized = true;
        // eslint-disable-next-line no-new
        new Crate({ server, channel });
        return true;
      };

      // Try immediately, then retry briefly for slow/blocked loads.
      if (attempt()) return;
      let tries = 0;
      const t = window.setInterval(() => {
        tries += 1;
        if (attempt() || tries >= 20) window.clearInterval(t);
      }, 250);
    } catch {
      // Swallow to avoid breaking the app if the CDN is blocked.
    }
  }, [server, channel]);

  return (
    <>
      <Script
        id="widgetbot-crate"
        src="https://cdn.jsdelivr.net/npm/@widgetbot/crate@3"
        strategy="afterInteractive"
        onLoad={init}
      />
    </>
  );
}

declare global {
  interface Window {
    Crate?: new (opts: { server: string; channel: string }) => unknown;
    __fwWidgetBotCrateInitialized?: boolean;
  }
}

