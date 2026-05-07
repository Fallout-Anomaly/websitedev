'use client';

import Link from "next/link";
import React, { type ReactNode, useState } from "react";




type DocsPageShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  slug: string;
};


export default function DocsPageShell({ title, subtitle, children, slug }: DocsPageShellProps) {
  const [showNotice, setShowNotice] = useState(true);
  const needsNotice = slug === 'requirements' || slug === 'setup' || slug === 'launching';

  return (
    <div className="flex min-h-screen bg-black text-[#e3e3e3] font-sans selection:bg-emerald-500/30">


      {/* Global Notice Modal */}
      {needsNotice && showNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full border-2 border-emerald-500 bg-[#0a0a0a] shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-in fade-in zoom-in duration-300">
            <div className="border-b-2 border-emerald-500/30 bg-[#111] p-4 flex items-center gap-3">
              <span className="text-xl">🚧</span>
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white">Launcher Patch in Progress</h4>
            </div>
            <div className="p-8 text-center">
              <p className="text-gray-300 leading-relaxed mb-8">
                Our custom launcher is currently being patched for the latest version. For the time being, please use the 
                <span className="block mt-4 font-black text-emerald-500 text-lg uppercase tracking-wider italic">
                  Launch Fallen World
                </span> 
                button directly in <span className="font-bold text-white underline">Mod Organizer 2</span>.
              </p>
              <button 
                onClick={() => setShowNotice(false)}
                className="w-full rounded border-2 border-emerald-500 bg-emerald-500 py-3 text-sm font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-transparent hover:text-emerald-500 active:scale-95"
              >
                Understood (OK)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="fixed bottom-0 top-16 hidden w-[300px] overflow-y-auto border-r border-[#2e2e2e] bg-[#1b1b1d] lg:block">
        <div className="p-4">
          {/* Search Bar Mock */}
          <div className="mb-6 group">
            <div className="flex items-center gap-2 rounded-md border border-[#3e3e3e] bg-[#2e2e2e] px-3 py-1.5 text-xs text-gray-400 group-hover:border-emerald-500/50 transition-colors cursor-text">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <span>Search...</span>
              <span className="ml-auto rounded bg-[#1b1b1d] px-1.5 py-0.5 text-[10px]">Ctrl K</span>
            </div>
          </div>

          <nav className="space-y-1">
            <div className="text-[11px] font-bold text-gray-500 px-3 py-2 uppercase tracking-widest opacity-50">Main Guide</div>
            <Link href="/guide" className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${slug === 'intro' || slug === 'guide' ? 'bg-emerald-500/10 text-emerald-500 font-bold' : 'hover:bg-[#2e2e2e] text-gray-300'}`}>Intro</Link>
            <Link href="/requirements" className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${slug === 'requirements' ? 'bg-emerald-500/10 text-emerald-500 font-bold' : 'hover:bg-[#2e2e2e] text-gray-300'}`}>Requirements & setup</Link>
            <Link href="/launching" className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${slug === 'launching' ? 'bg-emerald-500/10 text-emerald-500 font-bold' : 'hover:bg-[#2e2e2e] text-gray-300'}`}>Launching</Link>
            <Link href="/faq" className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${slug === 'faq' || slug.startsWith('faq/') ? 'bg-emerald-500/10 text-emerald-500 font-bold' : 'hover:bg-[#2e2e2e] text-gray-300'}`}>FAQ & troubleshooting</Link>
            
            <div className="pt-6 text-[11px] font-bold text-gray-500 px-3 py-2 uppercase tracking-widest opacity-50">Gameplay guide</div>
            <Link href="/gameplay" className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${slug === 'gameplay' ? 'bg-emerald-500/10 text-emerald-500 font-bold' : 'hover:bg-[#2e2e2e] text-gray-300'}`}>Gameplay overview</Link>
            <Link href="/gameplay/survival" className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${slug === 'gameplay/survival' ? 'bg-emerald-500/10 text-emerald-500 font-bold' : 'hover:bg-[#2e2e2e] text-gray-300'}`}>Survival mechanics</Link>
            <Link href="/gameplay/combat" className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${slug === 'gameplay/combat' ? 'bg-emerald-500/10 text-emerald-500 font-bold' : 'hover:bg-[#2e2e2e] text-gray-300'}`}>Combat systems</Link>
            
            <div className="pt-6 text-[11px] font-bold text-gray-500 px-3 py-2 uppercase tracking-widest opacity-50">Community</div>
            <Link href="/donations" className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${slug === 'donations' ? 'bg-emerald-500/10 text-emerald-500 font-bold' : 'hover:bg-[#2e2e2e] text-gray-300'}`}>Donate</Link>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-[300px] lg:mr-[280px] bg-black min-h-screen">
        <div className="mx-auto max-w-4xl px-8 py-10 lg:px-16">


          {/* Breadcrumbs */}

          <nav className="mb-8 flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-emerald-500 transition-colors">Home</Link>
            <span>›</span>
            <span className="text-gray-400">Docs</span>
            <span>›</span>
            <span className="text-emerald-500 font-semibold capitalize">{slug.replace(/[\/-]/g, ' ')}</span>
          </nav>

          <article>
            <h1 className="mb-10 text-[2.8rem] font-black tracking-tight text-white leading-tight">{title}</h1>
            <div className="markdown-content">{children}</div>
          </article>

          {/* Footer Nav */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-[#2e2e2e] pt-10">
            <Link href="#" className="group rounded-xl border border-[#2e2e2e] p-5 transition-colors hover:border-emerald-500">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Previous</div>
              <div className="text-sm font-bold text-emerald-500 group-hover:text-emerald-400 transition-colors">Introduction</div>
            </Link>
            <Link href="#" className="group rounded-xl border border-[#2e2e2e] p-5 text-right transition-colors hover:border-emerald-500">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Next</div>
              <div className="text-sm font-bold text-emerald-500 group-hover:text-emerald-400 transition-colors">Requirements & Setup</div>
            </Link>
          </div>
        </div>
      </main>

      {/* TOC - Desktop */}
      <aside className="fixed bottom-0 right-0 top-16 hidden w-[280px] overflow-y-auto p-10 lg:block border-l border-[#2e2e2e]">
        <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 opacity-60">On this page</h4>
        <nav className="space-y-4 text-xs font-medium text-gray-400">
          <a href="#" className="block hover:text-emerald-500 transition-colors pl-0 border-l-2 border-emerald-500 text-emerald-500 px-3">What makes Fallen World unique?</a>
          <a href="#" className="block hover:text-emerald-500 transition-colors px-3">The Pillars of Anomaly</a>
          <a href="#" className="block hover:text-emerald-500 transition-colors px-3 pl-6 opacity-80">Survival & Realism</a>
          <a href="#" className="block hover:text-emerald-500 transition-colors px-3 pl-6 opacity-80">Combat & Ballistics</a>
        </nav>
      </aside>
    </div>
  );
}