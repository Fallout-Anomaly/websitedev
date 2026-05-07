"use client";

import { createRealtime, RealtimeProvider } from "@upstash/realtime/client";
import type { RealtimeEvents } from "@/lib/realtime";

export const { useRealtime } = createRealtime<RealtimeEvents>();
export { RealtimeProvider };

