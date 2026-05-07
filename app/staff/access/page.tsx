import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageStaffRoles } from "@/src/lib/staff-role-admin";
import StaffAccessManager from "./staff-access-manager";

export const dynamic = "force-dynamic";

export default async function StaffAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!canManageStaffRoles(user)) {
    redirect("/staff");
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent">
      <div className="px-2 pt-4 sm:px-0 sm:pt-2">
        <header className="pb-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6e7681]">
                Staff / Access
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-[#f0f6fc] sm:text-3xl">
                Staff Access
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#8b949e]">
                Grant or revoke staff permissions within the portal.
              </p>
            </div>
          </div>
        </header>

        <StaffAccessManager />
      </div>
    </div>
  );
}

