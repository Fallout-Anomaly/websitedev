"use client";

import Script from "next/script";
import { useMemo, useState } from "react";

function env(key: string): string | undefined {
  const v = process.env[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export default function WidgetBotCrate() {
  const server = env("NEXT_PUBLIC_WIDGETBOT_SERVER_ID");
  const channel = env("NEXT_PUBLIC_WIDGETBOT_CHANNEL_ID");
  const [useFallbackCdn, setUseFallbackCdn] = useState(false);

  // Keep it opt-in and non-breaking in dev/CI.
  if (!server || !channel) return null;

  const src = useMemo(
    () =>
      useFallbackCdn
        ? "/vendor/widgetbot-crate.js"
        : "https://cdn.jsdelivr.net/npm/@widgetbot/crate@3",
    [useFallbackCdn],
  );

  const initScript = useMemo(() => {
    const serverJson = JSON.stringify(server);
    const channelJson = JSON.stringify(channel);
    return `
(() => {
  try {
    if (typeof window === "undefined") return;
    if (window.__fwWidgetBotCrateInitialized) return;

    const attempt = () => {
      const Crate = window.Crate ?? window["Crate"];
      if (typeof Crate !== "function") return false;
      window.__fwWidgetBotCrateInitialized = true;
      new Crate({ server: ${serverJson}, channel: ${channelJson} });
      return true;
    };

    if (attempt()) return;
    let tries = 0;
    const t = window.setInterval(() => {
      tries += 1;
      if (attempt() || tries >= 40) window.clearInterval(t);
    }, 250);
  } catch {
    // ignore
  }
})();
`.trim();
  }, [server, channel]);

  return (
    <>
      <Script
        id="widgetbot-crate"
        src={src}
        strategy="afterInteractive"
        onError={() => {
          // If jsDelivr is blocked by the client, fall back to self-hosted.
          setUseFallbackCdn(true);
        }}
      />
      <Script
        id="widgetbot-crate-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: initScript }}
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

