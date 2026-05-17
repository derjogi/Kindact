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
import CellBadge from "@/components/CellBadge";
import AnchorPill from "@/components/AnchorPill";
import CellContextStrip from "@/components/CellContextStrip";
import GuestContributorModal from "@/components/GuestContributorModal";
import JurisdictionalClaimsPanel from "@/components/JurisdictionalClaimsPanel";
import RelatedAcrossCells from "@/components/RelatedAcrossCells";
import {
  fetchIssue,
  fetchDeliberation,
  joinCell,
  joinCellAsGuest,
  subscribeAnchor,
} from "@/lib/api";
import { useStore } from "@/lib/store";

const statusColors: Record<string, string> = {
  draft: "bg-on-surface-variant",
  deliberating: "bg-status-deliberating",
  vote_ready: "bg-status-voting",
  "vote-ready": "bg-status-voting",
  adopted: "bg-status-adopted",
  implementing: "bg-status-implementing",
  completed: "bg-status-completed",
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

  // Guest contributor modal
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);

  const recordVisit = useStore((s) => s.recordVisit);
  const lastVisited = useStore((s) => s.getLastVisited(id));

  // Record visit after data loads (capture the previous timestamp first)
  const lastVisitedRef = useRef(lastVisited);
  useEffect(() => {
    if (!loading && issue) {
      // Small delay so components can read the *previous* lastVisited
      const timeout = setTimeout(() => recordVisit(id), 100);
      return () => clearTimeout(timeout);
    }
  }, [loading, issue, id, recordVisit]);

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
      el.classList.add("bg-primary-container");
      setTimeout(() => el.classList.remove("bg-primary-container"), 2000);
    }
  }, []);

  if (loading) {
    return (
      <Layout wide>
        <div className="flex items-center justify-center py-24">
          <div className="font-meta text-on-surface-variant text-sm">
            Loading issue…
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !issue) {
    return (
      <Layout wide>
        <p className="text-center font-meta text-on-surface-variant py-12">
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

  // "Updated since last visit" logic
  const prevVisit = lastVisitedRef.current;
  const summaryUpdatedAt = aiSummary?.updatedAt as string | undefined;
  const summaryUpdatedSinceLastVisit = !!(
    prevVisit &&
    summaryUpdatedAt &&
    new Date(summaryUpdatedAt) > new Date(prevVisit)
  );

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
    <Layout wide>
      <div className="flex gap-6" ref={mainRef}>
        {/* Main content (~84%) */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Back link */}
          <Link
            href="/"
            className="font-meta text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary-dim transition-colors"
          >
            ← Back to Issues
          </Link>

          {/* Header */}
          <div className="bg-surface-container-lowest rounded-md p-6">
            <div className="flex flex-col lg:flex-row lg:gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-3xl font-bold text-on-surface leading-tight">
                  {issue.title}
                </h1>

                {/* Cell + anchors line — 029 issue detail header */}
                {(issue.cell || (issue.anchorLinks?.length ?? 0) > 0) && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-on-surface-variant">
                    {issue.cell ? (
                      <>
                        <span>Posted in</span>
                        <CellBadge cell={issue.cell} />
                      </>
                    ) : null}
                    {(issue.anchorLinks?.length ?? 0) > 0 ? (
                      <>
                        <span className="text-stone-400">·</span>
                        <span>publishes to</span>
                        {(issue.anchorLinks as Array<{ anchor: { id: string; anchorId: string; kind: "topic" | "location" | "event" | "cell"; displayName: string } }>).map(
                          (al) => (
                            <AnchorPill key={al.anchor.id} anchor={al.anchor} />
                          ),
                        )}
                      </>
                    ) : null}
                  </div>
                )}

                <p className="mt-3 font-sans text-base leading-relaxed text-on-surface-variant">
                  {issue.summary}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-meta text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${statusColors[issue.status] ?? "bg-on-surface-variant"}`}
                    />
                    {statusLabels[issue.status] ?? issue.status}
                  </span>
                  <span className="capitalize">{issue.scope}</span>
                  <span>{issue.participants} participants</span>
                  {issue.viewerCellRelation === "guest" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-tertiary-container text-tertiary text-xs">
                      Guest contributor
                    </span>
                  ) : null}
                </div>

                {/* Metrics — hover populates source panel */}
                {metrics.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {metrics.map((m) => (
                      <div
                        key={String(m.dimension ?? m.id)}
                        className="px-3 py-2 bg-surface-container-low rounded-md font-meta text-sm cursor-default"
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
                        <span className="text-on-surface-variant">{String(m.dimension)}:</span>{" "}
                        <span className="font-semibold text-on-surface">
                          {String(m.value)}
                        </span>
                        {m.confidence ? (
                          <span className="ml-1 text-xs text-on-surface-variant">
                            ({String(m.confidence)} conf.)
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

                {issue.rewardIntent?.amount && (
                  <div className="mt-4 font-meta text-sm text-on-surface-variant">
                    💰 Reward: {issue.rewardIntent.amount}
                  </div>
                )}
              </div>

              {/* Boundary indicators — hover populates source panel */}
              {boundaries.length > 0 && (
                <div className="mt-4 lg:mt-0 lg:pl-6 shrink-0">
                  <h3 className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                    Impact
                  </h3>
                  <div className="flex flex-wrap lg:flex-col gap-2">
                    {boundaries.map((b) => {
                      const dir = String(b.direction);
                      const style = dir === "improve"
                        ? { color: "text-status-deliberating", arrow: "↑" }
                        : dir === "regress"
                          ? { color: "text-status-implementing", arrow: "↓" }
                          : { color: "text-on-surface-variant", arrow: "→" };
                      return (
                        <div
                          key={String(b.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-container-low font-meta text-sm cursor-default"
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
                          <span className="text-on-surface text-xs">{String(b.label)}</span>
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

          {/* 029: Cell context strip (member / guest / subscribed / public / denied) */}
          {issue.cell ? (
            <CellContextStrip
              issueId={issue.id}
              cell={issue.cell}
              anchorLinks={(issue.anchorLinks ?? []) as Parameters<typeof CellContextStrip>[0]["anchorLinks"]}
              viewerCellRelation={(issue.viewerCellRelation as "member" | "guest" | "none") ?? "none"}
              viewerSubscribedAnchorIds={(issue.viewerSubscribedAnchorIds as string[]) ?? []}
              onJoinCell={async () => {
                await joinCell(issue.cell.id);
                await loadData();
              }}
              onSubscribeAnchor={async (anchorId: string) => {
                await subscribeAnchor(anchorId);
                await loadData();
              }}
              onOpenGuestModal={() => setGuestModalOpen(true)}
            />
          ) : null}

          {/* 029: Jurisdictional claims */}
          {issue.cell?.jurisdictionalClaims?.length ? (
            <JurisdictionalClaimsPanel
              cellId={issue.cell.cellId}
              claims={issue.cell.jurisdictionalClaims as string[]}
            />
          ) : null}

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
              updatedSinceLastVisit={summaryUpdatedSinceLastVisit}
            />
          )}

          {/* Tabs */}
          <div className="bg-surface-container-lowest rounded-md overflow-hidden">
            <div className="flex bg-surface-container-low overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3 min-h-[44px] font-meta text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? "bg-surface-container-lowest text-on-surface font-medium"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
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
                    lastVisited={prevVisit ?? undefined}
                  />
                </>
              )}

              {activeTab === "procon" && (
                <div className="space-y-3">
                  {args.length === 0 ? (
                    <p className="font-meta text-sm text-on-surface-variant">
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
                                className={`p-4 rounded-md border-l-4 bg-surface-container-low ${
                                  arg.type === "pro"
                                    ? "border-status-deliberating"
                                    : "border-status-implementing"
                                }`}
                              >
                                <div className="flex items-center gap-2 font-meta text-xs text-on-surface-variant mb-1">
                                  <span>{String(arg.alias ?? "")}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${
                                      arg.type === "pro"
                                        ? "text-status-deliberating"
                                        : "text-status-implementing"
                                    }`}
                                  >
                                    {String(arg.type)}
                                  </span>
                                </div>
                                <p className="text-sm text-on-surface">
                                  {String(arg.text)}
                                </p>
                              </div>
                            </HoverToolbar>
                            {children.map((child) => (
                              <div key={String(child.id)} className="ml-6 mt-2">
                                <HoverToolbar>
                                  <div
                                    className={`p-4 rounded-md border-l-4 bg-surface-container-low ${
                                      child.type === "pro"
                                        ? "border-status-deliberating"
                                        : "border-status-implementing"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 font-meta text-xs text-on-surface-variant mb-1">
                                      <span>{String(child.alias ?? "")}</span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${
                                          child.type === "pro"
                                            ? "text-status-deliberating"
                                            : "text-status-implementing"
                                        }`}
                                      >
                                        {String(child.type)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-on-surface">
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
                <div className="font-meta text-sm text-on-surface-variant space-y-2">
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

          {/* 029: Related across cells */}
          {issue.relatedAcrossCells?.length ? (
            <RelatedAcrossCells
              items={issue.relatedAcrossCells as Parameters<typeof RelatedAcrossCells>[0]["items"]}
            />
          ) : null}
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

      {/* 029: Guest contributor modal */}
      {issue.cell ? (
        <GuestContributorModal
          open={guestModalOpen}
          cell={issue.cell}
          issueId={issue.id}
          issueTitle={issue.title}
          onClose={() => setGuestModalOpen(false)}
          onConfirm={async () => {
            await joinCellAsGuest(issue.cell.id, issue.id);
            await loadData();
          }}
        />
      ) : null}
    </Layout>
  );
}
