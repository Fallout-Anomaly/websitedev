import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProjectsClient from "./projects-client";

export default async function StaffProjectsPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: tasks }] = await Promise.all([
    supabase
      .from("staff_project_categories")
      .select("id, name, description, color, icon, position, archived, created_by, created_at, updated_at")
      .eq("archived", false)
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("staff_project_tasks")
      .select(
        "id, category_id, title, description_html, priority, status, sort_order, assigned_user_ids, due_date, labels, progress, checklist, external_url, thumbnail_url, created_by, created_at, updated_at",
      )
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-10">
      <div className="mx-4 mb-6 sm:mx-6 lg:mx-10">
        <nav className="mb-3 text-xs text-[#6e7681]" aria-label="Breadcrumb">
          <Link href="/staff" className="text-[#8b949e] hover:text-[#f0f6fc]">
            Staff
          </Link>
          <span className="mx-2 text-[#30363d]">/</span>
          <span className="text-[#8b949e]">Projects</span>
        </nav>

        <h1 className="text-2xl font-semibold tracking-tight text-[#f0f6fc]">
          Projects
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#8b949e]">
          Staff-only project boards inspired by GitHub Projects and Trello. Use
          categories as top-level filters, then move tasks across columns as work
          progresses.
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-10">
        <ProjectsClient
          initialCategories={(categories ?? []) as any}
          initialTasks={(tasks ?? []) as any}
        />
      </div>
    </div>
  );
}

