"use server";

import { assertStaffSession } from "@/src/lib/assert-staff-session";
import type { SupabaseClient } from "@supabase/supabase-js";

function sanitizeSearchTerm(raw: string, maxLen: number = 120): string {
  // Supabase `.or()` uses a PostgREST filter string; keep this conservative to avoid
  // malformed filters and accidental broadening via special chars.
  const trimmed = String(raw ?? "").trim().slice(0, maxLen);
  // Allow alphanumerics plus a small safe set commonly used in titles/handles.
  return trimmed.replace(/[^a-zA-Z0-9 _.\-@]/g, " ").replace(/\s+/g, " ").trim();
}

function allowlistedModSort(sortBy: string): string {
  const key = String(sortBy ?? "").trim();
  const allowed = new Set([
    "load_order",
    "mod_name",
    "author",
    "status",
    "category",
    "updated_at",
    "created_at",
    "id",
  ]);
  return allowed.has(key) ? key : "load_order";
}

export async function searchModlist(
  page: number = 1,
  pageSize: number = 50,
  search: string = "",
  status: string = "",
  category: string = "",
  sortBy: string = "load_order",
  sortOrder: "asc" | "desc" = "desc"
) {
  try {
    const { supabase } = await assertStaffSession();

    let query = supabase
      .from("modlist_entries")
      .select(
        "id, load_order, mod_name, status, category, author, version, nexus_url, size_mb, esp_count, esm_count, esl_count, notes",
        { count: "exact" },
      );

    const safeSearch = sanitizeSearchTerm(search);
    if (safeSearch) {
      query = query.or(
        `mod_name.ilike.%${safeSearch}%,author.ilike.%${safeSearch}%,notes.ilike.%${safeSearch}%`,
      );
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const offset = (page - 1) * pageSize;
    const sortKey = allowlistedModSort(sortBy);
    query = query
      .order(sortKey, { ascending: sortOrder === "asc" })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Modlist search error:", error);
      return { data: [], error: error.message, total: 0 };
    }

    return { data: data || [], error: null, total: count || 0 };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return { data: [], error: msg, total: 0 };
  }
}

export async function getModlistFilters(): Promise<{ statuses: string[]; categories: string[] }> {
  try {
    const { supabase } = await assertStaffSession();

    const [statusRes, canonicalRes, legacyCategoryRes] = await Promise.all([
    supabase.from("modlist_entries").select("status"),
    supabase
      .from("modlist_categories")
      .select("name")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("modlist_entries").select("category"),
  ]);

  const statuses = [...new Set((statusRes.data || []).map((r: any) => r.status).filter(Boolean) as string[])].sort();

  let canonical: string[] = [];
  if (!canonicalRes.error && canonicalRes.data) {
    canonical = (canonicalRes.data as { name: string }[]).map((r) => r.name).filter(Boolean);
  }

  const fromEntries = [
    ...new Set(
      (legacyCategoryRes.data || []).map((r: any) => r.category).filter(Boolean) as string[]
    ),
  ];
  const seen = new Set(canonical);
    const extras = fromEntries.filter((c) => !seen.has(c)).sort();
    const categories = [...canonical, ...extras];

    return { statuses, categories };
  } catch {
    return { statuses: [], categories: [] };
  }
}

export async function searchBugReports(page: number = 1, pageSize: number = 20, search: string = "", status: string = "") {
  try {
    const { supabase } = await assertStaffSession();

    let query = supabase
      .from("bug_reports")
      .select(
        "id, date_reported, reported_by, mod_name, issue_description, severity, status, resolution_notes, comments",
        { count: "exact" },
      );

    const safeSearch = sanitizeSearchTerm(search);
    if (safeSearch) {
      query = query.or(
        `mod_name.ilike.%${safeSearch}%,issue_description.ilike.%${safeSearch}%,reported_by.ilike.%${safeSearch}%`,
      );
    }

    if (status === "Open") {
      query = query.neq("status", "Closed");
    } else if (status) {
      query = query.eq("status", status);
    }

    const offset = (page - 1) * pageSize;
    query = query
      .order("date_reported", { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Bug report search error:", error);
      return { data: [], error: error.message, total: 0 };
    }

    return { data: data || [], error: null, total: count || 0 };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return { data: [], error: msg, total: 0 };
  }
}

export async function getBugCounts(): Promise<{ open: number; closed: number }> {
  try {
    const { supabase } = await assertStaffSession();

    const [{ count: openCount }, { count: closedCount }] = await Promise.all([
      supabase
        .from("bug_reports")
        .select("id", { count: "exact", head: true })
        .neq("status", "Closed"),
      supabase
        .from("bug_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "Closed"),
    ]);

    return {
      open: openCount || 0,
      closed: closedCount || 0,
    };
  } catch {
    return { open: 0, closed: 0 };
  }
}

export async function getBugStatusOptions(): Promise<string[]> {
  try {
    const { supabase } = await assertStaffSession();

    const { data } = await supabase.from("bug_reports").select("status");

    const statuses = [...new Set((data || []).map((r: any) => r.status).filter(Boolean) as string[])].sort();

    return statuses;
  } catch {
    return [];
  }
}

export async function getStaffNavCounts(): Promise<{
  mods: number;
  bugsOpen: number;
  bugsClosed: number;
  supportTicketsOpen: number;
  sheets: number;
}> {
  try {
    const { supabase } = await assertStaffSession();
    return getStaffNavCountsWithSupabase(supabase);
  } catch {
    return {
      mods: 0,
      bugsOpen: 0,
      bugsClosed: 0,
      supportTicketsOpen: 0,
      sheets: 0,
    };
  }
}

export async function getStaffNavCountsWithSupabase(
  supabase: SupabaseClient,
): Promise<{
  mods: number;
  bugsOpen: number;
  bugsClosed: number;
  supportTicketsOpen: number;
  sheets: number;
}> {
  try {
    const [mods, openBugs, closedBugs, openSupportTickets, sheets] =
      await Promise.all([
        supabase.from("modlist_entries").select("id", { count: "exact", head: true }),
        supabase
          .from("bug_reports")
          .select("id", { count: "exact", head: true })
          .neq("status", "Closed"),
        supabase
          .from("bug_reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "Closed"),
        supabase
          .from("fallen_world_support_tickets")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
        supabase.from("staff_google_sheets").select("id", { count: "exact", head: true }),
      ]);

    return {
      mods: mods.count ?? 0,
      bugsOpen: openBugs.count ?? 0,
      bugsClosed: closedBugs.count ?? 0,
      supportTicketsOpen: openSupportTickets.error
        ? 0
        : openSupportTickets.count ?? 0,
      sheets: sheets.count ?? 0,
    };
  } catch {
    return {
      mods: 0,
      bugsOpen: 0,
      bugsClosed: 0,
      supportTicketsOpen: 0,
      sheets: 0,
    };
  }
}
