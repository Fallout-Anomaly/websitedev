import Link from "next/link";

const positions = [
  {
    title: "STAFF TEAM",
    icon: "👥",
    description: "Join our core team that handles administration, community management, and moderation duties. Help guide the direction of the project and ensure our community thrives in the wasteland.",
    requirements: [
      "Previous community management experience",
      "Excellent communication skills",
      "Knowledge of Fallout universe",
      "Minimum age: 18 years",
      "Ability to commit few hours weekly"
    ],
    link: "https://falloutanomaly.fillout.com/t/2AtB7oLx53us"
  },
  {
    title: "DEVELOPMENT TEAM",
    icon: "💻",
    description: "Put your coding and technical skills to work building the foundations of our post-apocalyptic world. Work on game mechanics, systems, and help create unique anomalies in the wasteland.",
    requirements: [
      "Experience with C++, Papyrus, or scripting",
      "Understanding of Fallout engine",
      "Previous modding experience preferred",
      "Strong problem-solving abilities",
      "Ability to work collaboratively"
    ],
    link: "https://falloutanomaly.fillout.com/t/9aoaJRChuAus"
  },
  {
    title: "MEDIA TEAM",
    icon: "🎨",
    description: "Bring the wasteland to life through visual design, sound, or storytelling. Create assets, clips, or promotional content—any level of experience welcome. We're looking for more hands to help.",
    requirements: [
      "Interest in video, art, or content creation",
      "Willingness to learn and contribute when you can",
      "Samples or portfolio welcome but not required",
      "Passion for Fallout or our modlist"
    ],
    link: "https://falloutanomaly.fillout.com/t/ijG6L7CkVcus"
  },
  {
    title: "BETA TESTING TEAM",
    icon: "🐛",
    description: "Be among the first to experience new features and content. Help identify issues and provide valuable feedback to ensure the best possible experience in the wasteland for all survivors.",
    requirements: [
      "Passion for Fallout series",
      "Attention to detail",
      "Ability to provide constructive feedback",
      "Reliable gaming system that meets requirements",
      "Available for scheduled test sessions"
    ],
    link: "https://falloutanomaly.fillout.com/t/gVdsPTpxc3us"
  }
];

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-black text-[#e3e3e3] font-sans selection:bg-emerald-500/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#2e2e2e] bg-[#0a0a0a] py-24 lg:py-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)]" />
        </div>
        
        <div className="container relative z-10 mx-auto px-6 text-center">
          <h1 className="text-5xl font-black italic tracking-tighter uppercase sm:text-7xl lg:text-8xl text-white">
            Join Our <span className="text-emerald-500">Team</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-bold text-gray-400">
            Help shape Fallen World. We are looking for reliable people who want to build, test, and support the community.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/" className="rounded border-2 border-[#2e2e2e] bg-[#1a1a1a] px-8 py-3 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#2e2e2e]">
              Back Home
            </Link>
            <a href="https://discord.gg/aCa75Y3kX9" target="_blank" rel="noopener noreferrer" className="rounded border-2 border-emerald-500 bg-emerald-500 px-8 py-3 text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-transparent hover:text-emerald-500">
              Join Discord
            </a>
          </div>
        </div>
      </section>

      {/* Content Area */}
      <div className="mx-auto max-w-6xl px-6 py-20">
        {/* Recruitment Process */}
        <div className="mb-24">
          <div className="border-2 border-[#2e2e2e] bg-[#1a1a1a]">
            <div className="border-b-2 border-[#2e2e2e] bg-[#222] py-4 px-6">
              <span className="text-sm font-black uppercase tracking-[0.2em] text-white italic">How recruitment works</span>
            </div>
            <div className="p-8 grid gap-8 md:grid-cols-3">
              {[
                { step: "1. Pick a role", desc: "Choose the team that fits your skills and interests." },
                { step: "2. Submit the form", desc: "Tell us about your experience and availability." },
                { step: "3. Chat on Discord", desc: "We will reach out to you for a quick follow-up." }
              ].map((item, i) => (
                <div key={i} className="space-y-3">
                  <h3 className="text-lg font-bold text-emerald-500 uppercase italic tracking-tight">{item.step}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Positions Grid */}
        <div className="space-y-12">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white border-b border-[#2e2e2e] pb-4">
            Available <span className="text-emerald-500">Positions</span>
          </h2>
          
          <div className="grid gap-8 md:grid-cols-2">
            {positions.map((pos, i) => (
              <div key={i} className="flex flex-col border-2 border-[#2e2e2e] bg-[#0a0a0a] transition-colors hover:border-emerald-500/50">
                <div className="border-b-2 border-[#2e2e2e] bg-[#111] p-6 flex items-center justify-between">
                  <h3 className="text-xl font-black italic uppercase text-white">{pos.title}</h3>
                  <span className="text-2xl">{pos.icon}</span>
                </div>
                <div className="p-8 flex-grow flex flex-col">
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">{pos.description}</p>
                  
                  <div className="mb-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4">Requirements</h4>
                    <ul className="space-y-2">
                      {pos.requirements.map((req, j) => (
                        <li key={j} className="flex items-start gap-3 text-xs text-gray-300">
                          <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a 
                    href={pos.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-auto block w-full rounded border-2 border-emerald-500 py-3 text-center text-xs font-black uppercase tracking-widest text-emerald-500 transition-all hover:bg-emerald-500 hover:text-black"
                  >
                    Join This Team
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="py-16 border-t border-[#2e2e2e] bg-[#050505] text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700">
          Fallen World &copy; 2026
        </div>
      </footer>
    </div>
  );
}
