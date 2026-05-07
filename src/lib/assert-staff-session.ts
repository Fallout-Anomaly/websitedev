import { createClient } from "@/lib/supabase/server";
import { isStaffAccount } from "@/src/lib/staff-access";
import type { User } from "@supabase/supabase-js";

export async function assertStaffSession(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isStaffAccount(supabase, user))) {
    throw new Error("Unauthorized");
  }
  return { supabase, user };
}
