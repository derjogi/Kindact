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

// ─── 026: Cells ─────────────────────────────────────────────────────────────

export type CellTier = "canonical" | "promoted" | "uncurated";
export type CellLifecycle = "active" | "archived";
export type CellMembershipKind = "member" | "guest";
export type ViewerRelation = "member" | "guest" | "none";

export interface CellSummary {
  id: string;
  cellId: string;
  displayName: string;
  description: string;
  tier: CellTier;
  scopeLevel: string;
  locationRefs: string[];
  topicTags: string[];
  membraneRead: string;
  membraneWrite: string;
  jurisdictionalClaims: string[];
  governanceEngine: string;
  lifecycle: CellLifecycle;
  memberCount: number;
  issueCount: number;
  isMember: boolean;
  forkedFromId?: string | null;
  createdAt?: string | Date;
  lastActivityAt?: string | Date;
}

export interface CellDetail extends CellSummary {
  scopeProofTypes: string[];
  forkedFrom: { id: string; cellId: string; displayName: string } | null;
  viewerRelation: ViewerRelation;
}

export interface MyCellMembership {
  membershipId: string;
  kind: CellMembershipKind;
  issueId: string | null;
  joinedAt: string | Date;
  cell: {
    id: string;
    cellId: string;
    displayName: string;
    tier: CellTier;
    scopeLevel: string;
    memberCount: number;
    issueCount: number;
  };
}

// ─── 027: Anchors ───────────────────────────────────────────────────────────

export type AnchorKind = "topic" | "location" | "event" | "cell";

export interface AnchorSummary {
  id: string;
  anchorId: string;
  kind: AnchorKind;
  displayName: string;
  description?: string;
  synonyms: string[];
  parentIds: string[];
  issueCount: number;
  subscriberCount: number;
  isSubscribed: boolean;
}

export interface AnchorDetail {
  id: string;
  anchorId: string;
  kind: AnchorKind;
  displayName: string;
  description: string;
  synonyms: string[];
  issueCount: number;
  subscriberCount: number;
  parents: { id: string; anchorId: string; displayName: string; kind: AnchorKind }[];
  children: { id: string; anchorId: string; displayName: string; kind: AnchorKind }[];
  subscription: { id: string; muted: boolean; subscribedAt: string | Date } | null;
}

export interface MyAnchorSubscription {
  id: string;
  muted: boolean;
  subscribedAt: string | Date;
  anchor: {
    id: string;
    anchorId: string;
    kind: AnchorKind;
    displayName: string;
    issueCount: number;
  };
}

// Issue payload as it now arrives from the API (with cell + anchor links).
export interface IssueListItem {
  id: string;
  title: string;
  summary: string;
  status: string;
  scope: string;
  tags: string[];
  participants: number;
  cellId?: string | null;
  cell?: {
    id: string;
    cellId: string;
    displayName: string;
    tier: CellTier;
  } | null;
  anchorLinks?: Array<{
    id: string;
    anchor: {
      id: string;
      anchorId: string;
      kind: AnchorKind;
      displayName: string;
    };
  }>;
}
