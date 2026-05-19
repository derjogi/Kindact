"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import IssueCard from "@/components/IssueCard";
import { fetchIssues } from "@/lib/api";

export default function IssueFeed() {
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const filters: { status?: string; scope?: string; search?: string } = {};
    if (statusFilter !== "all") filters.status = statusFilter;
    if (scopeFilter !== "all") filters.scope = scopeFilter;
    if (search) filters.search = search;

    fetchIssues(filters)
      .then((items) => {
        if (!cancelled) setIssues(items as any[]);
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
  }, [search, scopeFilter, statusFilter]);

  return (
    <Layout>
      <div className="space-y-4">
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
            <p className="text-center text-stone-400 py-12">
              No issues match your filters.
            </p>
          ) : (
            issues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
          )}
        </div>
      </div>
    </Layout>
  );
}
