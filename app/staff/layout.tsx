import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canViewStaffAuditLog } from "@/src/lib/staff-audit-admin";
import { displayNameForUser } from "@/src/lib/display-name";
import { avatarPresetForUser } from "@/src/lib/profile-avatar";
import { isStaffAccount } from "@/src/lib/staff-access";
import { canManageStaffRoles } from "@/src/lib/staff-role-admin";
import StaffWorkspaceShell from "@/src/components/staff/StaffWorkspaceShell";
import { getStaffNavCountsWithSupabase } from "./queries";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!(await isStaffAccount(supabase, user))) {
    redirect("/");
  }

  const navCounts = await getStaffNavCountsWithSupabase(supabase);
  const canAudit = await canViewStaffAuditLog(supabase, user);
  const canManage = canManageStaffRoles(user);

  return (
    <StaffWorkspaceShell
      userId={user.id}
      displayName={displayNameForUser(user)}
      avatarPreset={avatarPresetForUser(user)}
      canViewAuditLog={canAudit}
      canManageStaffRoles={canManage}
      navCounts={navCounts}
    >
      {children}
    </StaffWorkspaceShell>
  );
}
