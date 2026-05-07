import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertStaffSession } from "@/src/lib/assert-staff-session";
import { getRedis } from "@/lib/redis";

type Payload = {
  totalPlatformUsers: number;
  liveSessions: number;
  verificationQueue: number;
  cached: boolean;
};

const CACHE_KEY = "staff:metrics:v1";
const CACHE_TTL_SECONDS = 30;

export async function GET() {
  // Requires staff portal access.
  await assertStaffSession();

  // Cache in Redis when available; fall back to direct RPC call.
  let redisOk = true;
  let cachedRaw: string | null = null;
  try {
    cachedRaw = await getRedis().get<string>(CACHE_KEY);
  } catch {
    redisOk = false;
  }

  if (cachedRaw) {
    const parsed = JSON.parse(cachedRaw) as Payload;
    return NextResponse.json(parsed);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("staff_metrics");
  if (error || !data || !Array.isArray(data) || !data[0]) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to load metrics" },
      { status: 500 },
    );
  }

  const row = data[0] as any;
  const payload: Payload = {
    totalPlatformUsers: Number(row.total_platform_users ?? 0),
    liveSessions: Number(row.live_sessions ?? 0),
    verificationQueue: Number(row.verification_queue ?? 0),
    cached: false,
  };

  if (redisOk) {
    try {
      await getRedis().set(CACHE_KEY, JSON.stringify({ ...payload, cached: true }), {
        ex: CACHE_TTL_SECONDS,
      });
    } catch {
      // ignore cache failures
    }
  }

  return NextResponse.json(payload);
}

