"use client";

import { useState } from "react";
import { postVote } from "@/lib/api";
import EligibilityModal from "./EligibilityModal";
import { useRuntime } from "@/lib/runtime";

export default function VoteBar({
  issueId,
  status,
  approveCount,
  rejectCount,
  onVoted,
}: {
  issueId: string;
  status: string;
  approveCount: number;
  rejectCount: number;
  onVoted?: () => void;
}) {
  const [userVote, setUserVote] = useState<"approve" | "reject" | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [pendingVote, setPendingVote] = useState<"approve" | "reject" | null>(
    null
  );
  const [writeState, setWriteState] = useState<
    "idle" | "syncing" | "queued" | "confirmed" | "rejected"
  >("idle");

  const mode = useRuntime((s) => s.mode);
  const isReadOnly = mode === "readonly";
  const isOffline = mode === "offline";

  const approve = approveCount + (userVote === "approve" ? 1 : 0);
  const reject = rejectCount + (userVote === "reject" ? 1 : 0);
  const total = approve + reject;
  const pct = total > 0 ? Math.round((approve / total) * 100) : 0;

  if (status !== "vote_ready" && status !== "vote-ready") return null;

  const submit = async (vote: "approve" | "reject") => {
    setWriteState(isOffline ? "queued" : "syncing");
    try {
      await postVote(issueId, vote);
      setUserVote(vote);
      setWriteState(isOffline ? "queued" : "confirmed");
      onVoted?.();
    } catch (err) {
      setWriteState("rejected");
      console.error(err);
    }
  };

  const handleVote = async (vote: "approve" | "reject") => {
    if (isReadOnly) return;
    if (eligible || userVote) {
      await submit(vote);
    } else {
      setPendingVote(vote);
      setShowQuiz(true);
    }
  };

  const handlePass = async () => {
    setEligible(true);
    setShowQuiz(false);
    if (pendingVote) {
      await submit(pendingVote);
      setPendingVote(null);
    }
  };

  return (
    <>
      <div className="sticky bottom-14 md:bottom-0 bg-white border-t md:border md:rounded-lg border-stone-200 p-4 flex flex-col gap-2 z-40">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => handleVote("approve")}
              disabled={isReadOnly}
              className={`px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                userVote === "approve"
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100"
              }`}
            >
              ✅ Approve
            </button>
            <button
              onClick={() => handleVote("reject")}
              disabled={isReadOnly}
              className={`px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
        {isReadOnly ? (
          <div className="text-xs text-stone-500">
            🔒 Sign in to a conductor to vote.
          </div>
        ) : writeState !== "idle" ? (
          <div className="text-xs text-stone-500 flex items-center gap-1.5">
            {writeState === "syncing" ? "↗ syncing…" : null}
            {writeState === "queued" ? "📥 Will sync when online" : null}
            {writeState === "confirmed" ? "✓ confirmed by validators" : null}
            {writeState === "rejected" ? "⚠ rejected" : null}
          </div>
        ) : null}
      </div>

      {showQuiz && (
        <EligibilityModal
          issueId={issueId}
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
