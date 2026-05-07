"use client";

import { RealtimeProvider } from "@/lib/realtime-client";

export default function Providers({ children }: { children: React.ReactNode }) {
  const enabled = process.env.NEXT_PUBLIC_REALTIME_ENABLED === "true";
  return (
    <RealtimeProvider maxReconnectAttempts={enabled ? undefined : 0}>
      {children}
    </RealtimeProvider>
  );
}

