"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Comment } from "./types";

interface AppState {
  votes: Record<string, "approve" | "reject">;
  userComments: Comment[];
  lastVisited: Record<string, string>; // issueId → ISO timestamp
  castVote: (issueId: string, vote: "approve" | "reject") => void;
  addComment: (issueId: string, text: string, parentId: string | null) => void;
  recordVisit: (issueId: string) => void;
  getLastVisited: (issueId: string) => string | null;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      votes: {},
      userComments: [],
      lastVisited: {},
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
      recordVisit: (issueId) =>
        set((state) => ({
          lastVisited: { ...state.lastVisited, [issueId]: new Date().toISOString() },
        })),
      getLastVisited: (issueId) => get().lastVisited[issueId] ?? null,
    }),
    { name: "kindact-prototype" }
  )
);
