"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import VoteBar from "@/components/VoteBar";
import HoverToolbar from "@/components/HoverToolbar";
import SourcePanel from "@/components/SourcePanel";
import CollapsibleDescription from "@/components/CollapsibleDescription";
import SummaryWithRefs from "@/components/SummaryWithRefs";
import ThreadList from "@/components/ThreadList";
import DiscussionSearch from "@/components/DiscussionSearch";
import { fetchIssue, fetchDeliberation } from "@/lib/api";

const statusColors: Record<string, string> = {
  draft: "bg-stone-400",
  deliberating: "bg-emerald-500",
  vote_ready: "bg-blue-500",
  "vote-ready": "bg-blue-500",
  adopted: "bg-violet-500",
  implementing: "bg-amber-500",
  completed: "bg-stone-600",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  deliberating: "Deliberating",
  vote_ready: "Voting",
  "vote-ready": "Voting",
  adopted: "Adopted",
  implementing: "Implementing",
  completed: "Completed",
};

type Tab = "discussion" | "procon" | "history";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IssueData = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DeliberationData = Record<string, any>;

interface SourceItem {
  commentId: string;
  alias: string;
  text: string;
  strength: string;
}

export default function IssueDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [issue, setIssue] = useState<IssueData | null>(null);
  const [deliberation, setDeliberation] = useState<DeliberationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("discussion");

  // Source panel state
  const [activeSources, setActiveSources] = useState<SourceItem[]>([]);
  const [activeLabel, setActiveLabel] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const mainRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [issueData, delibData] = await Promise.all([
        fetchIssue(id),
        fetchDeliberation(id),
      ]);
      setIssue(issueData);
      setDeliberation(delibData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load issue");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSetSources = useCallback((sources: SourceItem[], label: string) => {
    setActiveSources(sources);
    setActiveLabel(label);
  }, []);

  const handleClearSources = useCallback(() => {
    setActiveSources([]);
    setActiveLabel("");
  }, []);

  const handleJumpToComment = useCallback((commentId: string) => {
    const el = document.getElementById(`comment-${commentId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-yellow-50");
      setTimeout(() => el.classList.remove("bg-yellow-50"), 2000);
    }
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="text-stone-400 text-sm">Loading issue…</div>
        </div>
      </Layout>
    );
  }

  if (error || !issue) {
    return (
      <Layout>
        <p className="text-center text-stone-400 py-12">
          {error ?? "Issue not found."}
        </p>
      </Layout>
    );
  }

  const comments = (deliberation?.comments ?? issue.comments ?? []) as Array<Record<string, unknown>>;
  const args = (deliberation?.arguments ?? issue.arguments ?? []) as Array<Record<string, unknown>>;
  const metrics = (issue.metrics ?? []) as Array<Record<string, unknown>>;
  const boundaries = (issue.boundaries ?? []) as Array<Record<string, unknown>>;

  // AI Summary data — prefer deliberation's copy (includes references)
  const aiSummary = deliberation?.aiSummary ?? issue.aiSummary;
  const summaryContent = aiSummary?.content ?? "";
  const summaryRefs = aiSummary?.references ?? null;

  // Quote comments (comments that reference the description)
  const quoteComments = comments
    .filter((c) => c.quotedText && c.sourceType === "description")
    .map((c) => ({
      id: String(c.id),
      alias: String(c.alias),
      text: String(c.text),
      quotedText: String(c.quotedText),
      quoteStart: Number(c.quoteStart ?? 0),
      quoteEnd: Number(c.quoteEnd ?? 0),
    }));

  // Comment info for SummaryWithRefs
  const commentInfos = comments.map((c) => ({
    id: String(c.id),
    alias: String(c.alias ?? ""),
    text: String(c.text),
  }));

  // Filter comments for search
  const filteredComments = searchQuery
    ? comments.filter((c) =>
        String(c.text).toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : comments;

  const tabs: { key: Tab; label: string }[] = [
    { key: "discussion", label: `Discussion (${comments.length})` },
    { key: "procon", label: `Pro/Con (${args.length})` },
    { key: "history", label: "History" },
  ];

  return (
    <Layout>
      <div className="flex gap-6" ref={mainRef}>
        {/* Main content (~84%) */}
        <div className="flex-1 min-w-0 space-y-4">
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
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-stone-900">
                  {issue.title}
                </h1>
                <p className="mt-1 text-stone-600">{issue.summary}</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${statusColors[issue.status] ?? "bg-stone-400"}`}
                    />
                    {statusLabels[issue.status] ?? issue.status}
                  </span>
                  <span className="capitalize">{issue.scope}</span>
                  <span>{issue.participants} participants</span>
                </div>

                {/* Metrics — hover populates source panel */}
                {metrics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {metrics.map((m) => (
                      <div
                        key={String(m.dimension ?? m.id)}
                        className="px-3 py-2 bg-stone-50 rounded-lg border border-stone-100 text-sm cursor-default"
                        onMouseEnter={() => {
                          const dim = String(m.dimension);
                          const metricComments = comments
                            .filter((c) => c.sourceType === "metric" && c.sourceId === dim)
                            .map((c) => ({
                              commentId: String(c.id),
                              alias: String(c.alias),
                              text: String(c.text),
                              strength: "direct",
                            }));
                          if (metricComments.length > 0) {
                            handleSetSources(metricComments, `${dim} sources`);
                          }
                        }}
                        onMouseLeave={handleClearSources}
                      >
                        <span className="text-stone-500">{String(m.dimension)}:</span>{" "}
                        <span className="font-medium text-stone-800">
                          {String(m.value)}
                        </span>
                        {m.confidence ? (
                          <span className="ml-1 text-xs text-stone-400">
                            ({String(m.confidence)} conf.)
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

                {issue.rewardIntent?.amount && (
                  <div className="mt-3 text-sm text-stone-500">
                    💰 Reward: {issue.rewardIntent.amount}
                  </div>
                )}
              </div>

              {/* Boundary indicators — hover populates source panel */}
              {boundaries.length > 0 && (
                <div className="mt-4 lg:mt-0 lg:border-l lg:border-stone-100 lg:pl-6 shrink-0">
                  <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
                    Impact
                  </h3>
                  <div className="flex flex-wrap lg:flex-col gap-2">
                    {boundaries.map((b) => {
                      const dir = String(b.direction);
                      const style = dir === "improve"
                        ? { color: "text-emerald-600", arrow: "↑" }
                        : dir === "regress"
                          ? { color: "text-rose-600", arrow: "↓" }
                          : { color: "text-stone-400", arrow: "→" };
                      return (
                        <div
                          key={String(b.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-100 text-sm cursor-default"
                          onMouseEnter={() => {
                            const label = String(b.label);
                            const boundaryComments = comments
                              .filter((c) => c.sourceType === "boundary" && c.sourceId === label)
                              .map((c) => ({
                                commentId: String(c.id),
                                alias: String(c.alias),
                                text: String(c.text),
                                strength: "direct",
                              }));
                            if (boundaryComments.length > 0) {
                              handleSetSources(boundaryComments, `${label} sources`);
                            }
                          }}
                          onMouseLeave={handleClearSources}
                        >
                          <span>{String(b.icon)}</span>
                          <span className="text-stone-600 text-xs">{String(b.label)}</span>
                          <span className={`font-semibold text-xs ${style.color}`}>
                            {style.arrow} {String(b.delta)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Description */}
          <CollapsibleDescription
            description={issue.description}
            issueId={issue.id}
            quoteComments={quoteComments}
            onHighlightSources={handleSetSources}
            onClearSources={handleClearSources}
            onCommentAdded={loadData}
          />

          {/* AI Summary with references */}
          {summaryContent && (
            <SummaryWithRefs
              content={summaryContent}
              references={summaryRefs}
              comments={commentInfos}
              onActiveSources={handleSetSources}
              onClearSources={handleClearSources}
            />
          )}

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
              {activeTab === "discussion" && (
                <>
                  <DiscussionSearch
                    onSearch={(q) => setSearchQuery(q)}
                    onClear={() => setSearchQuery(null)}
                    isActive={searchQuery !== null}
                  />
                  <ThreadList
                    comments={filteredComments as unknown as Parameters<typeof ThreadList>[0]["comments"]}
                    issueId={issue.id}
                    onCommentAdded={loadData}
                  />
                </>
              )}

              {activeTab === "procon" && (
                <div className="space-y-3">
                  {args.length === 0 ? (
                    <p className="text-sm text-stone-400">
                      No arguments yet. Be the first to add one.
                    </p>
                  ) : (
                    args
                      .filter((a) => a.parentId === null)
                      .map((arg) => {
                        const children = args.filter(
                          (a) => a.parentId === arg.id,
                        );
                        return (
                          <div key={String(arg.id)}>
                            <HoverToolbar>
                              <div
                                className={`p-3 rounded-lg border-l-4 ${
                                  arg.type === "pro"
                                    ? "border-emerald-400 bg-emerald-50/50"
                                    : "border-rose-400 bg-rose-50/50"
                                }`}
                              >
                                <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
                                  <span>{String(arg.alias ?? "")}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-medium ${
                                      arg.type === "pro"
                                        ? "text-emerald-600"
                                        : "text-rose-600"
                                    }`}
                                  >
                                    {String(arg.type).toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-sm text-stone-700">
                                  {String(arg.text)}
                                </p>
                              </div>
                            </HoverToolbar>
                            {children.map((child) => (
                              <div key={String(child.id)} className="ml-6 mt-2">
                                <HoverToolbar>
                                  <div
                                    className={`p-3 rounded-lg border-l-4 ${
                                      child.type === "pro"
                                        ? "border-emerald-400 bg-emerald-50/50"
                                        : "border-rose-400 bg-rose-50/50"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
                                      <span>{String(child.alias ?? "")}</span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded font-medium ${
                                          child.type === "pro"
                                            ? "text-emerald-600"
                                            : "text-rose-600"
                                        }`}
                                      >
                                        {String(child.type).toUpperCase()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-stone-700">
                                      {String(child.text)}
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
                  <p>📝 Issue created — {issue.createdAt}</p>
                  <p>📝 Description updated — 2d ago</p>
                  <p>📊 Metrics added (cost, time) — 1d ago</p>
                </div>
              )}
            </div>
          </div>

          {/* Vote bar */}
          <VoteBar
            issueId={issue.id}
            status={issue.status}
            approveCount={issue.decisionState?.approveCount ?? 0}
            rejectCount={issue.decisionState?.rejectCount ?? 0}
            onVoted={loadData}
          />
        </div>

        {/* Source Panel (~16%) — hidden on mobile */}
        <div className="hidden md:block w-[16%] min-w-[200px] shrink-0">
          <SourcePanel
            sources={activeSources}
            label={activeLabel}
            onJumpToComment={handleJumpToComment}
            idle={activeSources.length === 0}
          />
        </div>
      </div>

      {/* Mobile bottom sheet source panel */}
      <div className="md:hidden">
        <SourcePanel
          sources={activeSources}
          label={activeLabel}
          onJumpToComment={handleJumpToComment}
          idle={activeSources.length === 0}
          mobile
        />
      </div>
    </Layout>
  );
}
