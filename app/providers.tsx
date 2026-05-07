"use client";

import { RealtimeProvider } from "@/lib/realtime-client";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <RealtimeProvider>{children}</RealtimeProvider>;
}

