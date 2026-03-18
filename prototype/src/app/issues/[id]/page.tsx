"use client";

import { use, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import VoteBar from "@/components/VoteBar";
import CommentThread from "@/components/CommentThread";
import HoverToolbar from "@/components/HoverToolbar";
import { getIssue } from "@/lib/mock-data";

const statusColors: Record<string, string> = {
  draft: "bg-stone-400",
  deliberating: "bg-emerald-500",
  "vote-ready": "bg-blue-500",
  adopted: "bg-violet-500",
  implementing: "bg-amber-500",
  completed: "bg-stone-600",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  deliberating: "Deliberating",
  "vote-ready": "Voting",
  adopted: "Adopted",
  implementing: "Implementing",
  completed: "Completed",
};

type Tab = "description" | "comments" | "procon" | "history";

export default function IssueDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const issue = getIssue(id);
  const [activeTab, setActiveTab] = useState<Tab>("comments");

  if (!issue) {
    return (
      <Layout>
        <p className="text-center text-stone-400 py-12">Issue not found.</p>
      </Layout>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "description", label: "Description" },
    { key: "comments", label: `Comments (${issue.comments.length})` },
    { key: "procon", label: `Pro/Con (${issue.arguments.length})` },
    { key: "history", label: "History" },
  ];

  return (
    <Layout>
      <div className="space-y-4">
        {/* Back link */}
        <Link
          href="/"
          className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← Back to Issues
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg border border-stone-200 p-5">
          <h1 className="text-xl font-semibold text-stone-900">
            {issue.title}
          </h1>
          <p className="mt-1 text-stone-600">{issue.summary}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${statusColors[issue.status]}`}
              />
              {statusLabels[issue.status]}
            </span>
            <span className="capitalize">{issue.scope}</span>
            <span>{issue.participants} participants</span>
          </div>

          {/* Metrics with hover-to-act */}
          {issue.metrics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {issue.metrics.map((m) => (
                <HoverToolbar key={m.label}>
                  <div className="px-3 py-2 bg-stone-50 rounded-lg border border-stone-100 text-sm cursor-default">
                    <span className="text-stone-500">{m.label}:</span>{" "}
                    <span className="font-medium text-stone-800">
                      {m.value}
                    </span>
                    <span className="ml-1 text-xs text-stone-400">
                      ({m.confidence} conf.)
                    </span>
                  </div>
                </HoverToolbar>
              ))}
            </div>
          )}
        </div>

        {/* AI Summary */}
        <HoverToolbar>
          <div className="bg-white rounded-lg border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide">
                Summary
              </h2>
              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                🟢 Updated recently
              </span>
            </div>
            <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
              {issue.aiSummary}
            </div>
          </div>
        </HoverToolbar>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <div className="flex border-b border-stone-200 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 min-h-[44px] text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "text-stone-900 font-medium border-b-2 border-stone-800"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === "description" && (
              <div className="prose prose-stone prose-sm max-w-none whitespace-pre-line">
                {issue.description}
              </div>
            )}

            {activeTab === "comments" && (
              <CommentThread comments={issue.comments} issueId={issue.id} />
            )}

            {activeTab === "procon" && (
              <div className="space-y-3">
                {issue.arguments.length === 0 ? (
                  <p className="text-sm text-stone-400">
                    No arguments yet. Be the first to add one.
                  </p>
                ) : (
                  issue.arguments
                    .filter((a) => a.parentId === null)
                    .map((arg) => {
                      const children = issue.arguments.filter(
                        (a) => a.parentId === arg.id
                      );
                      return (
                        <div key={arg.id}>
                          <HoverToolbar>
                            <div
                              className={`p-3 rounded-lg border-l-4 ${
                                arg.type === "pro"
                                  ? "border-emerald-400 bg-emerald-50/50"
                                  : "border-rose-400 bg-rose-50/50"
                              }`}
                            >
                              <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
                                <span>{arg.emoji}</span>
                                <span>Anonymous {arg.alias}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded font-medium ${
                                    arg.type === "pro"
                                      ? "text-emerald-600"
                                      : "text-rose-600"
                                  }`}
                                >
                                  {arg.type.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-stone-700">
                                {arg.text}
                              </p>
                            </div>
                          </HoverToolbar>
                          {children.map((child) => (
                            <div key={child.id} className="ml-6 mt-2">
                              <HoverToolbar>
                                <div
                                  className={`p-3 rounded-lg border-l-4 ${
                                    child.type === "pro"
                                      ? "border-emerald-400 bg-emerald-50/50"
                                      : "border-rose-400 bg-rose-50/50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
                                    <span>{child.emoji}</span>
                                    <span>Anonymous {child.alias}</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-medium ${
                                        child.type === "pro"
                                          ? "text-emerald-600"
                                          : "text-rose-600"
                                      }`}
                                    >
                                      {child.type.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-stone-700">
                                    {child.text}
                                  </p>
                                </div>
                              </HoverToolbar>
                            </div>
                          ))}
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="text-sm text-stone-400 space-y-2">
                <p>
                  📝 Issue created — {issue.createdAt}
                </p>
                <p>📝 Description updated — 2d ago</p>
                <p>📊 Metrics added (cost, time) — 1d ago</p>
              </div>
            )}
          </div>
        </div>

        {/* Vote bar */}
        <VoteBar issue={issue} />
      </div>
    </Layout>
  );
}
