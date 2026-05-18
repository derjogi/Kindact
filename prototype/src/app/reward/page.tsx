"use client";

import Layout from "@/components/Layout";

// Mock mint event for the brief's Screen 9. In production this lands when the
// verifier dashboard accepts a work report.
const MINT = {
  amount: 220,
  currency: "$CC",
  issueTitle: "Translate constitution into Te Reo Māori",
  issueId: "issue-12",
  workPackage: "Draft chapters 1–3",
  verifiedBy: ["Ana — Tenants' Union", "Imo — Solarpunk DAO", "Council seat 3"],
  mintedAt: "2026-05-19T14:22:00Z",
  txHash: "0x7c4e…b91a",
};

const HYPERCERT = {
  serial: "kindact:hc:2026-0042",
  scope: "global",
  impactClaim:
    "Made the constitution legible to ~120,000 Te Reo speakers, lowering the bar to civic participation.",
  contributors: ["you"],
  validFrom: "2026-05-19",
  validUntil: "2031-05-19",
};

export default function RewardPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Editorial header */}
        <section className="p-6 bg-surface-container-lowest rounded-md border-l-4 border-tertiary card-lift">
          <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
            Reward &amp; Impact
          </p>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            Your contribution was verified.
          </h1>
          <p className="font-sans text-base leading-[1.6] text-on-surface-variant mt-2">
            $CC has been minted to your ledger, and an impact credential has
            been written to the Civic Archive.
          </p>
        </section>

        {/* Mint card — celebratory but restrained */}
        <article className="bg-surface-container-lowest rounded-md p-8 text-center space-y-4 card-lift">
          <div className="text-6xl" aria-hidden>
            ✨
          </div>
          <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
            Minted
          </p>
          <div className="font-display text-5xl font-bold text-primary-dim">
            +{MINT.amount} {MINT.currency}
          </div>
          <p className="font-sans text-base text-on-surface max-w-prose mx-auto">
            for{" "}
            <a
              href={`/issues/${MINT.issueId}`}
              className="text-primary-dim underline-offset-2 hover:underline"
            >
              {MINT.issueTitle}
            </a>{" "}
            — work package <em>{MINT.workPackage}</em>.
          </p>
          <div className="font-meta text-xs text-on-surface-variant pt-2">
            {new Date(MINT.mintedAt).toLocaleString()} ·{" "}
            <span className="font-mono">{MINT.txHash}</span>
          </div>
        </article>

        {/* Verified by */}
        <section className="bg-surface-container-lowest rounded-md p-6 space-y-3 card-lift">
          <h2 className="font-display text-lg font-semibold text-on-surface">
            Verified by
          </h2>
          <ul className="space-y-2">
            {MINT.verifiedBy.map((v) => (
              <li
                key={v}
                className="flex items-center gap-2 font-meta text-sm text-on-surface"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-status-deliberating" />
                {v}
              </li>
            ))}
          </ul>
        </section>

        {/* Hypercert card */}
        <article className="bg-surface-container-lowest rounded-md overflow-hidden card-lift">
          <header className="p-6 bg-tertiary-container">
            <p className="font-meta text-[10px] uppercase tracking-widest text-tertiary mb-1">
              Hypercert · impact credential
            </p>
            <h2 className="font-display text-2xl font-bold text-on-surface">
              {HYPERCERT.impactClaim}
            </h2>
          </header>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <Fact label="Serial" value={HYPERCERT.serial} mono />
            <Fact label="Scope" value={HYPERCERT.scope} />
            <Fact
              label="Contributors"
              value={HYPERCERT.contributors.join(", ")}
            />
            <Fact
              label="Valid from"
              value={new Date(HYPERCERT.validFrom).toLocaleDateString()}
            />
            <Fact
              label="Valid until"
              value={new Date(HYPERCERT.validUntil).toLocaleDateString()}
            />
          </div>
          <footer className="px-6 py-4 bg-surface-container-low flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              className="px-3 py-1.5 rounded-md bg-surface-container-lowest hover:bg-surface-container text-on-surface text-sm card-lift"
            >
              Download PDF
            </button>
            <button
              type="button"
              className="btn-primary px-4 py-2 rounded-md text-sm font-medium"
            >
              Share to feed
            </button>
          </footer>
        </article>

        <p className="font-meta text-xs text-on-surface-variant text-center pt-2">
          $CC decays ~1% per month so the community keeps moving. Impact
          credentials are permanent.
        </p>
      </div>
    </Layout>
  );
}

function Fact({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
        {label}
      </div>
      <div className={`text-on-surface mt-0.5 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </div>
    </div>
  );
}
