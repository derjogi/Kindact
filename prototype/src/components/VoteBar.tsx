"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Issue } from "@/lib/types";
import EligibilityModal from "./EligibilityModal";

export default function VoteBar({ issue }: { issue: Issue }) {
  const { votes, castVote } = useStore();
  const userVote = votes[issue.id];
  const [showQuiz, setShowQuiz] = useState(false);
  const [eligible, setEligible] = useState(!!userVote);
  const [pendingVote, setPendingVote] = useState<"approve" | "reject" | null>(
    null
  );

  const approve = issue.votesTally.approve + (userVote === "approve" ? 1 : 0);
  const reject = issue.votesTally.reject + (userVote === "reject" ? 1 : 0);
  const total = approve + reject;
  const pct = total > 0 ? Math.round((approve / total) * 100) : 0;

  if (issue.status !== "vote-ready") return null;

  const handleVote = (vote: "approve" | "reject") => {
    if (eligible || userVote) {
      castVote(issue.id, vote);
    } else {
      setPendingVote(vote);
      setShowQuiz(true);
    }
  };

  const handlePass = () => {
    setEligible(true);
    setShowQuiz(false);
    if (pendingVote) {
      castVote(issue.id, pendingVote);
      setPendingVote(null);
    }
  };

  return (
    <>
      <div className="sticky bottom-14 md:bottom-0 bg-white border-t md:border md:rounded-lg border-stone-200 p-4 flex items-center justify-between gap-4 z-40">
        <div className="flex gap-2">
          <button
            onClick={() => handleVote("approve")}
            className={`px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
              userVote === "approve"
                ? "bg-emerald-600 text-white"
                : "bg-stone-100 text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100"
            }`}
          >
            ✅ Approve
          </button>
          <button
            onClick={() => handleVote("reject")}
            className={`px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
              userVote === "reject"
                ? "bg-rose-600 text-white"
                : "bg-stone-100 text-stone-700 hover:bg-rose-50 hover:text-rose-700 active:bg-rose-100"
            }`}
          >
            ❌ Reject
          </button>
        </div>
        <div className="text-sm text-stone-500">
          {pct}% approval ({total})
        </div>
      </div>

      {showQuiz && (
        <EligibilityModal
          issueId={issue.id}
          onPass={handlePass}
          onClose={() => {
            setShowQuiz(false);
            setPendingVote(null);
          }}
        />
      )}
    </>
  );
}
