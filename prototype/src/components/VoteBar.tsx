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
    null,
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
      <div className="sticky bottom-14 md:bottom-4 z-40 bg-surface-container-lowest/85 backdrop-blur-[16px] rounded-md elevation-floating p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => handleVote("approve")}
              disabled={isReadOnly}
              className={`px-5 py-2.5 min-h-[44px] rounded-md font-meta text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                userVote === "approve"
                  ? "btn-primary"
                  : "bg-surface-container text-on-surface hover:bg-primary-container"
              }`}
            >
              ✅ Approve
            </button>
            <button
              onClick={() => handleVote("reject")}
              disabled={isReadOnly}
              className={`px-5 py-2.5 min-h-[44px] rounded-md font-meta text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                userVote === "reject"
                  ? "bg-status-implementing text-on-primary"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high"
              }`}
            >
              ❌ Reject
            </button>
          </div>
          <div className="font-meta text-sm text-on-surface-variant">
            <span className="font-display text-base font-semibold text-primary-dim">
              {pct}%
            </span>{" "}
            approval ({total})
          </div>
        </div>
        {isReadOnly ? (
          <div className="font-meta text-xs text-on-surface-variant">
            🔒 Sign in to a conductor to vote.
          </div>
        ) : writeState !== "idle" ? (
          <div className="font-meta text-xs text-on-surface-variant flex items-center gap-1.5">
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
