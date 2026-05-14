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
  onCommentAdded,
}: {
  comment: DbComment;
  replies: DbComment[];
  issueId: string;
  depth?: number;
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

  return (
    <div className={depth > 0
      ? `ml-6 border-l-[3px] pl-4 ${
          comment.stance === "pro"
            ? "border-emerald-400"
            : comment.stance === "con"
              ? "border-orange-400"
              : "border-stone-100"
        }`
      : ""}>
      <div className="group py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-stone-700">
            {comment.alias}
          </span>
          <span className="text-stone-400">· {comment.createdAt}</span>
          {depth > 0 && comment.stance === "pro" && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-emerald-50 text-emerald-600 font-medium">
              SUPPORTING
            </span>
          )}
          {depth > 0 && comment.stance === "con" && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-600 font-medium">
              COUNTER
            </span>
          )}
        </div>
        <p className="mt-1 text-stone-800 text-sm leading-relaxed">
          {comment.text}
        </p>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-stone-400">
          <button className="hover:text-emerald-600 active:text-emerald-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            👍
          </button>
          <button className="hover:text-rose-600 active:text-rose-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            👎
          </button>
          <button
            onClick={() => setShowReply(!showReply)}
            className="hover:text-blue-600 active:text-blue-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            💬 Reply
          </button>
          <button className="opacity-0 group-hover:opacity-100 md:flex hidden hover:text-amber-600 transition-all min-h-[44px] min-w-[44px] items-center justify-center">
            🏴 Flag
          </button>
        </div>

        {showReply && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReply()}
              placeholder="Write a reply..."
              className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
              autoFocus
            />
            <button
              onClick={handleReply}
              className="px-3 py-1.5 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700"
            >
              Send
            </button>
          </div>
        )}
      </div>

      {depth < 2 &&
        childReplies.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            replies={replies}
            issueId={issueId}
            depth={depth + 1}
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
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={
              isReadOnly
                ? "Read-only: sign in to a conductor to comment"
                : "Add a comment..."
            }
            disabled={isReadOnly}
            className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleAdd}
            disabled={isReadOnly}
            className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </div>
        {writeState !== "idle" ? (
          <div className="mt-1 text-xs text-stone-500">
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

      <div className="divide-y divide-stone-100">
        {topLevel.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={comments}
            issueId={issueId}
            onCommentAdded={onCommentAdded}
          />
        ))}
      </div>
    </div>
  );
}
