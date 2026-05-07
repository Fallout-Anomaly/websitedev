"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useState } from "react";

function env(key: string): string | undefined {
  const v = process.env[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export default function WidgetBotCrate() {
  const server = env("NEXT_PUBLIC_WIDGETBOT_SERVER_ID");
  const channel = env("NEXT_PUBLIC_WIDGETBOT_CHANNEL_ID");
  const [useFallbackCdn, setUseFallbackCdn] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Keep it opt-in and non-breaking in dev/CI.
  if (!server || !channel) return null;

  const src = useMemo(
    () =>
      useFallbackCdn
        ? "https://unpkg.com/@widgetbot/crate@3"
        : "https://cdn.jsdelivr.net/npm/@widgetbot/crate@3",
    [useFallbackCdn],
  );

  const init = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      if (window.__fwWidgetBotCrateInitialized) return;

      const attempt = () => {
        const Crate = window.Crate ?? (window as any).Crate;
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

  // When switching CDNs, reset "loaded" so init re-runs.
  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <>
      <Script
        id="widgetbot-crate"
        src={src}
        strategy="afterInteractive"
        onLoad={() => {
          setLoaded(true);
          init();
        }}
        onError={() => {
          // try the other CDN once
          setUseFallbackCdn(true);
        }}
      />

      {/* Match WidgetBot docs: init after script loads */}
      {loaded ? (
        <Script id="widgetbot-crate-init" strategy="afterInteractive">
          {`
            try {
              if (typeof window !== 'undefined' && typeof window.Crate === 'function' && !window.__fwWidgetBotCrateInitialized) {
                window.__fwWidgetBotCrateInitialized = true;
                new window.Crate({ server: ${JSON.stringify(server)}, channel: ${JSON.stringify(channel)} });
              }
            } catch (e) {}
          `}
        </Script>
      ) : null}
    </>
  );
}

declare global {
  interface Window {
    Crate?: new (opts: { server: string; channel: string }) => unknown;
    __fwWidgetBotCrateInitialized?: boolean;
  }
}

