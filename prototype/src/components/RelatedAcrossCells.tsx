"use client";

import Link from "next/link";
import CellBadge from "./CellBadge";
import AnchorPill from "./AnchorPill";
import type { CellTier, AnchorKind } from "@/lib/types";

interface RelatedIssue {
  id: string;
  title: string;
  status: string;
  cell: { id: string; cellId: string; displayName: string; tier: CellTier } | null;
  sharedAnchors: Array<{ id: string; anchorId: string; displayName: string; kind: AnchorKind }>;
}

interface Props {
  items: RelatedIssue[];
}

const statusColors: Record<string, string> = {
  draft: "bg-on-surface-variant",
  deliberating: "bg-status-deliberating",
  vote_ready: "bg-status-voting",
  "vote-ready": "bg-status-voting",
  adopted: "bg-status-adopted",
  implementing: "bg-status-implementing",
  completed: "bg-status-completed",
};

export default function RelatedAcrossCells({ items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-surface-container-lowest rounded-md p-4 space-y-3 card-lift">
      <div>
        <h3 className="font-display text-base font-semibold text-on-surface">
          Related across cells
        </h3>
        <p className="font-meta text-xs text-on-surface-variant mt-0.5">
          Issues in other cells that share at least one anchor with this one.
        </p>
      </div>

      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.id}
            className="rounded-md bg-surface-container-low hover:bg-surface-container transition-colors"
          >
            <Link href={`/issues/${it.id}`} className="block px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    statusColors[it.status] ?? "bg-on-surface-variant"
                  }`}
                />
                <span className="font-display font-medium text-on-surface text-sm truncate">
                  {it.title}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {it.cell ? <CellBadge cell={it.cell} linkTo="none" /> : null}
                {it.sharedAnchors.slice(0, 3).map((a) => (
                  <AnchorPill key={a.id} anchor={a} />
                ))}
                {it.sharedAnchors.length > 3 ? (
                  <span className="font-meta text-xs text-on-surface-variant px-1">
                    +{it.sharedAnchors.length - 3}
                  </span>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
