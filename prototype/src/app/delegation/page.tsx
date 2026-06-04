"use client";

import { useState } from "react";
import Layout from "@/components/Layout";

interface Delegation {
  id: string;
  topic: string;
  delegate: string;
  alias: string;
  weight: number; // 0..1
  since: string;
  scope: "all" | "topic" | "issue";
  note?: string;
}

const SEED: Delegation[] = [
  {
    id: "d1",
    topic: "#housing",
    delegate: "0x9f3…ac21",
    alias: "Ana — Tenants' Union",
    weight: 1,
    since: "2026-03-04",
    scope: "topic",
    note: "Aligned on rent stabilisation. Revisit quarterly.",
  },
  {
    id: "d2",
    topic: "#climate",
    delegate: "0x12d…b7ef",
    alias: "Imo — Solarpunk DAO",
    weight: 0.6,
    since: "2025-11-12",
    scope: "topic",
  },
  {
    id: "d3",
    topic: "All scopes",
    delegate: "0x44a…1f02",
    alias: "Council seat 3",
    weight: 0.25,
    since: "2025-09-30",
    scope: "all",
    note: "Backup delegate when I'm offline.",
  },
];

export default function DelegationPage() {
  const [items, setItems] = useState<Delegation[]>(SEED);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<Delegation, "id" | "since">>({
    topic: "",
    delegate: "",
    alias: "",
    weight: 1,
    scope: "topic",
  });

  function revoke(id: string) {
    if (!confirm("Revoke this delegation?")) return;
    setItems((prev) => prev.filter((d) => d.id !== id));
  }

  function commit() {
    if (!draft.topic.trim() || !draft.delegate.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        ...draft,
        id: Math.random().toString(36).slice(2, 9),
        since: new Date().toISOString().slice(0, 10),
      },
    ]);
    setAdding(false);
    setDraft({
      topic: "",
      delegate: "",
      alias: "",
      weight: 1,
      scope: "topic",
    });
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Editorial header */}
        <section className="p-6 bg-surface-container-lowest rounded-md border-l-4 border-primary card-lift">
          <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
            Liquid democracy
          </p>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            Delegation
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mt-1">
            Lend your voting weight to trusted neighbours, per topic or per scope.
            You can revoke at any time, and you always override a delegate by
            voting yourself.
          </p>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Stat label="Active delegations" value={String(items.length)} />
          <Stat
            label="Effective weight delegated"
            value={`${Math.round(
              items.reduce((a, b) => a + b.weight, 0) * 100,
            )}%`}
          />
          <Stat label="Unique delegates" value={String(new Set(items.map((d) => d.delegate)).size)} />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-on-surface">
            Your delegates
          </h2>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-primary px-4 py-2 rounded-md text-sm font-medium"
          >
            + Delegate
          </button>
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="font-meta text-sm text-on-surface-variant text-center py-12">
              No delegations yet.
            </p>
          ) : (
            items.map((d) => (
              <article
                key={d.id}
                className="bg-surface-container-lowest rounded-md p-5 card-lift"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-meta text-[10px] uppercase tracking-widest text-on-primary-container bg-primary-container px-2 py-0.5 rounded">
                        {d.topic}
                      </span>
                      <span className="font-meta text-xs text-on-surface-variant">
                        scope: {d.scope}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-on-surface mt-2">
                      {d.alias}
                    </h3>
                    <p className="font-mono font-meta text-xs text-on-surface-variant mt-0.5">
                      {d.delegate}
                    </p>
                    {d.note ? (
                      <p className="font-sans text-sm text-on-surface mt-2 italic">
                        “{d.note}”
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right space-y-2 shrink-0">
                    <div>
                      <div className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
                        Weight
                      </div>
                      <div className="font-display text-2xl font-semibold text-primary-dim">
                        {Math.round(d.weight * 100)}%
                      </div>
                    </div>
                    <div className="font-meta text-xs text-on-surface-variant">
                      since {new Date(d.since).toLocaleDateString()}
                    </div>
                    <button
                      type="button"
                      onClick={() => revoke(d.id)}
                      className="font-meta text-xs text-status-adopted hover:underline"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Add modal */}
        {adding ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-[2px] p-4"
            onClick={() => setAdding(false)}
          >
            <div
              className="bg-surface-container-lowest rounded-md elevation-floating w-full max-w-md p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-display text-lg font-semibold text-on-surface">
                Assign a delegate
              </h2>

              <label className="block">
                <div className="font-meta text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
                  Topic or scope
                </div>
                <input
                  value={draft.topic}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, topic: e.target.value }))
                  }
                  placeholder="#climate or 'All scopes'"
                  className="input-line w-full px-3 py-2 text-sm focus:outline-none"
                />
              </label>

              <label className="block">
                <div className="font-meta text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
                  Delegate address
                </div>
                <input
                  value={draft.delegate}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, delegate: e.target.value }))
                  }
                  placeholder="0x…"
                  className="input-line w-full px-3 py-2 text-sm font-mono focus:outline-none"
                />
              </label>

              <label className="block">
                <div className="font-meta text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
                  Display alias
                </div>
                <input
                  value={draft.alias}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, alias: e.target.value }))
                  }
                  placeholder="A name to remember them by"
                  className="input-line w-full px-3 py-2 text-sm focus:outline-none"
                />
              </label>

              <label className="block">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-meta text-xs uppercase tracking-widest text-on-surface-variant">
                    Weight
                  </span>
                  <span className="font-meta text-xs text-on-surface">
                    {Math.round(draft.weight * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={draft.weight}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      weight: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-primary"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="px-3 py-1.5 text-sm text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commit}
                  className="btn-primary px-4 py-2 text-sm rounded-md font-medium"
                >
                  Confirm delegation
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-md p-4 card-lift">
      <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
        {label}
      </p>
      <p className="font-display text-2xl font-semibold text-on-surface">
        {value}
      </p>
    </div>
  );
}
