export type IssueStatus =
  | "draft"
  | "deliberating"
  | "vote-ready"
  | "adopted"
  | "implementing"
  | "completed";

export type Scope = "local" | "national" | "global";

export interface Metric {
  label: string;
  value: string;
  confidence: "low" | "medium" | "high";
}

export type BoundaryDirection = "improve" | "regress" | "neutral";

export interface PlanetaryBoundary {
  label: string;
  icon: string;
  direction: BoundaryDirection;
  delta: string; // e.g. "+2%", "-5%"
  confidence: "low" | "medium" | "high";
}

export interface Comment {
  id: string;
  alias: string;
  emoji: string;
  text: string;
  createdAt: string;
  parentId: string | null;
  upvotes: number;
  downvotes: number;
  stance?: "pro" | "con";
  quotedText?: string;
  sourceType?: "description" | "metric" | "boundary";
  sourceId?: string;
  quoteStart?: number;
  quoteEnd?: number;
}

export interface ArgumentNode {
  id: string;
  text: string;
  type: "pro" | "con";
  parentId: string | null;
  alias: string;
  emoji: string;
}

export interface Issue {
  id: string;
  title: string;
  summary: string;
  description: string;
  status: IssueStatus;
  scope: Scope;
  tags: string[];
  participants: number;
  createdAt: string;
  metrics: Metric[];
  boundaries: PlanetaryBoundary[];
  aiSummary: string;
  comments: Comment[];
  arguments: ArgumentNode[];
  votesTally: { approve: number; reject: number };
  rewardIntent: string;
}

export interface UserActivity {
  id: string;
  type: "comment" | "vote" | "earned" | "claimed";
  issueId: string;
  issueTitle: string;
  detail: string;
  createdAt: string;
}

export interface User {
  displayName: string;
  balance: number;
  decayRate: number;
  activities: UserActivity[];
}
