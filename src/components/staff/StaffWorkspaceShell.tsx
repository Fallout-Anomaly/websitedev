import type { ReactNode } from "react";
import type { ProfileAvatarPresetId } from "@/src/lib/profile-avatar";
import StaffDashboardSidebar from "./StaffDashboardSidebar";

export type StaffNavCounts = {
  mods: number;
  bugsOpen: number;
  bugsClosed: number;
  supportTicketsOpen: number;
  sheets: number;
};

type Props = {
  children: ReactNode;
  userId: string;
  displayName: string;
  avatarPreset: ProfileAvatarPresetId;
  canViewAuditLog: boolean;
  canManageStaffRoles: boolean;
  navCounts: StaffNavCounts;
};

export default function StaffWorkspaceShell({
  children,
  userId,
  displayName,
  avatarPreset,
  canViewAuditLog,
  canManageStaffRoles,
  navCounts,
}: Props) {
  return (
    <main className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <div className="mx-auto w-full max-w-none px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-8 border-b border-transparent lg:flex-row lg:gap-0 lg:border-b-0">
          <StaffDashboardSidebar
            userId={userId}
            displayName={displayName}
            avatarPreset={avatarPreset}
            canViewAuditLog={canViewAuditLog}
            canManageStaffRoles={canManageStaffRoles}
            navCounts={navCounts}
          />
          <div className="min-h-px min-w-0 flex-1 lg:border-l lg:border-[#21262d] lg:pl-10">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
