"use client";

import { useState } from "react";
import CommentThread from "./CommentThread";

interface ThreadComment {
  id: string;
  issueId: string;
  authorId: string;
  text: string;
  parentId: string | null;
  stance?: string | null;
  createdAt: string;
  alias: string;
  quotedText?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  quoteStart?: number | null;
  quoteEnd?: number | null;
}

interface ThreadListProps {
  comments: ThreadComment[];
  issueId: string;
  onCommentAdded?: () => void;
}

type SortOption = "newest" | "oldest";

export default function ThreadList({ comments, issueId, onCommentAdded }: ThreadListProps) {
  const [sortBy, setSortBy] = useState<SortOption>("oldest");
  const [expandedThread, setExpandedThread] = useState<string | null>(null);

  const topLevel = comments.filter((c) => c.parentId === null);

  const sorted = [...topLevel].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // First 5 are spotlights
  const spotlights = sorted.slice(0, 5);
  const rest = sorted.slice(5);

  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);
  const replyCount = (parentId: string): number => {
    const direct = getReplies(parentId);
    return direct.reduce((sum, r) => sum + 1 + replyCount(r.id), 0);
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-stone-400"
          >
            <option value="oldest">Oldest first</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
      </div>

      {/* Thread list */}
      <div className="space-y-1">
        {spotlights.map((thread) => (
          <ThreadItem
            key={thread.id}
            thread={thread}
            replies={replyCount(thread.id)}
            spotlight
            expanded={expandedThread === thread.id}
            onToggle={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
            allComments={comments}
            issueId={issueId}
            onCommentAdded={onCommentAdded}
          />
        ))}
        {rest.length > 0 && spotlights.length > 0 && (
          <div className="border-t border-stone-100 my-2" />
        )}
        {rest.map((thread) => (
          <ThreadItem
            key={thread.id}
            thread={thread}
            replies={replyCount(thread.id)}
            spotlight={false}
            expanded={expandedThread === thread.id}
            onToggle={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
            allComments={comments}
            issueId={issueId}
            onCommentAdded={onCommentAdded}
          />
        ))}
      </div>
    </div>
  );
}

function ThreadItem({
  thread,
  replies,
  spotlight,
  expanded,
  onToggle,
  allComments,
  issueId,
  onCommentAdded,
}: {
  thread: ThreadComment;
  replies: number;
  spotlight: boolean;
  expanded: boolean;
  onToggle: () => void;
  allComments: ThreadComment[];
  issueId: string;
  onCommentAdded?: () => void;
}) {
  return (
    <div
      id={`comment-${thread.id}`}
      className={`rounded-lg transition-colors ${
        spotlight ? "border-l-2 border-violet-500 pl-3" : "pl-3"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left py-3 hover:bg-stone-50 rounded-lg px-2 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-stone-700">{thread.alias}</span>
          <span className="text-stone-400 text-xs">{thread.createdAt}</span>
          {replies > 0 && (
            <span className="text-xs text-stone-400 ml-auto">
              💬 {replies} {replies === 1 ? "reply" : "replies"}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-stone-600 line-clamp-2">{thread.text}</p>
      </button>

      {expanded && (
        <div className="pb-3 px-2">
          <CommentThread
            comments={allComments.filter(
              (c) => c.id === thread.id || isDescendant(c, thread.id, allComments),
            )}
            issueId={issueId}
            onCommentAdded={onCommentAdded}
          />
        </div>
      )}
    </div>
  );
}

function isDescendant(
  comment: { id: string; parentId: string | null },
  ancestorId: string,
  allComments: { id: string; parentId: string | null }[],
): boolean {
  if (comment.parentId === ancestorId) return true;
  if (!comment.parentId) return false;
  const parent = allComments.find((c) => c.id === comment.parentId);
  if (!parent) return false;
  return isDescendant(parent, ancestorId, allComments);
}
