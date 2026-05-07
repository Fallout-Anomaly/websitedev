import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import HeroCarousel from '@/src/components/HeroCarousel';
import BootSequence from '@/src/components/BootSequence';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-black text-[#e3e3e3] font-sans selection:bg-emerald-500/30">
      <BootSequence />

      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden border-b border-[#2e2e2e]">
        <HeroCarousel />
        
        <div className="absolute bottom-0 left-0 w-full p-8 lg:p-16 z-10">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-6xl font-black italic tracking-tighter uppercase sm:text-8xl lg:text-9xl text-white leading-[0.8] mb-4">
              Fallen <span className="text-emerald-500">World</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg font-bold leading-relaxed text-gray-200 sm:text-2xl drop-shadow-lg">
              The ultimate hardcore survival experience for Fallout 4. Built on realism, risk, and unrelenting consequence.
            </p>
            
            <div className="mt-10 flex flex-wrap gap-5">
              <Link href="/guide" className="rounded border-2 border-emerald-500 bg-emerald-500 px-10 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-transparent hover:text-emerald-500">
                Installation Guide
              </Link>
              <a href="https://discord.gg/aCa75Y3kX9" target="_blank" rel="noopener noreferrer" className="rounded border-2 border-[#2e2e2e] bg-black/50 backdrop-blur-md px-10 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-[#2e2e2e]">
                Join Discord
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-6xl px-8 py-24 lg:py-32">
        <div className="grid gap-20 lg:grid-cols-12">
          {/* Left Column: Story */}
          <div className="lg:col-span-7">
            <h2 className="text-4xl font-bold text-white uppercase tracking-tight mb-8 border-b border-[#2e2e2e] pb-4 italic">
              Survival is a <span className="text-emerald-500">Choice</span>
            </h2>
            <div className="space-y-8 text-xl leading-relaxed text-gray-400">
              <p>
                Most games treat survival as a meter to fill. In <span className="text-white font-bold">Fallen World</span>, survival is a constant calculation. Every bullet fired is a trade-off. Every injury is a story.
              </p>
              <p>
                We didn't just add harder enemies; we redesigned the fundamental relationship between the player and the wasteland. From caliber-based ballistics to a realistic medical system where you must manage trauma, bandages, and surgery.
              </p>
              
              <div className="grid grid-cols-2 gap-8 pt-8">
                <div>
                  <div className="text-3xl font-black text-emerald-500 mb-1">100k+</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Downloads</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-emerald-500 mb-1">600+</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Hand-picked Mods</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Features */}
          <div className="lg:col-span-5 space-y-12">
            <div className="border-2 border-[#2e2e2e] bg-[#1a1a1a] shadow-2xl">
              <div className="border-b-2 border-[#2e2e2e] bg-[#222] py-4 text-center">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Tactical Foundation</span>
              </div>
              <div className="p-8 space-y-8">
                {[
                  { title: "MAIM System", desc: "True trauma management. Injuries require specific surgical intervention." },
                  { title: "Ballistic Realism", desc: "Damage determined by caliber and hit location, not level stats." },
                  { title: "Advanced Needs", desc: "Comprehensive hunger, thirst, and fatigue systems." },
                  { title: "Munitions", desc: "Realistic ammunition overhaul with lore-friendly calibers." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="flex-shrink-0 mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>


          </div>
        </div>

        {/* Community Resources */}
        <div className="mt-40">
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight mb-12 border-b border-[#2e2e2e] pb-6 italic">
            Essential <span className="text-emerald-500">Resources</span>
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Nexus Mods", href: "https://www.nexusmods.com/fallout4/mods/74075", desc: "Official project page, endorsements, and community feedback." },
              { title: "Load Order Library", href: "https://loadorderlibrary.com/lists/fallout-anomaly-0-5", desc: "The technical breakdown of every plugin and asset in the list." },
              { title: "Community Portal", href: "#", desc: "A dedicated hub for the Fallen World community—coming soon." }
            ].map((link, i) => (
              <Link 
                key={i} 
                href={link.href} 
                target={link.href.startsWith('http') ? "_blank" : "_self"}
                rel={link.href.startsWith('http') ? "noopener noreferrer" : ""}
                className="group border-2 border-[#2e2e2e] bg-[#111] p-8 transition-all hover:border-emerald-500 hover:bg-[#1a1a1a]"
              >

                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] group-hover:text-emerald-500 transition-colors">{link.title}</h4>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <footer className="py-16 border-t border-[#2e2e2e] bg-[#050505]">
        <div className="container mx-auto px-8 flex flex-col items-center gap-6">
          <div className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-700">
            Fallen World &copy; 2026
          </div>
          <div className="flex gap-8">
            <a href="https://discord.gg/aCa75Y3kX9" className="text-xs font-bold text-gray-600 hover:text-white transition-colors">Discord</a>
            <a href="https://www.youtube.com/@FalloutAnomaly" className="text-xs font-bold text-gray-600 hover:text-white transition-colors">YouTube</a>
            <a href="https://www.nexusmods.com/fallout4/mods/74075" className="text-xs font-bold text-gray-600 hover:text-white transition-colors">Nexus</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

