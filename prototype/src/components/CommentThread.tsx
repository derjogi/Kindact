"use client";

import { useState } from "react";
import { postComment } from "@/lib/api";
import { useRuntime } from "@/lib/runtime";

interface DbComment {
  id: string;
  issueId: string;
  authorId: string;
  text: string;
  parentId: string | null;
  upvotes?: number;
  downvotes?: number;
  stance?: string | null;
  createdAt: string;
  alias: string;
  quotedText?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  quoteStart?: number | null;
  quoteEnd?: number | null;
}

function CommentItem({
  comment,
  replies,
  issueId,
  depth = 0,
  index = 0,
  onCommentAdded,
}: {
  comment: DbComment;
  replies: DbComment[];
  issueId: string;
  depth?: number;
  index?: number;
  onCommentAdded?: () => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const childReplies = replies.filter((r) => r.parentId === comment.id);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await postComment(issueId, replyText, comment.id);
    setReplyText("");
    setShowReply(false);
    onCommentAdded?.();
  };

  // Stance rail color (replaces border-stone divider)
  const railColor =
    depth > 0
      ? comment.stance === "pro"
        ? "border-status-deliberating"
        : comment.stance === "con"
          ? "border-status-implementing"
          : "border-surface-container-high"
      : "";

  // Tonal zebra striping for top-level comments instead of divider lines
  const zebra =
    depth === 0
      ? index % 2 === 0
        ? "bg-surface-container-lowest"
        : "bg-surface-container-low"
      : "";

  return (
    <div
      className={
        depth > 0 ? `ml-6 border-l-[3px] pl-4 ${railColor}` : ""
      }
    >
      <div className={`group rounded-md px-4 py-3 ${zebra}`}>
        <div className="flex items-center gap-2 font-meta text-xs">
          <span className="font-medium text-on-surface">{comment.alias}</span>
          <span className="text-on-surface-variant">· {comment.createdAt}</span>
          {depth > 0 && comment.stance === "pro" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-primary-container text-on-primary-container font-semibold">
              Supporting
            </span>
          )}
          {depth > 0 && comment.stance === "con" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-surface-container-high text-status-implementing font-semibold">
              Counter
            </span>
          )}
        </div>
        <p className="mt-1.5 text-on-surface text-sm leading-relaxed">
          {comment.text}
        </p>
        <div className="mt-2 flex items-center gap-1 font-meta text-xs text-on-surface-variant">
          <button
            className="hover:text-primary-dim transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center rounded"
            title="Upvote"
          >
            👍
          </button>
          <button
            className="hover:text-status-implementing transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center rounded"
            title="Downvote"
          >
            👎
          </button>
          <button
            onClick={() => setShowReply(!showReply)}
            className="hover:text-primary-dim transition-colors min-h-[36px] px-2 flex items-center justify-center rounded"
          >
            💬 Reply
          </button>
          <button
            className="opacity-0 group-hover:opacity-100 md:flex hidden hover:text-status-implementing transition-all min-h-[36px] min-w-[36px] items-center justify-center"
            title="Flag"
          >
            🏴
          </button>
        </div>

        {showReply && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReply()}
              placeholder="Write a reply…"
              className="input-line flex-1 px-3 py-2 text-sm text-on-surface"
              autoFocus
            />
            <button
              onClick={handleReply}
              className="btn-primary px-4 py-2 text-sm rounded-md font-meta"
            >
              Send
            </button>
          </div>
        )}
      </div>

      {depth < 2 &&
        childReplies.map((reply, i) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            replies={replies}
            issueId={issueId}
            depth={depth + 1}
            index={i}
            onCommentAdded={onCommentAdded}
          />
        ))}
    </div>
  );
}

export default function CommentThread({
  comments,
  issueId,
  onCommentAdded,
}: {
  comments: DbComment[];
  issueId: string;
  onCommentAdded?: () => void;
}) {
  const [newComment, setNewComment] = useState("");
  const [writeState, setWriteState] = useState<
    "idle" | "syncing" | "queued" | "confirmed" | "rejected"
  >("idle");
  const mode = useRuntime((s) => s.mode);
  const isReadOnly = mode === "readonly";
  const isOffline = mode === "offline";

  const topLevel = comments.filter((c) => c.parentId === null);

  const handleAdd = async () => {
    if (!newComment.trim() || isReadOnly) return;
    setWriteState(isOffline ? "queued" : "syncing");
    try {
      await postComment(issueId, newComment);
      setNewComment("");
      setWriteState(isOffline ? "queued" : "confirmed");
      onCommentAdded?.();
    } catch (err) {
      setWriteState("rejected");
      console.error(err);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={
              isReadOnly
                ? "Read-only: sign in to a conductor to comment"
                : "Add a comment…"
            }
            disabled={isReadOnly}
            className="input-line flex-1 px-3 py-2.5 text-sm text-on-surface"
          />
          <button
            onClick={handleAdd}
            disabled={isReadOnly}
            className="btn-primary px-4 py-2.5 text-sm rounded-md font-meta"
          >
            Post
          </button>
        </div>
        {writeState !== "idle" ? (
          <div className="mt-1 font-meta text-xs text-on-surface-variant">
            {writeState === "syncing" ? "↗ syncing…" : null}
            {writeState === "queued"
              ? `📥 Will sync when online${
                  isOffline ? ` · queued in source chain` : ""
                }`
              : null}
            {writeState === "confirmed" ? "✓ confirmed" : null}
            {writeState === "rejected" ? "⚠ rejected by validator" : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        {topLevel.map((comment, i) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={comments}
            issueId={issueId}
            index={i}
            onCommentAdded={onCommentAdded}
          />
        ))}
      </div>
    </div>
  );
}
