"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProfileAvatar, {
  ProfilePresetPickerImage,
} from "@/src/components/ProfileAvatar";
import {
  PROFILE_AVATAR_PRESET_IDS,
  type ProfileAvatarPresetId,
} from "@/src/lib/profile-avatar";

type Props = {
  userId: string;
  initialFullName: string;
  initialAvatarPreset: ProfileAvatarPresetId;
};

export default function AccountProfileClient({
  userId,
  initialFullName,
  initialAvatarPreset,
}: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [avatarPreset, setAvatarPreset] =
    useState<ProfileAvatarPresetId>(initialAvatarPreset);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [identityProviders, setIdentityProviders] = useState<string[]>([]);
  const [linkMessage, setLinkMessage] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);

  const isDiscordLinked = useMemo(
    () => identityProviders.includes("discord"),
    [identityProviders],
  );

  async function refreshIdentities() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const providers =
        (user?.identities ?? [])
          .map((i) => i.provider)
          .filter((p): p is string => typeof p === "string") ?? [];
      setIdentityProviders(Array.from(new Set(providers)).sort());
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    void refreshIdentities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function linkDiscordIdentity() {
    setLinkMessage("");
    setLinkLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        "/account",
      )}`;

      // `linkIdentity` is available when Manual Linking is enabled in Supabase Auth settings.
      // We keep this loosely typed to avoid breaking builds if SDK typings differ.
      const authAny = supabase.auth as any;
      if (typeof authAny?.linkIdentity !== "function") {
        setLinkMessage(
          "Account linking isn't available in the current auth client. Update Supabase packages and enable Manual Linking in Supabase Auth settings.",
        );
        return;
      }

      const { data, error } = await authAny.linkIdentity({
        provider: "discord",
        options: { redirectTo },
      });
      if (error) {
        setLinkMessage(error.message ?? "Could not start Discord linking.");
        return;
      }

      // Some SDKs return a URL; others auto-redirect.
      const url = data?.url;
      if (typeof url === "string" && url) {
        window.location.assign(url);
        return;
      }
      setLinkMessage("Follow the Discord popup to link your account.");
    } finally {
      setLinkLoading(false);
    }
  }

  async function onSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileMessage("");
    setProfileLoading(true);
    try {
      const supabase = createClient();
      const trimmed = fullName.trim();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: trimmed || null,
          name: trimmed || null,
        },
      });
      if (error) {
        setProfileMessage(error.message);
        return;
      }
      setProfileMessage("Display name saved.");
      router.refresh();
    } finally {
      setProfileLoading(false);
    }
  }

  async function saveAvatarPreset(next: ProfileAvatarPresetId) {
    setAvatarMessage("");
    setAvatarLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { avatar_preset: next },
      });
      if (error) {
        setAvatarMessage(error.message);
        return;
      }
      setAvatarPreset(next);
      setAvatarMessage("Profile picture updated.");
      router.refresh();
    } finally {
      setAvatarLoading(false);
    }
  }

  async function onChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwMessage("");
    if (newPassword.length < 8) {
      setPwMessage("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage("Passwords do not match.");
      return;
    }
    setPwLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setPwMessage(error.message);
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setPwMessage("Password updated.");
    } finally {
      setPwLoading(false);
    }
  }

  async function onSendResetEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetMessage("");
    setResetLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const email = user?.email?.trim();
      if (!email) {
        setResetMessage("You need to be signed in to request a reset.");
        return;
      }
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`,
      });
      if (error) {
        setResetMessage(error.message);
        return;
      }
      setResetMessage(
        "If this account has an address on file, you will receive a reset link shortly."
      );
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-12 text-slate-100">
      <nav className="mb-8 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-300">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-300">Account</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">Account</h1>
      <p className="mt-2 text-sm text-slate-400">
        Update how you appear and manage your password.
      </p>

      <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Profile
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          This name appears across the site instead of your sign-in address.
        </p>
        <form onSubmit={onSaveProfile} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Display name</span>
            <input
              type="text"
              value={fullName}
              onChange={(ev) => setFullName(ev.target.value)}
              autoComplete="name"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-emerald-500 focus:ring"
              placeholder="Your name"
            />
          </label>
          <button
            type="submit"
            disabled={profileLoading}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {profileLoading ? "Saving…" : "Save name"}
          </button>
        </form>
        {profileMessage ? (
          <p className="mt-3 text-sm text-emerald-300/90">{profileMessage}</p>
        ) : null}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Linked sign-in methods
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Link Discord to this account so logging in with email/password or
          Discord brings you into the same profile.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {identityProviders.length ? (
            identityProviders.map((p) => (
              <span
                key={p}
                className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300"
              >
                {p}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">No identities loaded.</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => void refreshIdentities()}
          className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
        >
          Refresh linked methods
        </button>

        {!isDiscordLinked ? (
          <button
            type="button"
            onClick={() => void linkDiscordIdentity()}
            disabled={linkLoading}
            className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-900 disabled:opacity-60"
          >
            {linkLoading ? "Opening Discord…" : "Link Discord to this account"}
          </button>
        ) : (
          <p className="mt-4 text-sm text-emerald-300/90">
            Discord is linked to this account.
          </p>
        )}

        {linkMessage ? (
          <p className="mt-3 text-sm text-slate-300">{linkMessage}</p>
        ) : null}

      </section>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Profile picture
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {PROFILE_AVATAR_PRESET_IDS.map((id) => {
            const selected = avatarPreset === id;
            return (
              <button
                key={id}
                type="button"
                disabled={avatarLoading}
                onClick={() => void saveAvatarPreset(id)}
                className={`rounded-full p-0.5 ring-2 transition ${
                  selected
                    ? "ring-emerald-400"
                    : "ring-transparent hover:ring-slate-500"
                } disabled:opacity-50`}
                aria-label={`Avatar ${id}`}
                aria-pressed={selected}
              >
                <ProfilePresetPickerImage
                  presetId={id}
                  size={48}
                  className="h-12 w-12"
                />
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <ProfileAvatar
            storedPreset={avatarPreset}
            seed={userId}
            label={fullName || "Member"}
            size={40}
          />
          <span className="text-xs text-slate-500">Current selection</span>
        </div>
        {avatarMessage ? (
          <p className="mt-3 text-sm text-emerald-300/90">{avatarMessage}</p>
        ) : null}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Change password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Use this while you are signed in.
        </p>
        <form onSubmit={onChangePassword} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(ev) => setNewPassword(ev.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-emerald-500 focus:ring"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Confirm</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(ev) => setConfirmPassword(ev.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-emerald-500 focus:ring"
            />
          </label>
          <button
            type="submit"
            disabled={pwLoading}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {pwLoading ? "Updating…" : "Update password"}
          </button>
        </form>
        {pwMessage ? (
          <p
            className={`mt-3 text-sm ${pwMessage.includes("Password") && pwMessage !== "Password updated." ? "text-amber-200" : "text-emerald-300/90"}`}
          >
            {pwMessage}
          </p>
        ) : null}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Password recovery
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          We will send a reset link to the address on file for this account.
        </p>
        <form onSubmit={onSendResetEmail} className="mt-4">
          <button
            type="submit"
            disabled={resetLoading}
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:opacity-60"
          >
            {resetLoading ? "Sending…" : "Send reset link"}
          </button>
        </form>
        {resetMessage ? (
          <p className="mt-3 text-sm text-emerald-300/90">{resetMessage}</p>
        ) : null}
      </section>
    </main>
  );
}
