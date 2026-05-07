"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const ISSUE_TYPES = [
  "CTD",
  "Visual",
  "Script/Quest",
  "Performance",
  "Crafting",
] as const;

const FREQUENCIES = ["Every time", "Sometimes", "Once"] as const;

const DISK_TYPES = ["SSD", "HDD", "NVMe"] as const;

const CONTACT_METHODS = [
  { id: "discord", label: "Discord (recommended)" },
  { id: "email", label: "Email" },
  { id: "other", label: "Other" },
] as const;

type ContactMethod = (typeof CONTACT_METHODS)[number]["id"];

const STEPS = [
  { n: 1, title: "Basics", hint: "What you’re running" },
  { n: 2, title: "Gameplay", hint: "Where you were in-game" },
  { n: 3, title: "The issue", hint: "What went wrong" },
  { n: 4, title: "Your PC", hint: "Hardware & install" },
  { n: 5, title: "Logs & mods", hint: "Optional links" },
  { n: 6, title: "Contact", hint: "How we reach you" },
] as const;

const fieldClass =
  "w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 shadow-sm transition-colors focus:border-emerald-500/45 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

const labelClass = "block text-xs font-medium text-neutral-400";

function formatReport(values: FormState): string {
  const lines: string[] = [
    "# Fallen World — Bug Report & Support Ticket",
    "",
    "## 1. Basic Information",
    `**Subject:** ${values.subject}`,
    `**Modlist version:** ${values.modlist_version}`,
    "",
    "## 2. Gameplay Context",
    `**Playtime on this save:** ${values.playtime_total} hours`,
    `**Character level:** ${values.character_level}`,
    `**Current location:** ${values.current_location}`,
    `**Last quest / objective:** ${values.last_quest}`,
    "",
    "## 3. Issue Details",
    `**Issue type:** ${values.issue_type}`,
    `**Frequency:** ${values.frequency}`,
    "",
    "**Description:**",
    values.description,
    "",
    "**Steps to reproduce:**",
    ...values.recreation_steps
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s, i) => `${i + 1}. ${s}`),
    "",
    "## 4. System Specs",
    `**CPU:** ${values.cpu}`,
    `**GPU:** ${values.gpu}`,
    `**RAM:** ${values.ram}`,
    `**Disk type:** ${values.disk_type}`,
    "",
    "## 5. Logs & Modifications",
    `**Custom mods added (voids official support if yes):** ${values.custom_mods_added ? "Yes" : "No"}`,
    values.crash_log_link.trim()
      ? `**Crash log link:** ${values.crash_log_link}`
      : "**Crash log link:** (none)",
    values.visual_evidence.trim()
      ? `**Visual evidence:** ${values.visual_evidence}`
      : "**Visual evidence:** (none)",
    "",
    "## 6. Contact preference",
    `**Preferred contact:** ${CONTACT_METHODS.find((m) => m.id === values.contact_method)?.label ?? values.contact_method}`,
  ];

  if (values.contact_method === "discord") {
    lines.push(
      values.discord_handle.trim()
        ? `**Discord handle:** ${values.discord_handle}`
        : "**Discord handle:** (join the server — link below)",
    );
    lines.push("**Discord:** https://discord.gg/mg2hhGvVKB");
  } else if (values.contact_method === "email") {
    lines.push(`**Email:** ${values.contact_email}`);
  } else {
    lines.push(
      values.contact_other.trim()
        ? `**Other contact details:** ${values.contact_other}`
        : "**Other contact details:** (not provided)",
    );
  }

  return lines.join("\n");
}

type FormState = {
  subject: string;
  modlist_version: string;
  playtime_total: string;
  character_level: string;
  current_location: string;
  last_quest: string;
  issue_type: (typeof ISSUE_TYPES)[number];
  description: string;
  recreation_steps: string[];
  frequency: (typeof FREQUENCIES)[number];
  cpu: string;
  gpu: string;
  ram: string;
  disk_type: (typeof DISK_TYPES)[number];
  custom_mods_added: boolean | null;
  crash_log_link: string;
  visual_evidence: string;
  contact_method: ContactMethod;
  discord_handle: string;
  contact_email: string;
  contact_other: string;
};

const initialSteps = ["", ""];

function validateStep(step: number, state: FormState): string[] {
  const errs: string[] = [];
  switch (step) {
    case 1:
      if (!state.subject.trim()) errs.push("Add a short title.");
      if (!state.modlist_version.trim()) errs.push("Add your modlist version.");
      break;
    case 2:
      if (!state.playtime_total.trim()) errs.push("Add playtime (hours on this save).");
      if (!state.character_level.trim()) errs.push("Add character level.");
      if (!state.current_location.trim()) errs.push("Add where you were.");
      if (!state.last_quest.trim()) errs.push("Add last quest or what you were doing.");
      break;
    case 3:
      if (!state.description.trim()) errs.push("Describe what happened.");
      if (state.recreation_steps.map((s) => s.trim()).filter(Boolean).length === 0) {
        errs.push("Add at least one step to reproduce.");
      }
      break;
    case 4:
      if (!state.cpu.trim()) errs.push("Add CPU model.");
      if (!state.gpu.trim()) errs.push("Add GPU model.");
      if (!state.ram.trim()) errs.push("Add RAM amount.");
      if (state.disk_type === "HDD") {
        errs.push("Install the list on an SSD or NVMe — HDD is not supported.");
      }
      break;
    case 5:
      if (state.custom_mods_added === null) {
        errs.push("Say whether you added mods outside the list.");
      }
      break;
    case 6:
      if (state.contact_method === "email" && !state.contact_email.trim()) {
        errs.push("Add an email address.");
      }
      break;
    default:
      break;
  }
  return errs;
}

function validateAll(state: FormState): string[] {
  return STEPS.flatMap((s) => validateStep(s.n, state));
}

const initialState: FormState = {
  subject: "",
  modlist_version: "",
  playtime_total: "",
  character_level: "",
  current_location: "",
  last_quest: "",
  issue_type: "CTD",
  description: "",
  recreation_steps: [...initialSteps],
  frequency: "Sometimes",
  cpu: "",
  gpu: "",
  ram: "",
  disk_type: "SSD",
  custom_mods_added: null,
  crash_log_link: "",
  visual_evidence: "",
  contact_method: "discord",
  discord_handle: "",
  contact_email: "",
  contact_other: "",
};

export default function FallenWorldBugReportForm() {
  const [state, setState] = useState<FormState>(initialState);
  const [step, setStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "copied" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [ticketReference, setTicketReference] = useState<string | null>(null);
  const [ticketSaveSkipped, setTicketSaveSkipped] = useState(false);
  /** Set when the API returns an error (not 503 not_configured). */
  const [ticketApiDetail, setTicketApiDetail] = useState<{
    error: string;
    hint?: string;
    status: number;
  } | null>(null);

  const hddSelected = state.disk_type === "HDD";
  const customModsWarning = state.custom_mods_added === true;

  useEffect(() => {
    setStepErrors([]);
  }, [step]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
    setSubmitStatus("idle");
    setTicketReference(null);
    setTicketSaveSkipped(false);
    setTicketApiDetail(null);
  }, []);

  const updateStep = useCallback((index: number, value: string) => {
    setState((s) => {
      const recreation_steps = [...s.recreation_steps];
      recreation_steps[index] = value;
      return { ...s, recreation_steps };
    });
    setSubmitStatus("idle");
  }, []);

  const addStep = useCallback(() => {
    setState((s) => ({ ...s, recreation_steps: [...s.recreation_steps, ""] }));
  }, []);

  const removeStep = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      recreation_steps:
        s.recreation_steps.length > 1
          ? s.recreation_steps.filter((_, i) => i !== index)
          : s.recreation_steps,
    }));
  }, []);

  const goNext = useCallback(() => {
    const errs = validateStep(step, state);
    setStepErrors(errs);
    if (errs.length > 0) return;
    setStep((s) => Math.min(6, s + 1));
  }, [step, state]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(1, s - 1));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validateAll(state);
      setStepErrors(errs);
      if (errs.length > 0) {
        const firstBad = STEPS.find((s) => validateStep(s.n, state).length > 0)?.n ?? 1;
        setStep(firstBad);
        return;
      }

      const markdown = formatReport(state);
      setSubmitting(true);
      setTicketReference(null);
      setTicketSaveSkipped(false);
      setTicketApiDetail(null);

      let ref: string | null = null;
      let skipped = false;
      let apiDetail: { error: string; hint?: string; status: number } | null =
        null;

      try {
        const res = await fetch("/api/support/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportBody: markdown,
            subject: state.subject,
            contactChannel: state.contact_method,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          reference?: string;
          reason?: string;
          error?: string;
          hint?: string;
        };

        if (res.ok && data.ok && typeof data.reference === "string") {
          ref = data.reference;
        } else if (res.status === 503 && data.reason === "not_configured") {
          skipped = true;
        } else if (!res.ok) {
          apiDetail = {
            status: res.status,
            error:
              typeof data.error === "string"
                ? data.error
                : `Request failed (${res.status})`,
            hint: typeof data.hint === "string" ? data.hint : undefined,
          };
        } else if (!data.reference) {
          apiDetail = {
            status: res.status,
            error: "Server returned success without a ticket reference.",
          };
        }
      } catch {
        apiDetail = {
          status: 0,
          error: "Network error — check your connection.",
        };
      }

      setTicketReference(ref);
      setTicketSaveSkipped(skipped);
      setTicketApiDetail(apiDetail);

      try {
        await navigator.clipboard.writeText(markdown);
        setSubmitStatus("copied");
      } catch {
        setSubmitStatus("error");
      } finally {
        setSubmitting(false);
      }
    },
    [state],
  );

  const progress = (step / 6) * 100;
  const meta = STEPS[step - 1];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0c]/80 p-5 shadow-xl backdrop-blur-sm sm:p-7">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-neutral-500">
          <span>
            Step {step} of 6
            <span className="text-neutral-600"> · </span>
            <span className="text-neutral-300">{meta.title}</span>
          </span>
          <span className="hidden sm:inline text-neutral-600">{meta.hint}</span>
        </div>
        <div
          className="h-1 overflow-hidden rounded-full bg-white/[0.06]"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={6}
        >
          <div
            className="h-full rounded-full bg-emerald-500/80 transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="mb-5 text-xs leading-relaxed text-neutral-500 sm:hidden">
        {meta.hint}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {stepErrors.length > 0 ? (
          <div
            className="rounded-lg border border-red-500/25 bg-red-950/25 px-3 py-2.5 text-xs text-red-200/95"
            role="alert"
          >
            <ul className="list-inside list-disc space-y-0.5">
              {stepErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <label className={labelClass}>
              Title <span className="text-red-400/90">*</span>
              <input
                className={`${fieldClass} mt-1.5`}
                placeholder="Short description of the problem"
                value={state.subject}
                onChange={(e) => set("subject", e.target.value)}
                autoComplete="off"
              />
            </label>
            <label className={labelClass}>
              Modlist version <span className="text-red-400/90">*</span>
              <input
                className={`${fieldClass} mt-1.5`}
                placeholder="e.g. 2.4.0"
                value={state.modlist_version}
                onChange={(e) => set("modlist_version", e.target.value)}
              />
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Hours on this save <span className="text-red-400/90">*</span>
                <input
                  className={`${fieldClass} mt-1.5`}
                  inputMode="decimal"
                  placeholder="e.g. 42"
                  value={state.playtime_total}
                  onChange={(e) => set("playtime_total", e.target.value)}
                />
              </label>
              <label className={labelClass}>
                Character level <span className="text-red-400/90">*</span>
                <input
                  className={`${fieldClass} mt-1.5`}
                  inputMode="numeric"
                  placeholder="e.g. 28"
                  value={state.character_level}
                  onChange={(e) => set("character_level", e.target.value)}
                />
              </label>
            </div>
            <label className={labelClass}>
              Where you were <span className="text-red-400/90">*</span>
              <input
                className={`${fieldClass} mt-1.5`}
                placeholder="Region, cell, or landmark"
                value={state.current_location}
                onChange={(e) => set("current_location", e.target.value)}
              />
            </label>
            <label className={labelClass}>
              Last quest or objective <span className="text-red-400/90">*</span>
              <input
                className={`${fieldClass} mt-1.5`}
                placeholder="Quest name or what you were doing"
                value={state.last_quest}
                onChange={(e) => set("last_quest", e.target.value)}
              />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Issue type
                <select
                  className={`${fieldClass} mt-1.5`}
                  value={state.issue_type}
                  onChange={(e) =>
                    set("issue_type", e.target.value as FormState["issue_type"])
                  }
                >
                  {ISSUE_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-neutral-900">
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                How often
                <select
                  className={`${fieldClass} mt-1.5`}
                  value={state.frequency}
                  onChange={(e) =>
                    set("frequency", e.target.value as FormState["frequency"])
                  }
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f} className="bg-neutral-900">
                      {f}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className={labelClass}>
              What happened <span className="text-red-400/90">*</span>
              <textarea
                className={`${fieldClass} mt-1.5 min-h-[100px] resize-y`}
                placeholder="What you expected vs what you saw"
                value={state.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </label>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={labelClass}>
                  Steps to reproduce <span className="text-red-400/90">*</span>
                </span>
                <button
                  type="button"
                  onClick={addStep}
                  className="text-xs font-medium text-emerald-400/90 hover:text-emerald-300"
                >
                  + Add step
                </button>
              </div>
              <ol className="space-y-2">
                {state.recreation_steps.map((row, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2.5 w-5 shrink-0 text-right text-xs tabular-nums text-neutral-600">
                      {i + 1}.
                    </span>
                    <input
                      className={fieldClass}
                      placeholder={`Step ${i + 1}`}
                      value={row}
                      onChange={(e) => updateStep(i, e.target.value)}
                    />
                    {state.recreation_steps.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeStep(i)}
                        className="shrink-0 rounded-lg px-2 text-xs text-neutral-600 hover:bg-white/[0.06] hover:text-neutral-300"
                        aria-label={`Remove step ${i + 1}`}
                      >
                        Remove
                      </button>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {hddSelected ? (
              <p
                className="rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90"
                role="status"
              >
                Fallen World needs an SSD or NVMe. HDD installs often crash from
                slow streaming — move the game before asking for support.
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                CPU <span className="text-red-400/90">*</span>
                <input
                  className={`${fieldClass} mt-1.5`}
                  placeholder="Processor model"
                  value={state.cpu}
                  onChange={(e) => set("cpu", e.target.value)}
                />
              </label>
              <label className={labelClass}>
                GPU <span className="text-red-400/90">*</span>
                <input
                  className={`${fieldClass} mt-1.5`}
                  placeholder="6 GB+ VRAM recommended"
                  value={state.gpu}
                  onChange={(e) => set("gpu", e.target.value)}
                />
              </label>
              <label className={labelClass}>
                RAM <span className="text-red-400/90">*</span>
                <input
                  className={`${fieldClass} mt-1.5`}
                  placeholder="e.g. 32 GB"
                  value={state.ram}
                  onChange={(e) => set("ram", e.target.value)}
                />
              </label>
              <label className={labelClass}>
                Game drive
                <select
                  className={`${fieldClass} mt-1.5`}
                  value={state.disk_type}
                  onChange={(e) =>
                    set("disk_type", e.target.value as FormState["disk_type"])
                  }
                >
                  {DISK_TYPES.map((d) => (
                    <option key={d} value={d} className="bg-neutral-900">
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {customModsWarning ? (
              <p className="rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90">
                Extra mods aren’t covered by official support. Discord can still
                help informally.
              </p>
            ) : null}
            <fieldset>
              <legend className={labelClass}>
                Added mods outside the list? <span className="text-red-400/90">*</span>
              </legend>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-neutral-300">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="custom_mods"
                    className="accent-emerald-500"
                    checked={state.custom_mods_added === false}
                    onChange={() => set("custom_mods_added", false)}
                  />
                  No
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="custom_mods"
                    className="accent-emerald-500"
                    checked={state.custom_mods_added === true}
                    onChange={() => set("custom_mods_added", true)}
                  />
                  Yes
                </label>
              </div>
            </fieldset>
            <label className={labelClass}>
              Crash log link <span className="text-neutral-600">(optional)</span>
              <input
                type="url"
                className={`${fieldClass} mt-1.5`}
                placeholder="Pastebin / gist (Buffout, Trainwreck…)"
                value={state.crash_log_link}
                onChange={(e) => set("crash_log_link", e.target.value)}
              />
            </label>
            <label className={labelClass}>
              Screenshot or video <span className="text-neutral-600">(optional)</span>
              <input
                type="url"
                className={`${fieldClass} mt-1.5`}
                placeholder="Link to image or clip"
                value={state.visual_evidence}
                onChange={(e) => set("visual_evidence", e.target.value)}
              />
            </label>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <p className="text-xs leading-relaxed text-neutral-500">
              Fastest help is on{" "}
              <a
                href="https://discord.gg/mg2hhGvVKB"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-400/90 underline-offset-2 hover:underline"
              >
                Discord
              </a>
              . We’ll use your choice below.
            </p>
            <div className="space-y-2">
              <span className={labelClass}>Preferred contact</span>
              {CONTACT_METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    state.contact_method === m.id
                      ? "border-emerald-500/35 bg-emerald-500/[0.07] text-neutral-100"
                      : "border-white/[0.06] text-neutral-400 hover:border-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="contact"
                    className="accent-emerald-500"
                    checked={state.contact_method === m.id}
                    onChange={() => set("contact_method", m.id)}
                  />
                  {m.label}
                </label>
              ))}
            </div>
            {state.contact_method === "discord" ? (
              <label className={labelClass}>
                Discord username <span className="text-neutral-600">(optional)</span>
                <input
                  className={`${fieldClass} mt-1.5`}
                  placeholder="e.g. name#1234"
                  value={state.discord_handle}
                  onChange={(e) => set("discord_handle", e.target.value)}
                />
              </label>
            ) : null}
            {state.contact_method === "email" ? (
              <label className={labelClass}>
                Email <span className="text-red-400/90">*</span>
                <input
                  type="email"
                  className={`${fieldClass} mt-1.5`}
                  placeholder="you@example.com"
                  value={state.contact_email}
                  onChange={(e) => set("contact_email", e.target.value)}
                />
              </label>
            ) : null}
            {state.contact_method === "other" ? (
              <label className={labelClass}>
                How to reach you
                <input
                  className={`${fieldClass} mt-1.5`}
                  placeholder="Other method or details"
                  value={state.contact_other}
                  onChange={(e) => set("contact_other", e.target.value)}
                />
              </label>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-white/[0.08]"
              >
                Back
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {step < 6 ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-500"
              >
                Continue
              </button>
            ) : (
              <>
                <a
                  href="https://discord.gg/mg2hhGvVKB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-white/[0.06]"
                >
                  Open Discord
                </a>
                <button
                  type="submit"
                  disabled={hddSelected || submitting}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {submitting ? "Saving…" : "Submit & copy report"}
                </button>
              </>
            )}
          </div>
        </div>

        {submitStatus === "copied" ? (
          <div
            className="space-y-3 rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-4 py-3 text-sm text-neutral-200"
            role="status"
          >
            {ticketReference ? (
              <>
                <p className="font-medium text-emerald-300/95">
                  Ticket{" "}
                  <span className="font-mono tabular-nums text-white">
                    {ticketReference}
                  </span>{" "}
                  created.
                </p>
                <p className="text-xs leading-relaxed text-neutral-400">
                  A member of staff will follow up using the contact method you
                  chose. Save your ticket number — you’ll need it on{" "}
                  <Link
                    href="/support/bug-report#ticket-lookup"
                    className="font-medium text-emerald-400/90 underline-offset-2 hover:underline"
                  >
                    Look up your ticket
                  </Link>{" "}
                  to read replies and add updates.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void navigator.clipboard.writeText(ticketReference ?? "")
                    }
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Copy ticket number
                  </button>
                  <Link
                    href="/support/bug-report#ticket-lookup"
                    className="text-xs font-medium text-emerald-400/90 underline-offset-2 hover:underline"
                  >
                    Open ticket &amp; reply
                  </Link>
                </div>
                <p className="text-xs text-neutral-500">
                  Submitting again starts a <strong className="font-medium text-neutral-400">new</strong> ticket (for example if you have another issue later).
                </p>
              </>
            ) : ticketSaveSkipped ? (
              <p className="text-xs leading-relaxed text-neutral-400">
                Your report was copied to the clipboard. Ticket storage is not
                enabled on this site yet — please paste it in{" "}
                <a
                  href="https://discord.gg/mg2hhGvVKB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-400/90 underline-offset-2 hover:underline"
                >
                  Discord
                </a>{" "}
                so a staff member can help.
              </p>
            ) : ticketApiDetail ? (
              <div className="space-y-2 text-xs leading-relaxed text-neutral-400">
                <p className="text-amber-200/90">
                  Your report was copied, but the site could not save a ticket.
                </p>
                <p className="rounded-md bg-black/30 px-2 py-1.5 font-mono text-[11px] text-red-200/90">
                  {ticketApiDetail.error}
                </p>
                {ticketApiDetail.hint ? (
                  <p className="text-neutral-500">{ticketApiDetail.hint}</p>
                ) : (
                  <p className="text-neutral-500">
                    Usual fixes: set{" "}
                    <code className="rounded bg-black/40 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
                    in <code className="rounded bg-black/40 px-1">.env.local</code>, restart the dev
                    server, and run all Supabase migrations for support tickets.
                  </p>
                )}
                <p>
                  Paste into{" "}
                  <a
                    href="https://discord.gg/mg2hhGvVKB"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-400/90 underline-offset-2 hover:underline"
                  >
                    Discord
                  </a>{" "}
                  so staff still receive it.
                </p>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-neutral-400">
                Your report was copied. We couldn’t save a ticket on the server;
                please paste it into{" "}
                <a
                  href="https://discord.gg/mg2hhGvVKB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-400/90 underline-offset-2 hover:underline"
                >
                  Discord
                </a>{" "}
                so nothing gets lost.
              </p>
            )}
            <p className="text-xs text-neutral-500">
              Full report is on your clipboard — you can paste it into Discord
              for faster back-and-forth if you like.
            </p>
          </div>
        ) : null}
        {submitStatus === "error" ? (
          <div
            className="rounded-lg border border-red-500/25 bg-red-950/20 px-4 py-3 text-sm text-red-200/95"
            role="alert"
          >
            <p>Couldn’t copy to the clipboard — check browser permissions.</p>
            {ticketReference ? (
              <p className="mt-2 text-xs text-red-200/80">
                Your ticket{" "}
                <span className="font-mono text-white">{ticketReference}</span>{" "}
                was still created. Use{" "}
                <Link href="/support/bug-report#ticket-lookup" className="underline underline-offset-2">
                  Look up your ticket
                </Link>{" "}
                with that number to read the thread or reply.
              </p>
            ) : ticketSaveSkipped ? (
              <p className="mt-2 text-xs text-red-200/80">
                Ticket storage isn’t enabled here — open{" "}
                <a
                  href="https://discord.gg/mg2hhGvVKB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  Discord
                </a>{" "}
                and paste your answers manually.
              </p>
            ) : (
              <p className="mt-2 text-xs text-red-200/80">
                If the ticket didn’t save, use Discord with your report details.
              </p>
            )}
          </div>
        ) : null}
      </form>
    </div>
  );
}
