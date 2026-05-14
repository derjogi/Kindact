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
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-stone-900">Cells</h1>
            <p className="text-sm text-stone-500">
              Bounded communities you can{" "}
              <span className="font-medium">subscribe to</span> (read) or{" "}
              <span className="font-medium">join</span> (post &amp; vote).
            </p>
          </div>
          <Link
            href="/cells/new"
            className="text-sm bg-stone-800 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700"
          >
            + New cell
          </Link>
        </div>

        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cells..."
            className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400"
          />
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as (typeof TIERS)[number])}
            className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All tiers" : t}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-stone-400 flex gap-4">
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" /> canonical
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-sky-500 mr-1" /> promoted
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-stone-400 mr-1" /> uncurated
          </span>
        </div>

        <div className="space-y-2">
          {loading ? (
            <p className="text-stone-400 text-center py-8">Loading cells…</p>
          ) : cells.length === 0 ? (
            <p className="text-stone-400 text-center py-8">No cells match your filters.</p>
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
      className="block rounded-lg border border-stone-200 bg-white px-4 py-3 hover:border-stone-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CellBadge cell={cell} linkTo="none" />
            <span className="text-xs text-stone-400 truncate">{cell.cellId}</span>
            {cell.isMember ? (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                ✓ member
              </span>
            ) : null}
          </div>
          <p className="text-sm text-stone-600 mt-1.5 line-clamp-2">{cell.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-400">
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
