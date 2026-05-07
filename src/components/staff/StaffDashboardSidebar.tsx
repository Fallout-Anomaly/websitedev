"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/staff/actions";
import ProfileAvatar from "@/src/components/ProfileAvatar";
import type { ProfileAvatarPresetId } from "@/src/lib/profile-avatar";
import type { StaffNavCounts } from "./StaffWorkspaceShell";

const NAV_BASE = [
  {
    href: "/staff",
    label: "Overview",
    description: "Dashboard & shortcuts",
    match: (p: string) => p === "/staff",
    countKey: null as keyof StaffNavCounts | null,
  },
  {
    href: "/staff/roadmap",
    label: "Roadmap",
    description: "Public roadmap board",
    match: (p: string) => p.startsWith("/staff/roadmap"),
    countKey: null as keyof StaffNavCounts | null,
  },
  {
    href: "/staff/modlist",
    label: "Mod registry",
    description: "Search & filter package",
    match: (p: string) => p.startsWith("/staff/modlist"),
    countKey: "mods" as const,
  },
  {
    href: "/staff/bugs",
    label: "Bug tracker",
    description: "Issues & discussion",
    match: (p: string) => p.startsWith("/staff/bugs"),
    countKey: "bugsOpen" as const,
    countSuffix: (c: StaffNavCounts) =>
      c.bugsClosed > 0 ? ` · ${c.bugsClosed} closed` : "",
  },
  {
    href: "/staff/support-tickets",
    label: "Support tickets",
    description: "Public bug report form",
    match: (p: string) => p.startsWith("/staff/support-tickets"),
    countKey: "supportTicketsOpen" as const,
  },
  {
    href: "/staff/sheets",
    label: "Google Sheets",
    description: "Links, notes & comments",
    match: (p: string) =>
      p.startsWith("/staff/sheets") || p.startsWith("/staff/workbooks"),
    countKey: "sheets" as const,
  },
] as const;

const NAV_AUDIT = {
  href: "/staff/activity",
  label: "Activity",
  description: "Global staff audit trail",
  match: (p: string) => p.startsWith("/staff/activity"),
} as const;

type Props = {
  userId: string;
  displayName: string;
  avatarPreset: ProfileAvatarPresetId;
  canViewAuditLog: boolean;
  navCounts: StaffNavCounts;
};

function CountHint({
  countKey,
  navCounts,
  extra,
}: {
  countKey: keyof StaffNavCounts;
  navCounts: StaffNavCounts;
  extra?: string;
}) {
  const n = navCounts[countKey];
  return (
    <span className="ml-1.5 font-mono text-[10px] font-normal tabular-nums text-[#6e7681]">
      {n.toLocaleString()}
      {extra ?? ""}
    </span>
  );
}

export default function StaffDashboardSidebar({
  userId,
  displayName,
  avatarPreset,
  canViewAuditLog,
  navCounts,
}: Props) {
  const pathname = usePathname() || "";
  const navItems = canViewAuditLog ? [...NAV_BASE, NAV_AUDIT] : [...NAV_BASE];

  return (
    <aside className="flex min-h-0 flex-col gap-6 pb-8 lg:w-56 lg:shrink-0 lg:pb-0 lg:pr-8">
      <div className="flex-1">
        <p className="mb-2 text-xs font-medium text-[#8b949e]">Workspace</p>
        <nav className="flex flex-col" aria-label="Staff navigation">
          {navItems.map((item) => {
            const active = item.match(pathname);
            const countKey = "countKey" in item ? item.countKey : null;
            const suffix =
              "countSuffix" in item && item.countSuffix
                ? item.countSuffix(navCounts)
                : "";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group border-l-2 py-2.5 pl-3 text-sm transition-colors ${
                  active
                    ? "border-[#f78166] text-[#f0f6fc]"
                    : "border-transparent text-[#c9d1d9] hover:border-[#30363d] hover:text-[#f0f6fc]"
                }`}
              >
                <span className="font-medium">
                  {item.label}
                  {countKey ? (
                    <CountHint countKey={countKey} navCounts={navCounts} extra={suffix} />
                  ) : null}
                </span>
                <span
                  className={`mt-0.5 block text-xs leading-snug ${
                    active ? "text-[#8b949e]" : "text-[#6e7681] group-hover:text-[#8b949e]"
                  }`}
                >
                  {item.description}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4 border-t border-[#30363d] pt-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex min-w-0 items-center gap-2 text-[#8b949e]">
            <ProfileAvatar
              storedPreset={avatarPreset}
              seed={userId}
              label={displayName}
              size={28}
            />
            <span className="truncate" title="Signed in as">
              {displayName}
            </span>
          </span>
          <form action={signOut} className="shrink-0">
            <button
              type="submit"
              className="text-[#58a6ff] hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
        <Link
          href="/"
          className="text-sm text-[#58a6ff] hover:underline hover:decoration-[#58a6ff]"
        >
          ← Back to public site
        </Link>
      </div>
    </aside>
  );
}
