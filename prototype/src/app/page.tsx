"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import IssueCard from "@/components/IssueCard";
import { fetchIssues } from "@/lib/api";
import type { IssueListItem } from "@/lib/types";

type Source = "subscriptions" | "cells" | "all";

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
    <Layout>
      <div className="space-y-4">
        {/* Source selector — replaces the old "All scopes" framing */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1 text-sm">
            <SourceTab active={source === "subscriptions"} onClick={() => setSource("subscriptions")}>
              My subscriptions
            </SourceTab>
            <SourceTab active={source === "cells"} onClick={() => setSource("cells")}>
              My cells
            </SourceTab>
            <SourceTab active={source === "all"} onClick={() => setSource("all")}>
              All public
            </SourceTab>
          </div>
          <Link
            href="/cells/settings"
            className="text-xs text-stone-500 underline whitespace-nowrap"
          >
            Manage…
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues..."
            className="w-full px-4 py-2.5 pl-10 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            🔍
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 text-sm overflow-x-auto scrollbar-hide">
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="px-3 py-1.5 border border-stone-200 rounded-lg bg-white text-stone-600 focus:outline-none"
          >
            <option value="all">All scopes</option>
            <option value="local">Local</option>
            <option value="national">National</option>
            <option value="global">Global</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-stone-200 rounded-lg bg-white text-stone-600 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="deliberating">Deliberating</option>
            <option value="vote_ready">Voting</option>
            <option value="adopted">Adopted</option>
            <option value="implementing">Implementing</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Issue list */}
        <div className="space-y-2">
          {loading ? (
            <p className="text-center text-stone-400 py-12">Loading issues…</p>
          ) : issues.length === 0 ? (
            <EmptyState source={source} />
          ) : (
            issues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
          )}
        </div>
      </div>
    </Layout>
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
      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
        active
          ? "bg-stone-800 text-white"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ source }: { source: Source }) {
  if (source === "subscriptions") {
    return (
      <div className="text-center py-12 text-stone-500 text-sm space-y-2">
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
      <div className="text-center py-12 text-stone-500 text-sm space-y-2">
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
    <p className="text-center text-stone-400 py-12">No issues match your filters.</p>
  );
}
