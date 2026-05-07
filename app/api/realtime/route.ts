import { handle } from "@upstash/realtime";
import { getRealtime } from "@/lib/realtime";
import { createClient } from "@/lib/supabase/server";
import { isStaffAccount } from "@/src/lib/staff-access";

function isTicketChannel(channel: string) {
  return channel.startsWith("ticket:");
}

function isUserChannelFor(channel: string, userId: string) {
  return channel === `user:${userId}`;
}

const configured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

export const GET = configured
  ? handle({
      // handle()'s generic inference doesn't play well with conditional exports here.
      realtime: getRealtime() as any,
      middleware: async ({ channels }) => {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const staff = user ? await isStaffAccount(supabase, user) : false;

        for (const channel of channels) {
          if (channel === "default") continue;

          if (isTicketChannel(channel)) {
            continue;
          }

          if (!user) {
            return new Response("Unauthorized", { status: 401 });
          }

          if (isUserChannelFor(channel, user.id)) {
            continue;
          }

          if (channel === "staff" && staff) {
            continue;
          }

          return new Response("Forbidden", { status: 403 });
        }
      },
    })
  : async () =>
      new Response("Realtime not configured", {
        status: 503,
      });

