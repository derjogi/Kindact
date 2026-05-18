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
        <p className="font-meta text-sm text-on-surface-variant text-center py-12">
          Loading cell…
        </p>
      </Layout>
    );
  }
  if (error || !cell) {
    return (
      <Layout>
        <p className="text-status-adopted text-center py-12">
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
      <div className="space-y-6">
        {/* Editorial header */}
        <section className="p-6 bg-surface-container-lowest rounded-md border-l-4 border-primary card-lift">
          <Link
            href="/cells"
            className="font-meta text-xs text-on-surface-variant hover:text-primary-dim"
          >
            ← All cells
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-on-surface">
              {cell.displayName}
            </h1>
            <CellBadge cell={cell} linkTo="none" />
          </div>
          <p className="font-mono font-meta text-xs text-on-surface-variant mt-1">
            {cell.cellId}
          </p>
          {cell.forkedFrom ? (
            <p className="font-meta text-xs text-on-surface-variant mt-1">
              ⤴ forked from{" "}
              <Link
                href={`/cells/${encodeURIComponent(cell.forkedFrom.cellId)}`}
                className="underline text-primary-dim"
              >
                {cell.forkedFrom.displayName}
              </Link>
            </p>
          ) : null}
        </section>

        {/* Action bar */}
        <div className="flex flex-wrap gap-2 items-center">
          {cell.viewerRelation === "member" ? (
            <button
              onClick={onLeave}
              disabled={acting}
              className="px-3 py-1.5 rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface text-sm transition-colors"
            >
              {acting ? "…" : "Leave cell"}
            </button>
          ) : (
            <button
              onClick={onJoin}
              disabled={acting}
              className="btn-primary px-4 py-2 rounded-md text-sm font-medium"
              title="Join = full member, can post and vote in this cell."
            >
              {acting ? "…" : "Join cell"}
            </button>
          )}
          <button
            onClick={onFork}
            disabled={acting}
            className="px-3 py-1.5 rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface text-sm transition-colors"
            title="Create a fork in your uncurated namespace."
          >
            ⑂ Fork
          </button>
          <span className="ml-auto font-meta text-xs text-on-surface-variant">
            Subscribe to a topic anchor to read across cells without joining{" "}
            <Link href="/anchors" className="underline">
              (anchors)
            </Link>
          </span>
        </div>

        {/* Description */}
        <p className="font-sans text-base leading-[1.6] text-on-surface">
          {cell.description}
        </p>

        {/* Facts grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm bg-surface-container-low rounded-md p-5">
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
            <Fact
              label="Jurisdictional claims"
              value={cell.jurisdictionalClaims.join(", ")}
            />
          ) : null}
        </div>

        {/* Issues */}
        <div>
          <h2 className="font-display text-lg font-semibold text-on-surface mb-3">
            Issues in this cell ({issues.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.length === 0 ? (
              <p className="font-meta text-sm text-on-surface-variant">
                No issues yet.
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
        {label}
      </div>
      <div className="text-on-surface mt-0.5">{value}</div>
    </div>
  );
}
