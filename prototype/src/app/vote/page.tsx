"use client";

import { useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import VoteBar from "@/components/VoteBar";
import { issues } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export default function QuickVotePage() {
  const voteable = issues.filter((i) => i.status === "vote-ready");
  const votes = useStore((s) => s.votes);
  const unvoted = voteable.filter((i) => !votes[i.id]);
  const [currentIndex, setCurrentIndex] = useState(0);

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
  const total = issue.votesTally.approve + issue.votesTally.reject;
  const pct =
    total > 0
      ? Math.round((issue.votesTally.approve / total) * 100)
      : 0;

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
          <h2 className="text-lg font-medium text-stone-900">{issue.title}</h2>
          <p className="text-sm text-stone-600">{issue.summary}</p>

          <div className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">
            {issue.aiSummary}
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-stone-500">
            {issue.metrics.map((m) => (
              <span key={m.label}>
                {m.label}: <strong>{m.value}</strong>
              </span>
            ))}
          </div>

          <div className="text-sm text-stone-400">
            {pct}% approval ({total} votes)
          </div>

          <VoteBar issue={issue} />

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
