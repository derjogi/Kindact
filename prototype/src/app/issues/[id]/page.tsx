"use client";

import { use, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Layout from "@/components/Layout";
import VoteBar from "@/components/VoteBar";
import CommentThread from "@/components/CommentThread";
import HoverToolbar from "@/components/HoverToolbar";
import { getIssue } from "@/lib/mock-data";
import { PlanetaryBoundary } from "@/lib/types";

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

const directionStyles: Record<string, { color: string; arrow: string }> = {
  improve: { color: "text-emerald-600", arrow: "↑" },
  regress: { color: "text-rose-600", arrow: "↓" },
  neutral: { color: "text-stone-400", arrow: "→" },
};

function BoundaryChip({ b }: { b: PlanetaryBoundary }) {
  const style = directionStyles[b.direction];
  const [showToolbar, setShowToolbar] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustValue, setAdjustValue] = useState("");

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => {
        if (!showAdjust) setShowToolbar(false);
      }}
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-100 text-sm cursor-default">
        <span>{b.icon}</span>
        <span className="text-stone-600 text-xs">{b.label}</span>
        <span className={`font-semibold text-xs ${style.color}`}>
          {style.arrow} {b.delta}
        </span>
      </div>

      {showToolbar && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-800 text-white rounded-lg px-2 py-1 flex gap-1 shadow-lg z-10 text-sm">
          <button className="hover:bg-stone-700 px-1.5 py-0.5 rounded transition-colors" title="Upvote">👍</button>
          <button className="hover:bg-stone-700 px-1.5 py-0.5 rounded transition-colors" title="Downvote">👎</button>
          <button className="hover:bg-stone-700 px-1.5 py-0.5 rounded transition-colors" title="Comment">💬</button>
          <button
            onClick={() => setShowAdjust(!showAdjust)}
            className={`hover:bg-stone-700 px-1.5 py-0.5 rounded transition-colors ${showAdjust ? "bg-stone-600" : ""}`}
            title="Suggest different impact"
          >
            ↕️
          </button>
          <button className="hover:bg-stone-700 px-1.5 py-0.5 rounded transition-colors" title="Flag">🏴</button>
        </div>
      )}

      {showAdjust && (
        <div className="mt-1.5 flex gap-1.5 items-center">
          <input
            type="number"
            value={adjustValue}
            onChange={(e) => setAdjustValue(e.target.value)}
            placeholder="e.g. +5"
            className="w-20 px-2 py-1 text-xs border border-stone-200 rounded-md focus:outline-none focus:border-stone-400"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setShowAdjust(false);
                setShowToolbar(false);
                setAdjustValue("");
              }
            }}
          />
          <span className="text-xs text-stone-400">%</span>
          <button
            onClick={() => {
              setShowAdjust(false);
              setShowToolbar(false);
              setAdjustValue("");
            }}
            className="text-xs px-2 py-1 bg-stone-800 text-white rounded-md"
          >
            ✓
          </button>
        </div>
      )}
    </div>
  );
}

type Tab = "description" | "comments" | "procon" | "history";

export default function IssueDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const issue = getIssue(id);
  const [activeTab, setActiveTab] = useState<Tab>("comments");
  const [customBoundaries, setCustomBoundaries] = useState<PlanetaryBoundary[]>([]);
  const [showAddBoundary, setShowAddBoundary] = useState(false);
  const [newBoundaryLabel, setNewBoundaryLabel] = useState("");
  const [newBoundaryIcon, setNewBoundaryIcon] = useState("📊");

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
          <div className="flex flex-col lg:flex-row lg:gap-6">
            {/* Left: title, summary, status, cost/time */}
            <div className="flex-1 min-w-0">
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

              {/* Cost / Time metrics */}
              {issue.metrics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
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

            {/* Right: Planetary Boundary impact indicators */}
            <div className="mt-4 lg:mt-0 lg:border-l lg:border-stone-100 lg:pl-6 shrink-0">
              <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
                Impact
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {[...issue.boundaries, ...customBoundaries].map((b) => (
                  <BoundaryChip key={b.label} b={b} />
                ))}

                {showAddBoundary ? (
                  <div className="flex flex-col gap-1.5 p-2 rounded-lg border border-stone-200 bg-white">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newBoundaryIcon}
                        onChange={(e) => setNewBoundaryIcon(e.target.value)}
                        className="w-10 px-1 py-1 text-center text-sm border border-stone-200 rounded-md focus:outline-none focus:border-stone-400"
                        title="Icon (emoji)"
                      />
                      <input
                        type="text"
                        value={newBoundaryLabel}
                        onChange={(e) => setNewBoundaryLabel(e.target.value)}
                        placeholder="Category name"
                        className="flex-1 px-2 py-1 text-xs border border-stone-200 rounded-md focus:outline-none focus:border-stone-400"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newBoundaryLabel.trim()) {
                            setCustomBoundaries([
                              ...customBoundaries,
                              {
                                label: newBoundaryLabel.trim(),
                                icon: newBoundaryIcon || "📊",
                                direction: "neutral",
                                delta: "?",
                                confidence: "low",
                              },
                            ]);
                            setNewBoundaryLabel("");
                            setNewBoundaryIcon("📊");
                            setShowAddBoundary(false);
                          }
                          if (e.key === "Escape") setShowAddBoundary(false);
                        }}
                      />
                    </div>
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => setShowAddBoundary(false)}
                        className="text-xs text-stone-400 hover:text-stone-600 px-2 py-0.5"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (newBoundaryLabel.trim()) {
                            setCustomBoundaries([
                              ...customBoundaries,
                              {
                                label: newBoundaryLabel.trim(),
                                icon: newBoundaryIcon || "📊",
                                direction: "neutral",
                                delta: "?",
                                confidence: "low",
                              },
                            ]);
                            setNewBoundaryLabel("");
                            setNewBoundaryIcon("📊");
                            setShowAddBoundary(false);
                          }
                        }}
                        className="text-xs px-2 py-0.5 bg-stone-800 text-white rounded-md"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddBoundary(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-stone-300 text-xs text-stone-400 hover:text-stone-600 hover:border-stone-400 transition-colors"
                  >
                    + Add category
                  </button>
                )}
              </div>
            </div>
          </div>
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
            <div className="text-sm text-stone-700 leading-relaxed prose prose-sm prose-stone max-w-none">
              <ReactMarkdown>{issue.aiSummary}</ReactMarkdown>
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
              <div className="prose prose-stone prose-sm max-w-none">
                <ReactMarkdown>{issue.description}</ReactMarkdown>
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
