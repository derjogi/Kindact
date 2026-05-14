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
  draft: "bg-stone-400",
  deliberating: "bg-emerald-500",
  vote_ready: "bg-blue-500",
  "vote-ready": "bg-blue-500",
  adopted: "bg-violet-500",
  implementing: "bg-amber-500",
  completed: "bg-stone-600",
};

export default function RelatedAcrossCells({ items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-stone-900">Related across cells</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Issues in other cells that share at least one anchor with this one.
        </p>
      </div>

      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.id}
            className="rounded-md border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all"
          >
            <Link href={`/issues/${it.id}`} className="block px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    statusColors[it.status] ?? "bg-stone-400"
                  }`}
                />
                <span className="font-medium text-stone-900 text-sm truncate">
                  {it.title}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {it.cell ? <CellBadge cell={it.cell} linkTo="none" /> : null}
                {it.sharedAnchors.slice(0, 3).map((a) => (
                  <AnchorPill key={a.id} anchor={a} />
                ))}
                {it.sharedAnchors.length > 3 ? (
                  <span className="text-xs text-stone-400 px-1">
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
