"use client";

import { useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";

interface WorkPackage {
  id: string;
  issueId: string;
  issueTitle: string;
  title: string;
  reward: number; // $CC
  due: string;
  status: "open" | "claimed" | "submitted" | "verified" | "rejected";
  claimedBy?: string;
}

const SEED: WorkPackage[] = [
  {
    id: "wp1",
    issueId: "issue-7",
    issueTitle: "Repaint Lincoln Park benches",
    title: "Procure low-VOC paint and brushes",
    reward: 80,
    due: "2026-05-30",
    status: "open",
  },
  {
    id: "wp2",
    issueId: "issue-7",
    issueTitle: "Repaint Lincoln Park benches",
    title: "Repaint benches in north quadrant",
    reward: 150,
    due: "2026-06-12",
    status: "claimed",
    claimedBy: "0xc02…fa18",
  },
  {
    id: "wp3",
    issueId: "issue-12",
    issueTitle: "Translate constitution into Te Reo Māori",
    title: "Draft chapters 1–3",
    reward: 220,
    due: "2026-06-04",
    status: "submitted",
    claimedBy: "you",
  },
  {
    id: "wp4",
    issueId: "issue-12",
    issueTitle: "Translate constitution into Te Reo Māori",
    title: "Peer review chapters 1–3",
    reward: 60,
    due: "2026-06-09",
    status: "open",
  },
];

const statusMeta: Record<WorkPackage["status"], { label: string; tone: string; dot: string }> = {
  open: {
    label: "Open",
    tone: "bg-surface-container-low text-on-surface",
    dot: "bg-on-surface-variant",
  },
  claimed: {
    label: "Claimed",
    tone: "bg-surface-container-low text-on-surface",
    dot: "bg-status-implementing",
  },
  submitted: {
    label: "Submitted — awaiting verification",
    tone: "bg-surface-container-low text-on-surface",
    dot: "bg-status-voting",
  },
  verified: {
    label: "Verified",
    tone: "bg-primary-container text-on-primary-container",
    dot: "bg-status-deliberating",
  },
  rejected: {
    label: "Rejected",
    tone: "bg-surface-container-low text-on-surface",
    dot: "bg-status-adopted",
  },
};

type Tab = "open" | "mine" | "verify";

export default function ImplementationPage() {
  const [tab, setTab] = useState<Tab>("open");
  const [items, setItems] = useState<WorkPackage[]>(SEED);
  const [reportingFor, setReportingFor] = useState<string | null>(null);
  const [reportText, setReportText] = useState("");
  const [reportEvidence, setReportEvidence] = useState("");

  const visible = items.filter((wp) =>
    tab === "open"
      ? wp.status === "open"
      : tab === "mine"
      ? wp.claimedBy === "you"
      : wp.status === "submitted",
  );

  function claim(id: string) {
    setItems((prev) =>
      prev.map((wp) =>
        wp.id === id ? { ...wp, status: "claimed", claimedBy: "you" } : wp,
      ),
    );
  }

  function submitReport() {
    if (!reportingFor || !reportText.trim()) return;
    setItems((prev) =>
      prev.map((wp) =>
        wp.id === reportingFor ? { ...wp, status: "submitted" } : wp,
      ),
    );
    setReportingFor(null);
    setReportText("");
    setReportEvidence("");
  }

  function verdict(id: string, kind: "verified" | "rejected") {
    setItems((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, status: kind } : wp)),
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Editorial header */}
        <section className="p-6 bg-surface-container-lowest rounded-md border-l-4 border-status-implementing card-lift">
          <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
            Doing the work
          </p>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            Implementation &amp; Verification
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mt-1">
            Adopted issues spawn <strong>work packages</strong>. Claim what you
            can do, submit a report when it's done, and verify your peers'
            reports to release $CC.
          </p>
        </section>

        {/* Tab strip */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          <TabButton active={tab === "open"} onClick={() => setTab("open")}>
            Open work
          </TabButton>
          <TabButton active={tab === "mine"} onClick={() => setTab("mine")}>
            My claims
          </TabButton>
          <TabButton active={tab === "verify"} onClick={() => setTab("verify")}>
            Verifier queue
          </TabButton>
        </div>

        <div className="space-y-3">
          {visible.length === 0 ? (
            <p className="font-meta text-sm text-on-surface-variant text-center py-12">
              Nothing here right now.
            </p>
          ) : (
            visible.map((wp) => (
              <article
                key={wp.id}
                className="bg-surface-container-lowest rounded-md p-5 card-lift"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/issues/${wp.issueId}`}
                      className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary-dim"
                    >
                      {wp.issueTitle}
                    </Link>
                    <h3 className="font-display text-lg font-semibold text-on-surface mt-1">
                      {wp.title}
                    </h3>
                    <div className="mt-2 inline-flex items-center gap-1.5 font-meta text-xs">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusMeta[wp.status].dot}`}
                      />
                      <span className="text-on-surface-variant">
                        {statusMeta[wp.status].label}
                      </span>
                      {wp.claimedBy ? (
                        <>
                          <span className="text-on-surface-variant">·</span>
                          <span className="text-on-surface-variant">
                            {wp.claimedBy === "you"
                              ? "by you"
                              : `by ${wp.claimedBy}`}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <div className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Reward
                    </div>
                    <div className="font-display text-2xl font-semibold text-primary-dim">
                      {wp.reward} $CC
                    </div>
                    <div className="font-meta text-xs text-on-surface-variant">
                      due {new Date(wp.due).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {tab === "open" && wp.status === "open" ? (
                    <button
                      type="button"
                      onClick={() => claim(wp.id)}
                      className="btn-primary px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Claim this work
                    </button>
                  ) : null}
                  {tab === "mine" && wp.status === "claimed" ? (
                    <button
                      type="button"
                      onClick={() => setReportingFor(wp.id)}
                      className="btn-primary px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Submit report
                    </button>
                  ) : null}
                  {tab === "verify" && wp.status === "submitted" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => verdict(wp.id, "verified")}
                        className="btn-primary px-4 py-2 rounded-md text-sm font-medium"
                      >
                        ✓ Verify
                      </button>
                      <button
                        type="button"
                        onClick={() => verdict(wp.id, "rejected")}
                        className="px-4 py-2 rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface text-sm transition-colors"
                      >
                        ✗ Reject
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>

        {/* Report modal */}
        {reportingFor ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-[2px] p-4"
            onClick={() => setReportingFor(null)}
          >
            <div
              className="bg-surface-container-lowest rounded-md elevation-floating w-full max-w-lg p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-display text-lg font-semibold text-on-surface">
                Submit work report
              </h2>
              <p className="font-meta text-xs text-on-surface-variant">
                Your peers will verify before $CC is released.
              </p>

              <label className="block">
                <div className="font-meta text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
                  What did you do?
                </div>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  rows={5}
                  className="input-line w-full px-3 py-2 text-sm focus:outline-none resize-y"
                  placeholder="Describe the outcome, decisions made, and any blockers."
                />
              </label>

              <label className="block">
                <div className="font-meta text-xs uppercase tracking-widest text-on-surface-variant mb-1.5">
                  Evidence
                  <span className="normal-case tracking-normal text-on-surface-variant ml-2">
                    (link to photos, commits, or files)
                  </span>
                </div>
                <input
                  type="url"
                  value={reportEvidence}
                  onChange={(e) => setReportEvidence(e.target.value)}
                  placeholder="https://…"
                  className="input-line w-full px-3 py-2 text-sm focus:outline-none"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingFor(null)}
                  className="px-3 py-1.5 text-sm text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitReport}
                  className="btn-primary px-4 py-2 text-sm rounded-md font-medium"
                >
                  Submit report
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 font-meta text-sm whitespace-nowrap rounded-md transition-colors ${
        active
          ? "bg-primary text-on-primary"
          : "text-on-surface-variant hover:text-primary-dim bg-surface-container-low"
      }`}
    >
      {children}
    </button>
  );
}
