'use client';

import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { signOut } from '@/app/actions';
import { usePathname } from 'next/navigation';
import ProfileAvatar from '@/src/components/ProfileAvatar';
import type { ProfileAvatarPresetId } from '@/src/lib/profile-avatar';
import HeaderNotificationsBell from "@/src/components/HeaderNotificationsBell";

interface HeaderProps {
  user: User | null;
  isStaff: boolean;
  /** Public label; never an email address. */
  displayName: string;
  avatarPreset: ProfileAvatarPresetId;
}

export default function Header({ user, isStaff, displayName, avatarPreset }: HeaderProps) {
  const pathname = usePathname();
  const isStaffPage = pathname?.startsWith('/staff');
  const showStaffPortal = isStaff;

  return (

    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#031516]/90 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        {/* Left: Logo & Title */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02] active:scale-95">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-shadow group-hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-7 h-7 animate-[spin_10s_linear_infinite] fill-black">
                <circle cx="50" cy="50" r="12" />
                <path d="M50 50 L50 14 A36 36 0 0 1 81.2 35.8 L50 50 Z" />
                <path d="M50 50 L18.8 64.2 A36 36 0 0 1 18.8 35.8 L50 50 Z" />
                <path d="M50 50 L81.2 64.2 A36 36 0 0 1 50 86 L50 50 Z" />
              </svg>
            </div>
            <span className="hidden sm:block text-xl font-black tracking-widest text-white uppercase italic select-none">
              Fallen World
            </span>
          </Link>
        </div>

        {/* Center: Navigation - Hide on Staff Pages */}
        {!isStaffPage && (
          <nav className="hidden min-w-0 justify-center md:flex md:items-center md:gap-6 lg:gap-10">
            {[
              { name: 'HOME', href: '/' },
              { name: 'JOIN OUR TEAM', href: '/apply' },
              { name: 'GUIDE', href: '/guide' },
              { name: 'ROADMAP', href: '/roadmap' },
              { name: 'REPORT BUG', href: '/support/bug-report' },
            ].map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs font-black tracking-[0.2em] text-gray-400 hover:text-white transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        )}

        {/* Right: Actions — min-w-0 so long names ellipsis instead of squeezing layout */}
        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          <div className="hidden h-6 w-px shrink-0 bg-white/10 sm:block" aria-hidden />

          <HeaderNotificationsBell userId={user?.id ?? null} isStaff={isStaff} />

          {showStaffPortal ? (
            <Link
              href="/staff"
              title="Staff portal"
              className="group flex shrink-0 items-center gap-1 rounded-md bg-[#10b981] px-2 py-1.5 text-[10px] font-black uppercase leading-none tracking-wide text-black transition-all duration-300 hover:bg-[#059669] hover:shadow-[0_0_16px_rgba(16,185,129,0.25)] active:scale-95 sm:gap-1.5 sm:px-2.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span className="hidden lg:inline">Staff portal</span>
              <span className="lg:hidden">Staff</span>
            </Link>
          ) : null}

          {user ? (
            <>
              <Link
                href="/account"
                className="flex min-w-0 max-w-[min(11rem,42vw)] items-center gap-2 text-[10px] font-black tracking-widest text-gray-400 hover:text-white transition-colors uppercase sm:max-w-[13rem]"
                title={`Account — ${displayName}`}
              >
                <ProfileAvatar
                  storedPreset={avatarPreset}
                  seed={user.id}
                  label={displayName}
                  size={26}
                />
                <span className="min-w-0 truncate">{displayName}</span>
              </Link>
              <form action={signOut} className="hidden shrink-0 sm:block">
                <button
                  type="submit"
                  className="text-[10px] font-black tracking-widest text-gray-500 hover:text-white transition-colors uppercase"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login?next=/account"
                className="text-[10px] font-black tracking-widest text-gray-400 hover:text-white transition-colors uppercase"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md border border-[#10b981]/40 bg-[#10b981]/10 px-2 py-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-300 transition-colors hover:bg-[#10b981]/20 hover:text-emerald-200"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
