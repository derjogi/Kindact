"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Layout from "@/components/Layout";
import { fetchIssues, postVote } from "@/lib/api";

export default function QuickVotePage() {
  const [issues, setIssues] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetchIssues({ status: "vote_ready" })
      .then((items) => setIssues(items as Record<string, unknown>[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16 font-meta text-sm text-on-surface-variant">
          Loading…
        </div>
      </Layout>
    );
  }

  const unvoted = issues.filter((i) => !votedIds.has(i.id as string));

  if (unvoted.length === 0) {
    return (
      <Layout>
        <div className="text-center py-16 space-y-3">
          <div className="text-5xl">🗳️</div>
          <h2 className="font-display text-2xl font-semibold text-on-surface">
            All caught up!
          </h2>
          <p className="font-meta text-sm text-on-surface-variant">
            No issues awaiting your vote.
          </p>
        </div>
      </Layout>
    );
  }

  const issue = unvoted[currentIndex % unvoted.length];
  const approveCount =
    ((issue.decisionState as Record<string, unknown> | undefined)
      ?.approveCount as number | undefined) ?? 0;
  const rejectCount =
    ((issue.decisionState as Record<string, unknown> | undefined)
      ?.rejectCount as number | undefined) ?? 0;
  const total = approveCount + rejectCount;
  const pct = total > 0 ? Math.round((approveCount / total) * 100) : 0;

  const metrics =
    (issue.metrics as { dimension: string; value: string }[] | undefined) ?? [];
  const aiSummaryContent =
    ((issue.aiSummary as Record<string, unknown> | undefined)
      ?.content as string | undefined) ?? "";

  const handleVote = async (vote: "approve" | "reject") => {
    setVoting(true);
    try {
      await postVote(issue.id as string, vote);
      setVotedIds((prev) => new Set(prev).add(issue.id as string));
      setCurrentIndex(0);
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setVoting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-5">
        {/* Editorial header */}
        <section className="p-6 bg-surface-container-lowest rounded-md border-l-4 border-status-voting card-lift">
          <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
            Quick Vote
          </p>
          <h1 className="font-display text-3xl font-bold text-on-surface">
            Pending Decisions
            <span className="font-sans text-base font-normal text-on-surface-variant ml-2">
              ({unvoted.length} awaiting)
            </span>
          </h1>
        </section>

        <article className="bg-surface-container-lowest rounded-md p-6 space-y-5 card-lift">
          <header className="space-y-2">
            <div className="inline-flex items-center gap-1.5 font-meta text-xs text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-status-voting" />
              Voting open
            </div>
            <h2 className="font-display text-2xl font-bold text-on-surface leading-tight">
              {issue.title as string}
            </h2>
            <p className="font-sans text-base leading-[1.6] text-on-surface-variant">
              {issue.summary as string}
            </p>
          </header>

          <div className="prose prose-sm max-w-none text-on-surface">
            <ReactMarkdown>{aiSummaryContent}</ReactMarkdown>
          </div>

          <div className="flex flex-wrap gap-3 font-meta text-xs text-on-surface-variant">
            {metrics.map((m) => (
              <span key={m.dimension}>
                {m.dimension}:{" "}
                <strong className="text-on-surface">{m.value}</strong>
              </span>
            ))}
          </div>

          <div className="font-meta text-sm text-on-surface-variant">
            {pct}% approval ({total} votes)
          </div>

          {/* Inline vote buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleVote("approve")}
              disabled={voting}
              className="flex-1 py-2.5 text-sm font-medium rounded-md bg-primary-container text-on-primary-container hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              👍 Approve
            </button>
            <button
              onClick={() => handleVote("reject")}
              disabled={voting}
              className="flex-1 py-2.5 text-sm font-medium rounded-md bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              👎 Reject
            </button>
          </div>

          <div className="flex justify-between pt-1">
            <Link
              href={`/issues/${issue.id}`}
              className="font-meta text-sm text-on-surface-variant hover:text-primary-dim"
            >
              📖 Read full issue
            </Link>
            {unvoted.length > 1 && (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="font-meta text-sm text-on-surface-variant hover:text-primary-dim"
              >
                Skip →
              </button>
            )}
          </div>
        </article>
      </div>
    </Layout>
  );
}
