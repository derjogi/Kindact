"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Comment } from "./types";

interface AppState {
  votes: Record<string, "approve" | "reject">;
  userComments: Comment[];
  castVote: (issueId: string, vote: "approve" | "reject") => void;
  addComment: (issueId: string, text: string, parentId: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      votes: {},
      userComments: [],
      castVote: (issueId, vote) =>
        set((state) => ({
          votes: { ...state.votes, [issueId]: vote },
        })),
      addComment: (issueId, text, parentId) =>
        set((state) => ({
          userComments: [
            ...state.userComments,
            {
              id: `user-${Date.now()}`,
              alias: "You",
              emoji: "🧑",
              text,
              createdAt: "Just now",
              parentId,
              upvotes: 0,
              downvotes: 0,
              stance: undefined,
            },
          ],
        })),
    }),
    { name: "kindact-prototype" }
  )
);
