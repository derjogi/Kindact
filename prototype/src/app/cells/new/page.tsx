"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import { createCell } from "@/lib/api";

const SCOPE_LEVELS = [
  "neighborhood",
  "city",
  "region",
  "national",
  "global",
  "topic",
  "project",
  "event",
];

const MEMBRANE_WRITE = [
  { value: "public", label: "Public — anyone can write" },
  {
    value: "scope_verified",
    label: "Scope-verified — writers prove they're in scope",
  },
  { value: "invite_only", label: "Invite-only" },
];

const GOV = [
  "approval_voting",
  "consensus_with_neighbor_agreement",
  "ranked_choice",
  "meta_governance",
];

export default function CreateCellPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    description: "",
    scopeLevel: "topic",
    locationRefs: "",
    topicTags: "",
    membraneRead: "public",
    membraneWrite: "scope_verified",
    governanceEngine: "approval_voting",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createCell({
        displayName: form.displayName.trim(),
        description: form.description,
        scopeLevel: form.scopeLevel,
        locationRefs: form.locationRefs
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        topicTags: form.topicTags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        membraneRead: form.membraneRead,
        membraneWrite: form.membraneWrite,
        governanceEngine: form.governanceEngine,
      });
      router.push(`/cells/${encodeURIComponent(created.cellId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <div className="space-y-4">
        <Link href="/cells" className="text-xs text-stone-500 hover:text-stone-700">
          ← All cells
        </Link>
        <h1 className="text-xl font-semibold text-stone-900">Create a cell</h1>
        <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 text-stone-700">
          New cells land in the <code className="font-mono">uncurated</code>{" "}
          namespace. They become discoverable immediately. Promotion to{" "}
          <em>canonical</em> happens via meta-governance proposal — see{" "}
          <Link href="/cells" className="underline">
            cell tiers
          </Link>
          .
        </div>

        {error ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Display name" required>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
              placeholder="e.g. Manhattan Wind Turbine 2026"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
              placeholder="What does this cell coordinate around?"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Scope level">
              <select
                value={form.scopeLevel}
                onChange={(e) => set("scopeLevel", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
              >
                {SCOPE_LEVELS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Governance engine">
              <select
                value={form.governanceEngine}
                onChange={(e) => set("governanceEngine", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
              >
                {GOV.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Location refs"
            hint="comma-separated, e.g. place:berlin, h3:88283082"
          >
            <input
              type="text"
              value={form.locationRefs}
              onChange={(e) => set("locationRefs", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
            />
          </Field>

          <Field label="Topic tags" hint="comma-separated, e.g. #housing, #tenants">
            <input
              type="text"
              value={form.topicTags}
              onChange={(e) => set("topicTags", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
            />
          </Field>

          <Field label="Write membrane">
            <select
              value={form.membraneWrite}
              onChange={(e) => set("membraneWrite", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
            >
              {MEMBRANE_WRITE.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Link
              href="/cells"
              className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 text-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 rounded-lg bg-stone-800 text-white text-sm hover:bg-stone-700"
            >
              {submitting ? "Creating…" : "Create cell"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-stone-700 mb-1">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </div>
      {children}
      {hint ? <div className="text-xs text-stone-400 mt-0.5">{hint}</div> : null}
    </label>
  );
}
