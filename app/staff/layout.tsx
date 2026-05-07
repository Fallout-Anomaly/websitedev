import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canViewStaffAuditLog } from "@/src/lib/staff-audit-admin";
import { displayNameForUser } from "@/src/lib/display-name";
import { avatarPresetForUser } from "@/src/lib/profile-avatar";
import { isStaffAccount } from "@/src/lib/staff-access";
import StaffWorkspaceShell from "@/src/components/staff/StaffWorkspaceShell";
import { getStaffNavCounts } from "./queries";

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

  const navCounts = await getStaffNavCounts();
  const canAudit = await canViewStaffAuditLog(supabase, user);

  return (
    <StaffWorkspaceShell
      userId={user.id}
      displayName={displayNameForUser(user)}
      avatarPreset={avatarPresetForUser(user)}
      canViewAuditLog={canAudit}
      navCounts={navCounts}
    >
      {children}
    </StaffWorkspaceShell>
  );
}
