import {
  InferRealtimeEvents,
  Realtime as RealtimeCtor,
  type Realtime as RealtimeInstance,
} from "@upstash/realtime";
import z from "zod/v4";
import type { Redis } from "@upstash/redis";
import { getRedis } from "@/lib/redis";

const schema = {
  notification: {
    created: z.object({
      id: z.string(),
      title: z.string(),
      body: z.string().optional(),
      href: z.string().optional(),
      createdAt: z.string(),
      readAt: z.string().nullable().optional(),
    }),
  },
};

type RealtimeOpts = { schema: typeof schema; redis: Redis };

let _realtime: RealtimeInstance<RealtimeOpts> | null = null;

export function getRealtime(): RealtimeInstance<RealtimeOpts> {
  if (_realtime) return _realtime;
  const created = new RealtimeCtor({ schema, redis: getRedis() });
  _realtime = created;
  return created;
}

export type RealtimeEvents = InferRealtimeEvents<ReturnType<typeof getRealtime>>;

