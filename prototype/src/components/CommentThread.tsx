"use client";

import { useState } from "react";
import { Comment } from "@/lib/types";
import { useStore } from "@/lib/store";

function CommentItem({
  comment,
  replies,
  issueId,
  depth = 0,
}: {
  comment: Comment;
  replies: Comment[];
  issueId: string;
  depth?: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const addComment = useStore((s) => s.addComment);

  const childReplies = replies.filter((r) => r.parentId === comment.id);

  const handleReply = () => {
    if (!replyText.trim()) return;
    addComment(issueId, replyText, comment.id);
    setReplyText("");
    setShowReply(false);
  };

  return (
    <div className={depth > 0 ? "ml-6 border-l-2 border-stone-100 pl-4" : ""}>
      <div className="group py-3">
        <div className="flex items-center gap-2 text-sm">
          <span>{comment.emoji}</span>
          <span className="font-medium text-stone-700">
            Anonymous {comment.alias}
          </span>
          <span className="text-stone-400">· {comment.createdAt}</span>
          {comment.stance && (
            <span
              className={`px-1.5 py-0.5 rounded text-xs ${
                comment.stance === "pro"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {comment.stance}
            </span>
          )}
        </div>
        <p className="mt-1 text-stone-800 text-sm leading-relaxed">
          {comment.text}
        </p>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-stone-400">
          <button className="hover:text-emerald-600 active:text-emerald-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            👍 {comment.upvotes}
          </button>
          <button className="hover:text-rose-600 active:text-rose-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            👎 {comment.downvotes}
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
          />
        ))}
    </div>
  );
}

export default function CommentThread({
  comments,
  issueId,
}: {
  comments: Comment[];
  issueId: string;
}) {
  const [newComment, setNewComment] = useState("");
  const addComment = useStore((s) => s.addComment);
  const userComments = useStore((s) => s.userComments);

  const allComments = [...comments, ...userComments];
  const topLevel = allComments.filter((c) => c.parentId === null);

  const handleAdd = () => {
    if (!newComment.trim()) return;
    addComment(issueId, newComment, null);
    setNewComment("");
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700"
        >
          Post
        </button>
      </div>

      <div className="divide-y divide-stone-100">
        {topLevel.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={allComments}
            issueId={issueId}
          />
        ))}
      </div>
    </div>
  );
}
