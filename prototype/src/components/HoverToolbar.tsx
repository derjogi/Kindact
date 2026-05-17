"use client";

import { useState } from "react";

export default function HoverToolbar({
  children,
  onUpvote,
  onDownvote,
}: {
  children: React.ReactNode;
  onUpvote?: () => void;
  onDownvote?: () => void;
}) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState("");

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => {
        if (!showCommentInput) setShowToolbar(false);
      }}
    >
      {children}

      {showToolbar && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-on-surface text-surface rounded-md px-2 py-1 flex gap-1 elevation-floating z-10 font-meta text-sm">
          <button
            onClick={onUpvote}
            className="hover:bg-primary-dim px-1.5 py-0.5 rounded transition-colors"
            title="Upvote"
          >
            👍
          </button>
          <button
            onClick={onDownvote}
            className="hover:bg-primary-dim px-1.5 py-0.5 rounded transition-colors"
            title="Downvote"
          >
            👎
          </button>
          <button
            onClick={() => setShowCommentInput(!showCommentInput)}
            className="hover:bg-primary-dim px-1.5 py-0.5 rounded transition-colors"
            title="Comment"
          >
            💬
          </button>
          <button
            className="hover:bg-primary-dim px-1.5 py-0.5 rounded transition-colors"
            title="Flag"
          >
            🏴
          </button>
        </div>
      )}

      {showCommentInput && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Why?"
            className="input-line flex-1 px-3 py-1.5 text-sm text-on-surface"
            autoFocus
            onBlur={() => {
              if (!comment) {
                setShowCommentInput(false);
                setShowToolbar(false);
              }
            }}
          />
          <button
            onClick={() => {
              setComment("");
              setShowCommentInput(false);
              setShowToolbar(false);
            }}
            className="btn-primary px-3 py-1.5 font-meta text-sm rounded-md"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
