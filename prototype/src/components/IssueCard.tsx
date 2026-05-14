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

const statusColors: Record<string, string> = {
  draft: "bg-stone-400",
  deliberating: "bg-emerald-500",
  vote_ready: "bg-blue-500",
  adopted: "bg-violet-500",
  implementing: "bg-amber-500",
  completed: "bg-stone-600",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  deliberating: "Deliberating",
  vote_ready: "Voting",
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
    <div className="block rounded-lg border border-stone-200 bg-white px-4 py-3 hover:border-stone-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link href={`/issues/${issue.id}`} className="block">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  statusColors[issue.status] ?? "bg-stone-400"
                }`}
              />
              <h3 className="font-medium text-stone-900 truncate">{issue.title}</h3>
            </div>
            <p className="text-sm text-stone-500 line-clamp-1">{issue.summary}</p>
          </Link>

          {/* Cell + anchor row */}
          {(issue.cell || anchors.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {issue.cell ? <CellBadge cell={issue.cell} /> : null}
              {visibleAnchors.map((al) => (
                <AnchorPill key={al.anchor.id} anchor={al.anchor} />
              ))}
              {overflow > 0 ? (
                <span className="text-xs text-stone-400 px-1">+{overflow}</span>
              ) : null}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400">
            <span className="capitalize">{issue.scope}</span>
            <span>·</span>
            <span>{issue.participants} participants</span>
            <span>·</span>
            <span>{statusLabels[issue.status] ?? issue.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
