"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import AnchorPill from "@/components/AnchorPill";
import IssueCard from "@/components/IssueCard";
import {
  fetchAnchor,
  fetchAnchorIssues,
  subscribeAnchor,
  unsubscribeAnchor,
} from "@/lib/api";
import type { AnchorDetail, IssueListItem } from "@/lib/types";

const kindGlyph: Record<string, string> = {
  topic: "#",
  location: "📍",
  event: "🎪",
  cell: "🔁",
};

export default function AnchorDetailPage() {
  const params = useParams();
  const rawId = decodeURIComponent(String(params.id ?? ""));

  const [anchor, setAnchor] = useState<AnchorDetail | null>(null);
  const [issues, setIssues] = useState<IssueListItem[]>([]);
  const [includeChildren, setIncludeChildren] = useState(true);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const a = await fetchAnchor(rawId);
      setAnchor(a);
      const items = await fetchAnchorIssues(rawId, includeChildren);
      setIssues(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawId, includeChildren]);

  async function onToggleSub() {
    if (!anchor) return;
    setActing(true);
    try {
      if (anchor.subscription) {
        await unsubscribeAnchor(anchor.anchorId);
      } else {
        await subscribeAnchor(anchor.anchorId);
      }
      await load();
    } finally {
      setActing(false);
    }
  }

  if (loading && !anchor) {
    return (
      <Layout>
        <p className="font-meta text-sm text-on-surface-variant text-center py-12">
          Loading anchor…
        </p>
      </Layout>
    );
  }
  if (error || !anchor) {
    return (
      <Layout>
        <p className="text-status-adopted text-center py-12">
          {error ?? "Anchor not found."}
        </p>
      </Layout>
    );
  }

  const isSub = !!anchor.subscription && !anchor.subscription.muted;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Editorial header */}
        <section className="p-6 bg-surface-container-lowest rounded-md border-l-4 border-primary card-lift">
          <Link
            href="/anchors"
            className="font-meta text-xs text-on-surface-variant hover:text-primary-dim"
          >
            ← All anchors
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-on-surface">
              <span className="text-on-surface-variant mr-1">
                {kindGlyph[anchor.kind]}
              </span>
              {anchor.kind === "topic"
                ? anchor.displayName.replace(/^#/, "")
                : anchor.displayName}
            </h1>
            <span className="font-meta text-[10px] uppercase tracking-widest text-on-primary-container bg-surface-container px-2 py-0.5 rounded">
              {anchor.kind}
            </span>
          </div>
          <p className="font-mono font-meta text-xs text-on-surface-variant mt-1">
            {anchor.anchorId}
          </p>
        </section>

        {/* Parent breadcrumbs */}
        {anchor.parents.length > 0 ? (
          <div className="font-meta text-xs text-on-surface-variant flex items-center gap-1 flex-wrap">
            <span>parents:</span>
            {anchor.parents.map((p) => (
              <AnchorPill key={p.id} anchor={p} />
            ))}
          </div>
        ) : null}

        {/* Action bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onToggleSub}
            disabled={acting}
            className={
              isSub
                ? "px-3 py-1.5 rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface text-sm transition-colors"
                : "btn-primary px-4 py-2 rounded-md text-sm font-medium"
            }
          >
            {acting ? "…" : isSub ? "Unsubscribe" : "Subscribe"}
          </button>
          <span className="font-meta text-xs text-on-surface-variant">
            {anchor.subscriberCount} subscribers · {anchor.issueCount} direct
            issue{anchor.issueCount === 1 ? "" : "s"}
          </span>
        </div>

        {anchor.description ? (
          <p className="font-sans text-base leading-[1.6] text-on-surface">
            {anchor.description}
          </p>
        ) : null}

        {/* Children */}
        {anchor.children.length > 0 ? (
          <div>
            <div className="font-meta text-xs uppercase tracking-widest text-on-surface-variant mb-2">
              Child anchors
            </div>
            <div className="flex flex-wrap gap-1.5">
              {anchor.children.map((c) => (
                <AnchorPill key={c.id} anchor={c} />
              ))}
            </div>
          </div>
        ) : null}

        {/* Issues */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-display text-lg font-semibold text-on-surface">
              Issues ({issues.length})
            </h2>
            <label className="font-meta text-xs text-on-surface-variant flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={includeChildren}
                onChange={(e) => setIncludeChildren(e.target.checked)}
              />
              Include child anchors
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.length === 0 ? (
              <p className="font-meta text-sm text-on-surface-variant">
                No issues are linked to this anchor yet.
              </p>
            ) : (
              issues.map((i) => <IssueCard key={i.id} issue={i} />)
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
