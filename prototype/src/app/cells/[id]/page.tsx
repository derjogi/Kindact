"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import CellBadge from "@/components/CellBadge";
import {
  fetchCell,
  joinCell,
  leaveCell,
  forkCell,
  fetchIssues,
} from "@/lib/api";
import IssueCard from "@/components/IssueCard";
import type { CellDetail, IssueListItem } from "@/lib/types";

export default function CellDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = decodeURIComponent(String(params.id ?? ""));

  const [cell, setCell] = useState<CellDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<IssueListItem[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const c = await fetchCell(rawId);
      setCell(c);
      // Fetch issues from this cell — use source=anchor isn't appropriate; we
      // approximate by listing all issues and filtering client-side.
      const items = (await fetchIssues({ source: "all" })) as IssueListItem[];
      setIssues(items.filter((i) => i.cell?.id === c.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawId]);

  async function onJoin() {
    if (!cell) return;
    setActing(true);
    try {
      await joinCell(cell.id);
      await load();
    } finally {
      setActing(false);
    }
  }
  async function onLeave() {
    if (!cell) return;
    setActing(true);
    try {
      await leaveCell(cell.id);
      await load();
    } finally {
      setActing(false);
    }
  }
  async function onFork() {
    if (!cell) return;
    const name = window.prompt(
      "Fork name?",
      `${cell.displayName} (fork)`,
    );
    if (!name) return;
    setActing(true);
    try {
      const created = await forkCell(cell.id, name);
      router.push(`/cells/${encodeURIComponent(created.cellId)}`);
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-stone-400 text-center py-12">Loading cell…</p>
      </Layout>
    );
  }
  if (error || !cell) {
    return (
      <Layout>
        <p className="text-red-600 text-center py-12">
          {error ?? "Cell not found."}
        </p>
      </Layout>
    );
  }

  const writeMode =
    cell.membraneWrite === "public"
      ? "Anyone can write"
      : cell.membraneWrite === "scope_verified"
      ? "Writing requires scope verification"
      : "Invite-only writes";

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <Link href="/cells" className="text-xs text-stone-500 hover:text-stone-700">
            ← All cells
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-stone-900">{cell.displayName}</h1>
            <CellBadge cell={cell} linkTo="none" />
          </div>
          <p className="text-xs font-mono text-stone-400 mt-1">{cell.cellId}</p>
          {cell.forkedFrom ? (
            <p className="text-xs text-stone-500 mt-1">
              ⤴ forked from{" "}
              <Link
                href={`/cells/${encodeURIComponent(cell.forkedFrom.cellId)}`}
                className="underline"
              >
                {cell.forkedFrom.displayName}
              </Link>
            </p>
          ) : null}
        </div>

        {/* Action bar — Subscribe / Join / Fork */}
        <div className="flex flex-wrap gap-2 items-center">
          {cell.viewerRelation === "member" ? (
            <button
              onClick={onLeave}
              disabled={acting}
              className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 text-sm hover:bg-stone-50"
            >
              {acting ? "…" : "Leave cell"}
            </button>
          ) : (
            <button
              onClick={onJoin}
              disabled={acting}
              className="px-3 py-1.5 rounded-lg bg-stone-800 text-white text-sm hover:bg-stone-700"
              title="Join = full member, can post and vote in this cell."
            >
              {acting ? "…" : "Join cell"}
            </button>
          )}
          <button
            onClick={onFork}
            disabled={acting}
            className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 text-sm hover:bg-stone-50"
            title="Create a fork in your uncurated namespace."
          >
            ⑂ Fork
          </button>
          <span className="ml-auto text-xs text-stone-400">
            Subscribe to a topic anchor to read across cells without joining{" "}
            <Link href="/anchors" className="underline">
              (anchors)
            </Link>
          </span>
        </div>

        {/* Description */}
        <p className="text-stone-700">{cell.description}</p>

        {/* Facts grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm bg-stone-50 rounded-lg p-4">
          <Fact label="Tier" value={cell.tier} />
          <Fact label="Scope level" value={cell.scopeLevel} />
          <Fact label="Members" value={String(cell.memberCount)} />
          <Fact label="Issues" value={String(cell.issueCount)} />
          <Fact label="Read membrane" value={cell.membraneRead} />
          <Fact label="Write membrane" value={writeMode} />
          <Fact label="Governance" value={cell.governanceEngine} />
          {cell.locationRefs.length > 0 ? (
            <Fact label="Location refs" value={cell.locationRefs.join(", ")} />
          ) : null}
          {cell.topicTags.length > 0 ? (
            <Fact label="Topic tags" value={cell.topicTags.join(" · ")} />
          ) : null}
          {cell.scopeProofTypes.length > 0 ? (
            <Fact label="Scope proofs" value={cell.scopeProofTypes.join(", ")} />
          ) : null}
          {cell.jurisdictionalClaims.length > 0 ? (
            <Fact label="Jurisdictional claims" value={cell.jurisdictionalClaims.join(", ")} />
          ) : null}
        </div>

        {/* Issues in this cell */}
        <div>
          <h2 className="text-sm font-semibold text-stone-700 mb-2">
            Issues in this cell ({issues.length})
          </h2>
          <div className="space-y-2">
            {issues.length === 0 ? (
              <p className="text-stone-400 text-sm">No issues yet.</p>
            ) : (
              issues.map((i) => <IssueCard key={i.id} issue={i} />)
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-stone-400">{label}</div>
      <div className="text-stone-700">{value}</div>
    </div>
  );
}
