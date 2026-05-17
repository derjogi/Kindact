"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import IssueCard from "@/components/IssueCard";
import { fetchIssues } from "@/lib/api";
import type { IssueListItem } from "@/lib/types";

type Source = "subscriptions" | "cells" | "all";

const STATUS_PILLS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "deliberating", label: "Deliberating" },
  { value: "vote_ready", label: "Voting" },
  { value: "adopted", label: "Adopted" },
  { value: "implementing", label: "Implementing" },
  { value: "completed", label: "Completed" },
];

export default function IssueFeed() {
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [source, setSource] = useState<Source>("subscriptions");
  const [issues, setIssues] = useState<IssueListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const filters: {
      status?: string;
      scope?: string;
      search?: string;
      source?: Source;
    } = { source };
    if (statusFilter !== "all") filters.status = statusFilter;
    if (scopeFilter !== "all") filters.scope = scopeFilter;
    if (search) filters.search = search;

    fetchIssues(filters)
      .then((items) => {
        if (!cancelled) setIssues(items as IssueListItem[]);
      })
      .catch(() => {
        if (!cancelled) setIssues([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, scopeFilter, statusFilter, source]);

  return (
    <Layout wide>
      {/* Community Health Bar — accent rail on the left, editorial type */}
      <section className="p-6 bg-surface-container-lowest rounded-md border-l-4 border-primary card-lift">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
              Community Pulse
            </p>
            <h1 className="font-display text-3xl font-bold text-on-surface">
              Network Health Overview
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <Metric label="$CC Minted" value="1.2M" />
            <Metric label="Verified Actions" value="15" />
            <Metric label="Active Issues" value="42" />
          </div>
        </div>
      </section>

      {/* Source tabs (subscriptions / cells / all) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 text-sm">
          <SourceTab
            active={source === "subscriptions"}
            onClick={() => setSource("subscriptions")}
          >
            My subscriptions
          </SourceTab>
          <SourceTab
            active={source === "cells"}
            onClick={() => setSource("cells")}
          >
            My cells
          </SourceTab>
          <SourceTab active={source === "all"} onClick={() => setSource("all")}>
            All public
          </SourceTab>
        </div>
        <Link
          href="/cells/settings"
          className="font-meta text-xs text-on-surface-variant underline whitespace-nowrap"
        >
          Manage…
        </Link>
      </div>

      {/* Search + scope filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the archive…"
            className="w-full pl-11 pr-4 py-3 rounded-md bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant border border-transparent focus:outline-none focus:border-primary card-lift"
          />
        </div>
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className="px-4 py-3 rounded-md bg-surface-container-lowest text-sm text-on-surface focus:outline-none card-lift"
        >
          <option value="all">All scopes</option>
          <option value="local">Local</option>
          <option value="national">National</option>
          <option value="global">Global</option>
        </select>
      </div>

      {/* Status pill row */}
      <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide">
        {STATUS_PILLS.map((s) => {
          const active = statusFilter === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-4 py-1.5 rounded-full font-meta text-xs whitespace-nowrap transition-colors ${
                active
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:text-primary-dim bg-surface-container-low"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Issue cards grid */}
      {loading ? (
        <p className="text-center text-on-surface-variant py-12 font-meta text-sm">
          Loading issues…
        </p>
      ) : issues.length === 0 ? (
        <EmptyState source={source} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}

      {/* Floating "new issue" action (desktop) */}
      <Link
        href="/issues/new"
        className="hidden md:flex fixed bottom-8 right-8 w-14 h-14 btn-primary rounded-full elevation-floating items-center justify-center text-2xl z-50 group"
        aria-label="New Issue"
      >
        ＋
        <span className="absolute right-full mr-4 px-3 py-1.5 bg-on-surface text-surface font-meta text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
          New Issue
        </span>
      </Link>
    </Layout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-left">
      <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
        {label}
      </p>
      <p className="font-display text-2xl font-semibold text-primary-dim">
        {value}
      </p>
    </div>
  );
}

function SourceTab({
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
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full font-meta text-sm transition-colors ${
        active
          ? "bg-primary text-on-primary"
          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ source }: { source: Source }) {
  if (source === "subscriptions") {
    return (
      <div className="text-center py-12 text-on-surface-variant text-sm space-y-2">
        <p>No issues match your subscriptions.</p>
        <p>
          <Link href="/anchors" className="underline">
            Browse anchors
          </Link>{" "}
          to subscribe to topics or places.
        </p>
      </div>
    );
  }
  if (source === "cells") {
    return (
      <div className="text-center py-12 text-on-surface-variant text-sm space-y-2">
        <p>No issues in cells you have joined.</p>
        <p>
          <Link href="/cells" className="underline">
            Browse cells
          </Link>{" "}
          to join one.
        </p>
      </div>
    );
  }
  return (
    <p className="text-center text-on-surface-variant py-12">
      No issues match your filters.
    </p>
  );
}
