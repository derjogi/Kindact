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
      <div className="space-y-5">
        {/* Editorial header */}
        <section className="p-6 bg-surface-container-lowest rounded-md border-l-4 border-primary card-lift">
          <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
            The Archive
          </p>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            Anchors
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mt-1">
            Global topic / location / event handles. Subscribe to follow them
            across cells — no membership required.
          </p>
        </section>

        {/* Search + kind */}
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search anchors…"
            className="flex-1 px-4 py-3 rounded-md bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none card-lift"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as (typeof KINDS)[number])}
            className="px-4 py-3 rounded-md bg-surface-container-lowest text-sm text-on-surface focus:outline-none card-lift"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k === "all" ? "All kinds" : k}
              </option>
            ))}
          </select>
        </div>

        <div className="font-meta text-xs text-on-surface-variant">
          <Link href="/cells/settings" className="underline">
            View / edit your subscriptions →
          </Link>
        </div>

        {loading ? (
          <p className="font-meta text-sm text-on-surface-variant text-center py-12">
            Loading anchors…
          </p>
        ) : anchors.length === 0 ? (
          <p className="font-meta text-sm text-on-surface-variant text-center py-12">
            No anchors match your filters.
          </p>
        ) : (
          <div className="space-y-1.5 bg-surface-container-lowest rounded-md p-3 card-lift">
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
        className="flex items-center gap-2 hover:bg-surface-container-low px-2 py-1.5 rounded-md transition-colors"
        style={{ marginLeft: depth * 16 }}
      >
        <AnchorPill
          anchor={anchor}
          state={anchor.isSubscribed ? "subscribed" : "default"}
        />
        <span className="font-meta text-xs text-on-surface-variant">
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
