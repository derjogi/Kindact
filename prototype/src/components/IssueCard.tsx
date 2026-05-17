import Link from "next/link";
import CellBadge from "./CellBadge";
import AnchorPill from "./AnchorPill";
import type { CellTier, AnchorKind } from "@/lib/types";

interface IssueCardProps {
  issue: {
    id: string;
    title: string;
    summary: string;
    status: string;
    scope: string;
    tags: string[];
    participants: number;
    cell?: {
      id: string;
      cellId: string;
      displayName: string;
      tier: CellTier;
    } | null;
    anchorLinks?: Array<{
      anchor: {
        id: string;
        anchorId: string;
        kind: AnchorKind;
        displayName: string;
      };
    }>;
  };
}

const statusDotColor: Record<string, string> = {
  draft: "bg-on-surface-variant",
  deliberating: "bg-status-deliberating animate-pulse",
  vote_ready: "bg-status-voting",
  "vote-ready": "bg-status-voting",
  adopted: "bg-status-adopted",
  implementing: "bg-status-implementing",
  completed: "bg-status-completed",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  deliberating: "Deliberating",
  vote_ready: "Voting",
  "vote-ready": "Voting",
  adopted: "Adopted",
  implementing: "Implementing",
  completed: "Completed",
};

const MAX_PILLS = 3;

export default function IssueCard({ issue }: IssueCardProps) {
  const anchors = issue.anchorLinks ?? [];
  const visibleAnchors = anchors.slice(0, MAX_PILLS);
  const overflow = anchors.length - visibleAnchors.length;

  return (
    <Link
      href={`/issues/${issue.id}`}
      className="card-lift group block p-5 bg-surface-container-lowest rounded-md"
    >
      {/* Top row: scope chip + status dot */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-meta text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-surface-container text-on-primary-container">
          {issue.scope}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              statusDotColor[issue.status] ?? "bg-on-surface-variant"
            }`}
          />
          <span className="font-meta text-xs text-on-surface-variant">
            {statusLabels[issue.status] ?? issue.status}
          </span>
        </div>
      </div>

      {/* Editorial title */}
      <h3 className="font-display text-xl font-bold leading-tight text-on-surface group-hover:text-primary-dim transition-colors mb-2">
        {issue.title}
      </h3>

      {/* Summary */}
      <p className="font-sans text-sm text-on-surface-variant line-clamp-2 mb-4">
        {issue.summary}
      </p>

      {/* Cell + anchor chips */}
      {(issue.cell || anchors.length > 0) && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {issue.cell ? <CellBadge cell={issue.cell} /> : null}
          {visibleAnchors.map((al) => (
            <AnchorPill key={al.anchor.id} anchor={al.anchor} />
          ))}
          {overflow > 0 ? (
            <span className="font-meta text-xs text-on-surface-variant">
              +{overflow}
            </span>
          ) : null}
        </div>
      )}

      {/* Footer: participant count, no borders */}
      <div className="pt-3 flex items-center justify-between font-meta text-xs text-on-surface-variant">
        <span>{issue.participants} participants</span>
        {issue.status === "completed" ? <span>✓ Completed</span> : null}
      </div>
    </Link>
  );
}
