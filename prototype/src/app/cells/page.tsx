"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import CellBadge from "@/components/CellBadge";
import { fetchCells } from "@/lib/api";
import type { CellSummary } from "@/lib/types";

const TIERS = ["all", "canonical", "promoted", "uncurated"] as const;

export default function CellBrowser() {
  const [cells, setCells] = useState<CellSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<(typeof TIERS)[number]>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const filters: { tier?: string; search?: string } = {};
    if (tier !== "all") filters.tier = tier;
    if (search) filters.search = search;
    fetchCells(filters)
      .then((items) => {
        if (!cancelled) setCells(items);
      })
      .catch(() => {
        if (!cancelled) setCells([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, tier]);

  return (
    <Layout>
      <div className="space-y-5">
        {/* Editorial header */}
        <section className="p-6 bg-surface-container-lowest rounded-md border-l-4 border-primary card-lift">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                The Archive
              </p>
              <h1 className="font-display text-3xl font-bold text-on-surface">
                Cells
              </h1>
              <p className="font-sans text-sm text-on-surface-variant mt-1">
                Bounded communities you can{" "}
                <span className="font-medium text-on-surface">subscribe to</span>{" "}
                (read) or{" "}
                <span className="font-medium text-on-surface">join</span> (post
                &amp; vote).
              </p>
            </div>
            <Link
              href="/cells/new"
              className="btn-primary rounded-md px-4 py-2 text-sm font-medium self-start md:self-auto"
            >
              + New cell
            </Link>
          </div>
        </section>

        {/* Search + tier */}
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cells…"
            className="flex-1 px-4 py-3 rounded-md bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none card-lift"
          />
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as (typeof TIERS)[number])}
            className="px-4 py-3 rounded-md bg-surface-container-lowest text-sm text-on-surface focus:outline-none card-lift"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All tiers" : t}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="font-meta text-xs text-on-surface-variant flex flex-wrap gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-status-deliberating" />
            canonical
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-status-voting" />
            promoted
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-on-surface-variant" />
            uncurated
          </span>
        </div>

        {/* Cell list */}
        <div className="space-y-3">
          {loading ? (
            <p className="font-meta text-sm text-on-surface-variant text-center py-12">
              Loading cells…
            </p>
          ) : cells.length === 0 ? (
            <p className="font-meta text-sm text-on-surface-variant text-center py-12">
              No cells match your filters.
            </p>
          ) : (
            cells.map((c) => <CellRow key={c.id} cell={c} />)
          )}
        </div>
      </div>
    </Layout>
  );
}

function CellRow({ cell }: { cell: CellSummary }) {
  return (
    <Link
      href={`/cells/${encodeURIComponent(cell.cellId)}`}
      className="block rounded-md bg-surface-container-lowest px-5 py-4 card-lift transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CellBadge cell={cell} linkTo="none" />
            <span className="font-mono font-meta text-xs text-on-surface-variant truncate">
              {cell.cellId}
            </span>
            {cell.isMember ? (
              <span className="font-meta text-[10px] text-on-primary-container bg-primary-container px-1.5 py-0.5 rounded-full">
                ✓ member
              </span>
            ) : null}
          </div>
          <p className="font-sans text-sm text-on-surface mt-1.5 line-clamp-2">
            {cell.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-meta text-xs text-on-surface-variant">
            <span className="capitalize">{cell.scopeLevel}</span>
            <span>·</span>
            <span>{cell.memberCount} members</span>
            <span>·</span>
            <span>{cell.issueCount} issues</span>
            {cell.jurisdictionalClaims.length > 0 ? (
              <>
                <span>·</span>
                <span title={cell.jurisdictionalClaims.join(", ")}>
                  ⚖ {cell.jurisdictionalClaims.length} claim
                  {cell.jurisdictionalClaims.length === 1 ? "" : "s"}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
