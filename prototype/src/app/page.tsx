"use client";

import { useState } from "react";
import Layout from "@/components/Layout";
import IssueCard from "@/components/IssueCard";
import { issues } from "@/lib/mock-data";
import { IssueStatus, Scope } from "@/lib/types";

export default function IssueFeed() {
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<Scope | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");

  const filtered = issues.filter((issue) => {
    if (search && !issue.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (scopeFilter !== "all" && issue.scope !== scopeFilter) return false;
    if (statusFilter !== "all" && issue.status !== statusFilter) return false;
    return true;
  });

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
            onChange={(e) => setScopeFilter(e.target.value as Scope | "all")}
            className="px-3 py-1.5 border border-stone-200 rounded-lg bg-white text-stone-600 focus:outline-none"
          >
            <option value="all">All scopes</option>
            <option value="local">Local</option>
            <option value="national">National</option>
            <option value="global">Global</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as IssueStatus | "all")
            }
            className="px-3 py-1.5 border border-stone-200 rounded-lg bg-white text-stone-600 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="deliberating">Deliberating</option>
            <option value="vote-ready">Voting</option>
            <option value="adopted">Adopted</option>
            <option value="implementing">Implementing</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Issue list */}
        <div className="space-y-2">
          {filtered.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-stone-400 py-12">
              No issues match your filters.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
