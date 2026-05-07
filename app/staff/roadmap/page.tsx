import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadRoadmapBoard } from "@/src/lib/roadmap";
import RoadmapEditorClient from "./roadmap-editor-client";

export default async function StaffRoadmapPage() {
  const supabase = await createClient();
  const board = await loadRoadmapBoard(supabase);

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-10">
      <div className="mx-4 mb-6 sm:mx-6 lg:mx-10">
        <nav className="mb-3 text-xs text-[#6e7681]">
          <Link href="/staff" className="text-[#8b949e] hover:text-[#f0f6fc]">
            Staff
          </Link>
          <span className="mx-2 text-[#30363d]">/</span>
          <span className="text-[#8b949e]">Roadmap</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-[#f0f6fc]">
          Roadmap editor
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8b949e]">
          This is the public roadmap board. Anyone can view it at{" "}
          <Link href="/roadmap" className="text-[#58a6ff] hover:underline">
            /roadmap
          </Link>
          , but only staff can edit.
        </p>
      </div>

      <div className="rounded-none bg-transparent px-4 py-2 sm:px-6 lg:px-10">
        <RoadmapEditorClient initialBoard={board} />
      </div>
    </div>
  );
}

