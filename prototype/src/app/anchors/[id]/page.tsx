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
        <p className="text-stone-400 text-center py-12">Loading anchor…</p>
      </Layout>
    );
  }
  if (error || !anchor) {
    return (
      <Layout>
        <p className="text-red-600 text-center py-12">{error ?? "Anchor not found."}</p>
      </Layout>
    );
  }

  const isSub = !!anchor.subscription && !anchor.subscription.muted;

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <Link href="/anchors" className="text-xs text-stone-500 hover:text-stone-700">
            ← All anchors
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-stone-900">
              <span className="text-stone-400 mr-1">{kindGlyph[anchor.kind]}</span>
              {anchor.kind === "topic"
                ? anchor.displayName.replace(/^#/, "")
                : anchor.displayName}
            </h1>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 border border-stone-200 px-1.5 py-0.5 rounded">
              {anchor.kind}
            </span>
          </div>
          <p className="text-xs font-mono text-stone-400 mt-1">{anchor.anchorId}</p>
        </div>

        {/* Parent breadcrumbs */}
        {anchor.parents.length > 0 ? (
          <div className="text-xs text-stone-500 flex items-center gap-1 flex-wrap">
            <span className="text-stone-400">parents:</span>
            {anchor.parents.map((p) => (
              <AnchorPill key={p.id} anchor={p} />
            ))}
          </div>
        ) : null}

        {/* Action bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSub}
            disabled={acting}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              isSub
                ? "border border-stone-300 text-stone-700 hover:bg-stone-50"
                : "bg-stone-800 text-white hover:bg-stone-700"
            }`}
          >
            {acting ? "…" : isSub ? "Unsubscribe" : "Subscribe"}
          </button>
          <span className="text-xs text-stone-400">
            {anchor.subscriberCount} subscribers · {anchor.issueCount} direct issue
            {anchor.issueCount === 1 ? "" : "s"}
          </span>
        </div>

        {anchor.description ? (
          <p className="text-stone-700">{anchor.description}</p>
        ) : null}

        {/* Children */}
        {anchor.children.length > 0 ? (
          <div>
            <div className="text-xs uppercase tracking-wide text-stone-400 mb-1">
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-stone-700">
              Issues ({issues.length})
            </h2>
            <label className="text-xs text-stone-500 flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={includeChildren}
                onChange={(e) => setIncludeChildren(e.target.checked)}
              />
              Include child anchors
            </label>
          </div>
          <div className="space-y-2">
            {issues.length === 0 ? (
              <p className="text-stone-400 text-sm">
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
