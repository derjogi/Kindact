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
        <div className="text-center py-16 text-stone-400">Loading…</div>
      </Layout>
    );
  }

  const unvoted = issues.filter((i) => !votedIds.has(i.id as string));

  if (unvoted.length === 0) {
    return (
      <Layout>
        <div className="text-center py-16 space-y-4">
          <div className="text-4xl">🗳️</div>
          <h2 className="text-lg font-medium text-stone-800">All caught up!</h2>
          <p className="text-sm text-stone-500">
            No issues awaiting your vote.
          </p>
        </div>
      </Layout>
    );
  }

  const issue = unvoted[currentIndex % unvoted.length];
  const approveCount =
    (issue.decisionState as Record<string, unknown> | undefined)?.approveCount as number | undefined ?? 0;
  const rejectCount =
    (issue.decisionState as Record<string, unknown> | undefined)?.rejectCount as number | undefined ?? 0;
  const total = approveCount + rejectCount;
  const pct = total > 0 ? Math.round((approveCount / total) * 100) : 0;

  const metrics = (issue.metrics as { dimension: string; value: string }[] | undefined) ?? [];
  const aiSummaryContent =
    (issue.aiSummary as Record<string, unknown> | undefined)?.content as string | undefined ?? "";

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
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-stone-900">
          Quick Vote{" "}
          <span className="text-sm font-normal text-stone-400">
            ({unvoted.length} awaiting)
          </span>
        </h1>

        <div className="bg-white rounded-lg border border-stone-200 p-5 space-y-4">
          <h2 className="text-lg font-medium text-stone-900">
            {issue.title as string}
          </h2>
          <p className="text-sm text-stone-600">{issue.summary as string}</p>

          <div className="text-sm text-stone-700 leading-relaxed prose prose-sm prose-stone max-w-none">
            <ReactMarkdown>{aiSummaryContent}</ReactMarkdown>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-stone-500">
            {metrics.map((m) => (
              <span key={m.dimension}>
                {m.dimension}: <strong>{m.value}</strong>
              </span>
            ))}
          </div>

          <div className="text-sm text-stone-400">
            {pct}% approval ({total} votes)
          </div>

          {/* Inline vote buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleVote("approve")}
              disabled={voting}
              className="flex-1 py-2 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50"
            >
              👍 Approve
            </button>
            <button
              onClick={() => handleVote("reject")}
              disabled={voting}
              className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
            >
              👎 Reject
            </button>
          </div>

          <div className="flex justify-between pt-2">
            <Link
              href={`/issues/${issue.id}`}
              className="text-sm text-stone-500 hover:text-stone-700"
            >
              📖 Read full issue
            </Link>
            {unvoted.length > 1 && (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="text-sm text-stone-500 hover:text-stone-700"
              >
                Skip →
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
