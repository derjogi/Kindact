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
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-800 text-white rounded-lg px-2 py-1 flex gap-1 shadow-lg z-10 text-sm">
          <button
            onClick={onUpvote}
            className="hover:bg-stone-700 px-1.5 py-0.5 rounded transition-colors"
            title="Upvote"
          >
            👍
          </button>
          <button
            onClick={onDownvote}
            className="hover:bg-stone-700 px-1.5 py-0.5 rounded transition-colors"
            title="Downvote"
          >
            👎
          </button>
          <button
            onClick={() => setShowCommentInput(!showCommentInput)}
            className="hover:bg-stone-700 px-1.5 py-0.5 rounded transition-colors"
            title="Comment"
          >
            💬
          </button>
          <button
            className="hover:bg-stone-700 px-1.5 py-0.5 rounded transition-colors"
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
            className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
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
            className="px-3 py-1.5 text-sm bg-stone-800 text-white rounded-lg"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
