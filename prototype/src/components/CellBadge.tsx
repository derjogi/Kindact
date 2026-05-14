import Link from "next/link";
import type { CellTier } from "@/lib/types";

const tierMeta: Record<CellTier, { dot: string; label: string; tip: string }> = {
  canonical: {
    dot: "bg-emerald-500",
    label: "canonical",
    tip: "Canonical cell — governed by meta-governance.",
  },
  promoted: {
    dot: "bg-sky-500",
    label: "promoted",
    tip: "Promoted public cell — community-curated.",
  },
  uncurated: {
    dot: "bg-stone-400",
    label: "uncurated",
    tip: "Uncurated user-created cell. Anyone humanity-verified can create one.",
  },
};

interface CellBadgeProps {
  cell: {
    id?: string;
    cellId: string;
    displayName: string;
    tier: CellTier;
  };
  // If provided, the badge is wrapped in a link.
  linkTo?: "id" | "cellId" | "none";
  size?: "sm" | "md";
}

export default function CellBadge({ cell, linkTo = "cellId", size = "sm" }: CellBadgeProps) {
  const meta = tierMeta[cell.tier];
  const sizeCls = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  const inner = (
    <span
      title={`${meta.tip}\nID: ${cell.cellId}`}
      className={`inline-flex items-center gap-1.5 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors ${sizeCls}`}
    >
      <span className={`w-2 h-2 rounded-full ${meta.dot} shrink-0`} />
      <span className="truncate max-w-[12rem]">{cell.displayName}</span>
    </span>
  );

  if (linkTo === "none") return inner;
  const target = linkTo === "id" ? cell.id ?? cell.cellId : cell.cellId;
  return (
    <Link href={`/cells/${encodeURIComponent(target)}`} className="inline-block">
      {inner}
    </Link>
  );
}
