"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import AnchorPill from "@/components/AnchorPill";
import { fetchAnchors } from "@/lib/api";
import type { AnchorSummary } from "@/lib/types";

const KINDS = ["all", "topic", "location", "event"] as const;

export default function AnchorBrowser() {
  const [anchors, setAnchors] = useState<AnchorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const filters: { kind?: string; search?: string } = {};
    if (kind !== "all") filters.kind = kind;
    if (search) filters.search = search;
    fetchAnchors(filters)
      .then((items) => {
        if (!cancelled) setAnchors(items);
      })
      .catch(() => {
        if (!cancelled) setAnchors([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, kind]);

  // Tree view: roots = anchors with no parent that is itself in the visible set.
  const idSet = useMemo(() => new Set(anchors.map((a) => a.id)), [anchors]);
  const childrenByParent = useMemo(() => {
    const m = new Map<string, AnchorSummary[]>();
    for (const a of anchors) {
      for (const p of a.parentIds) {
        if (!idSet.has(p)) continue;
        if (!m.has(p)) m.set(p, []);
        m.get(p)!.push(a);
      }
    }
    return m;
  }, [anchors, idSet]);
  const roots = useMemo(
    () => anchors.filter((a) => !a.parentIds.some((p) => idSet.has(p))),
    [anchors, idSet],
  );

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Anchors</h1>
          <p className="text-sm text-stone-500">
            Global topic / location / event handles. Subscribe to follow them across cells —
            no membership required.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search anchors..."
            className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as (typeof KINDS)[number])}
            className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k === "all" ? "All kinds" : k}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-stone-500">
          <Link href="/cells/settings" className="underline">
            View / edit your subscriptions →
          </Link>
        </div>

        {loading ? (
          <p className="text-stone-400 text-center py-8">Loading anchors…</p>
        ) : anchors.length === 0 ? (
          <p className="text-stone-400 text-center py-8">No anchors match your filters.</p>
        ) : (
          <div className="space-y-1.5">
            {roots.map((a) => (
              <AnchorTreeRow
                key={a.id}
                anchor={a}
                childrenByParent={childrenByParent}
                depth={0}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function AnchorTreeRow({
  anchor,
  childrenByParent,
  depth,
}: {
  anchor: AnchorSummary;
  childrenByParent: Map<string, AnchorSummary[]>;
  depth: number;
}) {
  const kids = childrenByParent.get(anchor.id) ?? [];
  return (
    <div>
      <Link
        href={`/anchors/${encodeURIComponent(anchor.anchorId)}`}
        className="flex items-center gap-2 hover:bg-stone-50 px-2 py-1.5 rounded-lg"
        style={{ marginLeft: depth * 16 }}
      >
        <AnchorPill anchor={anchor} state={anchor.isSubscribed ? "subscribed" : "default"} />
        <span className="text-xs text-stone-400">
          {anchor.issueCount} issues · {anchor.subscriberCount} subscribers
        </span>
      </Link>
      {kids.map((c) => (
        <AnchorTreeRow
          key={c.id}
          anchor={c}
          childrenByParent={childrenByParent}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
