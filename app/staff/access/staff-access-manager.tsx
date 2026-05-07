"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Mail,
  MoreVertical,
  RefreshCw,
  Trash2,
  User,
  UserPlus,
  Users,
} from "lucide-react";

function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "Hidden";
  const name = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const maskedName =
    name.length <= 2 ? `${name[0] ?? "*"}*` : `${name.slice(0, 2)}***`;
  const dParts = domain.split(".");
  const root = dParts[0] ?? "";
  const tld = dParts.length > 1 ? `.${dParts[dParts.length - 1]}` : "";
  const maskedRoot = root.length <= 1 ? "*" : `${root[0]}***`;
  return `${maskedName}@${maskedRoot}${tld}`;
}

function supabaseProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  const m = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return m?.[1] ?? null;
}

function supabaseUserDashboardUrl(userId: string): string | null {
  const ref = supabaseProjectRef();
  if (!ref) return null;
  return `https://supabase.com/dashboard/project/${ref}/auth/users/${userId}`;
}

function displayLabelFromMetadata(
  meta: AccountRow["userMetadata"] | null | undefined,
): string {
  const displayName = (meta?.display_name ?? "").trim();
  if (displayName) return displayName;
  const fullName = (meta?.full_name ?? "").trim();
  if (fullName) return fullName;
  const userName = (meta?.user_name ?? "").trim();
  if (userName) return userName;
  return "Anonymous Member";
}

type StaffMemberRow = {
  userId: string;
  email: string | null;
  createdAt: string | null;
  userMetadata: {
    display_name?: string | null;
    full_name?: string | null;
    user_name?: string | null;
  } | null;
};

type AccountRow = {
  userId: string;
  email: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  userMetadata: {
    display_name?: string | null;
    full_name?: string | null;
    user_name?: string | null;
  } | null;
};

type Feedback = { type: "success" | "error"; message: string };

type Metrics = {
  totalPlatformUsers: number;
  liveSessions: number;
  verificationQueue: number;
  cached?: boolean;
};

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm transition-colors hover:border-zinc-700">
      <p className="mb-1 text-[10px] font-black uppercase tracking-tight text-zinc-500 transition-colors group-hover:text-zinc-400">
        {label}
      </p>
      <p className="text-3xl font-black text-zinc-100">{value}</p>
      <div className="mt-2 flex items-center gap-1.5">
        <div className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
        <p className="text-[11px] font-medium italic text-zinc-500">{trend}</p>
      </div>
    </div>
  );
}

export default function StaffAccessManager() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [items, setItems] = useState<StaffMemberRow[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [accountsPage, setAccountsPage] = useState(1);
  const [accountsHasMore, setAccountsHasMore] = useState(false);
  const [accountsQuery, setAccountsQuery] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [presenceCount, setPresenceCount] = useState(0);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/access", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; items?: StaffMemberRow[]; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load staff list.");
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError((e as Error)?.message ?? "Failed to load staff list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function loadMetrics() {
    setMetricsLoading(true);
    try {
      const res = await fetch("/api/staff/metrics", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as Metrics | { error?: string } | null;
      if (!res.ok || !data || "error" in data) return;
      setMetrics(data as Metrics);
    } finally {
      setMetricsLoading(false);
    }
  }

  useEffect(() => {
    void loadMetrics();
    const t = window.setInterval(() => void loadMetrics(), 30_000);
    return () => window.clearInterval(t);
  }, []);

  async function loadAccounts(page: number) {
    setLoadingAccounts(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/access?users=1&page=${page}&perPage=200`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            accounts?: AccountRow[];
            page?: number;
            hasMore?: boolean;
            error?: string;
          }
        | null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load accounts.");
      }
      setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
      setAccountsPage(typeof data.page === "number" ? data.page : page);
      setAccountsHasMore(Boolean(data.hasMore));
    } catch (e) {
      setError((e as Error)?.message ?? "Failed to load accounts.");
    } finally {
      setLoadingAccounts(false);
    }
  }

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const normalizedAccountsQuery = useMemo(
    () => accountsQuery.trim().toLowerCase(),
    [accountsQuery],
  );
  const filteredAccounts = useMemo(() => {
    if (!normalizedAccountsQuery) return accounts;
    return accounts.filter((a) => {
      const em = (a.email ?? "").toLowerCase();
      return em.includes(normalizedAccountsQuery) || a.userId.includes(normalizedAccountsQuery);
    });
  }, [accounts, normalizedAccountsQuery]);

  const [staffQuery, setStaffQuery] = useState("");
  const normalizedStaffQuery = useMemo(() => staffQuery.trim().toLowerCase(), [staffQuery]);
  const filteredStaff = useMemo(() => {
    if (!normalizedStaffQuery) return items;
    return items.filter((m) => {
      const label = displayLabelFromMetadata(m.userMetadata);
      const em = (m.email ?? "").toLowerCase();
      return (
        label.toLowerCase().includes(normalizedStaffQuery) ||
        em.includes(normalizedStaffQuery)
      );
    });
  }, [items, normalizedStaffQuery]);

  const staffEmailSet = useMemo(() => {
    const set = new Set<string>();
    for (const m of items) {
      if (m.email) set.add(m.email.toLowerCase());
    }
    return set;
  }, [items]);

  useEffect(() => {
    // Live sessions: Supabase Presence on "online_users".
    const channel = supabase.channel("online_users", {
      config: { presence: { key: "staff-access" } },
    });

    const recompute = () => {
      const state = channel.presenceState() as Record<string, unknown[]>;
      const count = Object.values(state).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
        0,
      );
      setPresenceCount(count);
    };

    channel.on("presence", { event: "sync" }, recompute);
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ at: new Date().toISOString() });
        recompute();
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function mutate(action: "add" | "remove", targetEmail: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: targetEmail }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Request failed.");
      }
      await load();
      setEmail("");
      setFeedback({
        type: "success",
        message:
          action === "add"
            ? `Staff access granted to ${targetEmail}.`
            : `Staff access revoked for ${targetEmail}.`,
      });
      window.setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      const msg = (e as Error)?.message ?? "Request failed.";
      setError(msg);
      setFeedback({ type: "error", message: msg });
      window.setTimeout(() => setFeedback(null), 4000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            void load();
            void loadMetrics();
          }}
          disabled={loading || busy}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:text-zinc-100 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sync Data
        </button>
        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}
      </div>

      {/* Add Staff Section */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <UserPlus size={16} className="text-emerald-500" />
          Provision New Access
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!normalizedEmail) return;
            void mutate("add", normalizedEmail);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="group relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-emerald-400" />
            <input
              type="email"
              placeholder="Enter staff email address..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-zinc-200 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </div>
          <button
            type="submit"
            disabled={busy || normalizedEmail.length < 3}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-2 text-sm font-bold text-black shadow-lg shadow-emerald-500/10 transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <UserPlus size={16} />
            )}
            Add Member
          </button>
        </form>

        {feedback ? (
          <div
            className={[
              "mt-4 flex items-center gap-3 rounded-xl border p-3 text-sm",
              feedback.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/20 bg-red-500/10 text-red-400",
            ].join(" ")}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {feedback.message}
          </div>
        ) : null}
      </div>

      {/* Staff List Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 border-b border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold">Active Members</h2>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
              {items.length} STAFF
            </span>
          </div>
          <div className="relative">
            <Users
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Filter members..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 pl-9 pr-3 text-xs text-zinc-300 transition-all focus:border-emerald-500/50 focus:outline-none sm:w-64"
              value={staffQuery}
              onChange={(e) => setStaffQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-[900px] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/20 text-[11px] uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Staff Identity</th>
                <th className="px-6 py-4 text-right font-semibold">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <Users size={32} className="mb-3 opacity-20" />
                      <p className="text-sm">
                        {loading ? "Loading staff members…" : "No staff members assigned."}
                      </p>
                      <p className="text-xs opacity-60">
                        Add an email address above to grant access.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const nameLabel = displayLabelFromMetadata(staff.userMetadata);
                  const initials = nameLabel
                    .split(" ")
                    .map((p) => p.trim()[0] ?? "")
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "");
                  const dashUrl = supabaseUserDashboardUrl(staff.userId);
                  return (
                    <tr
                      key={staff.userId}
                      className="group h-[60px] transition-colors hover:bg-zinc-800/30"
                    >
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-800 text-xs font-bold text-zinc-400 transition-all group-hover:bg-emerald-500 group-hover:text-black">
                            {initials || <User size={16} />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-100">{nameLabel}</p>
                            <p className="text-[10px] uppercase text-zinc-500">
                              Granted{" "}
                              {staff.createdAt
                                ? new Date(staff.createdAt).toISOString().slice(0, 10)
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                          {dashUrl ? (
                            <a
                              href={dashUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-1.5 text-xs font-bold text-red-400 transition-all hover:bg-red-500 hover:text-white"
                            >
                              Ban member
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void mutate("remove", staff.email ?? "")}
                            disabled={busy || !staff.email}
                            className="flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-1.5 text-xs font-bold text-red-500 opacity-100 transition-all hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-500">
          <p>Total: {filteredStaff.length} records</p>
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded-lg p-1.5 transition-colors hover:bg-zinc-800 disabled:opacity-30"
              disabled
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            >
              1
            </button>
            <button
              type="button"
              className="rounded-lg p-1.5 transition-colors hover:bg-zinc-800 disabled:opacity-30"
              disabled
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Network Metrics + Auth bridge */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
          <Activity size={16} />
          Network Metrics
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            label="Total Platform Users"
            value={
              metricsLoading && !metrics ? "…" : String(metrics?.totalPlatformUsers ?? 0)
            }
            trend={metrics ? (metrics.cached ? "Cached (≤30s)" : "Live") : "Awaiting data..."}
          />
          <StatCard
            label="Live Sessions"
            value={String(presenceCount)}
            trend="Supabase Presence (online_users)"
          />
          <StatCard
            label="Verification Queue"
            value={
              metricsLoading && !metrics ? "…" : String(metrics?.verificationQueue ?? 0)
            }
            trend={(metrics?.verificationQueue ?? 0) === 0 ? "All clear" : "Needs review"}
          />
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950 py-12 text-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-600 shadow-inner">
            <Fingerprint size={28} />
          </div>
          <h3 className="mb-2 text-lg font-bold text-zinc-400">Supabase Auth Bridge</h3>
          <p className="mb-6 max-w-sm text-sm text-zinc-500">
            Load registered accounts (Supabase Auth users) to quickly grant staff access.
          </p>

          <div className="grid w-full max-w-[1200px] grid-cols-1 gap-[15px] px-6">
            <div className="flex items-center gap-2">
              <input
                value={accountsQuery}
                onChange={(e) => setAccountsQuery(e.target.value)}
                placeholder="Filter loaded accounts…"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none transition-all focus:border-emerald-500/50"
              />
              <button
                type="button"
                onClick={() => void loadAccounts(1)}
                disabled={loadingAccounts || busy}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-300 transition-all hover:bg-zinc-800 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loadingAccounts ? "animate-spin" : ""} />
                Connect
              </button>
            </div>

            {filteredAccounts.length > 0 ? (
              <div className="h-[600px] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 text-left">
                <div className="h-full divide-y divide-zinc-800/50 overflow-auto">
                  {filteredAccounts.map((a) => {
                    const alreadyStaff =
                      a.email && staffEmailSet.has(a.email.toLowerCase());
                    const dashUrl = supabaseUserDashboardUrl(a.userId);
                    const label = displayLabelFromMetadata(a.userMetadata);
                    return (
                      <div key={a.userId} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-zinc-100">
                            {label}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-zinc-500">
                            {a.email ? maskEmail(a.email) : "Hidden"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {dashUrl ? (
                            <a
                              href={dashUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] font-bold text-zinc-300 transition-all hover:bg-zinc-800"
                            >
                              Ban member
                            </a>
                          ) : null}
                          {alreadyStaff ? (
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                              STAFF
                            </span>
                          ) : a.email ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void mutate("add", a.email ?? "")}
                              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 transition-all hover:bg-emerald-500/15 disabled:opacity-50"
                            >
                              <UserPlus size={14} />
                              Grant
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
                  <span>Page {accountsPage}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void loadAccounts(Math.max(1, accountsPage - 1))}
                      disabled={loadingAccounts || busy || accountsPage <= 1}
                      className="rounded-lg px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadAccounts(accountsPage + 1)}
                      disabled={loadingAccounts || busy || !accountsHasMore}
                      className="rounded-lg px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            ) : loadingAccounts ? (
              <p className="text-xs text-zinc-500">Loading accounts…</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

