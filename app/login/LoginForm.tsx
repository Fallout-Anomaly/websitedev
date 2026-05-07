"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isStaffJwtMetadata } from "@/src/lib/staff-access";

type LoginFormProps = {
  nextPath: string;
  /** When true, only staff_members / JWT staff may complete sign-in (default staff portal). */
  requireStaffPortal: boolean;
};

export default function LoginForm({
  nextPath,
  requireStaffPortal,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithDiscord() {
    setMessage("");
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        nextPath,
      )}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo },
      });
      if (error) setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
        return;
      }

      const u = data.user;
      if (!u) {
        setMessage("Sign-in did not return a user.");
        return;
      }
      if (requireStaffPortal) {
        const { data: member, error: memberErr } = await supabase
          .from("staff_members")
          .select("user_id")
          .eq("user_id", u.id)
          .maybeSingle();
        if (memberErr) {
          await supabase.auth.signOut();
          setMessage(
            `Could not verify staff access: ${memberErr.message}. Apply the database migration that creates public.staff_members.`
          );
          return;
        }
        const allowed = isStaffJwtMetadata(u) || member != null;
        if (!allowed) {
          await supabase.auth.signOut();
          setMessage(
            "This account is not in the staff list. An admin must add your user in Supabase (staff_members) or set staff on your JWT app metadata."
          );
          return;
        }
      }

      router.push(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-16">
        <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
          <h1 className="text-2xl font-bold tracking-tight">
            {requireStaffPortal ? "Staff Access" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {requireStaffPortal
              ? "Sign in with your assigned staff account."
              : "Sign in to manage your account and profile."}
          </p>

          <button
            type="button"
            onClick={() => void signInWithDiscord()}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue with Discord
          </button>
          <img
            src="/img/discordlogo.png"
            alt="Discord"
            className="mx-auto mt-3 h-10 w-auto opacity-95"
            loading="lazy"
          />

          <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
            <div className="h-px flex-1 bg-slate-800" />
            <span>or</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm text-slate-300">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-emerald-500 transition focus:ring"
                placeholder="staff@yourdomain.com"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-slate-300">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-emerald-500 transition focus:ring"
                placeholder="At least 8 characters"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>

          {message ? (
            <p className="mt-4 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              {message}
            </p>
          ) : null}

          <p className="mt-6 text-center text-sm text-slate-400">
            <Link
              href="/auth/forgot-password"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Forgot password?
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-emerald-400 hover:text-emerald-300">
              Sign up
            </Link>
          </p>

          <Link href="/" className="mt-4 block text-center text-sm text-slate-500 hover:text-slate-400">
            ← Back home
          </Link>
        </section>
      </div>
    </main>
  );
}
