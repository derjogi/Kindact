"use client";

import { useState } from "react";
import Link from "next/link";
import type { CellTier, AnchorKind } from "@/lib/types";

type ViewerCellRelation = "member" | "guest" | "none";

interface CellLite {
  id: string;
  cellId: string;
  displayName: string;
  tier: CellTier;
  membraneWrite?: string;
  scopeProofTypes?: string[];
}

interface AnchorLite {
  id: string;
  anchorId: string;
  kind: AnchorKind;
  displayName: string;
}

interface Props {
  issueId: string;
  cell: CellLite;
  anchorLinks: Array<{ anchor: AnchorLite }>;
  viewerCellRelation: ViewerCellRelation;
  viewerSubscribedAnchorIds: string[];
  onJoinCell: () => Promise<void> | void;
  onSubscribeAnchor: (anchorId: string) => Promise<void> | void;
  onOpenGuestModal: () => void;
}

const tierDot: Record<CellTier, string> = {
  canonical: "bg-emerald-500",
  promoted: "bg-sky-500",
  uncurated: "bg-stone-400",
};

function anchorLabel(a: AnchorLite) {
  if (a.kind === "topic") return a.displayName.startsWith("#") ? a.displayName : `#${a.displayName}`;
  if (a.kind === "location") return `📍 ${a.displayName.replace(/^📍\s*/, "")}`;
  return a.displayName;
}

export default function CellContextStrip({
  cell,
  anchorLinks,
  viewerCellRelation,
  viewerSubscribedAnchorIds,
  onJoinCell,
  onSubscribeAnchor,
  onOpenGuestModal,
}: Props) {
  const [collapsed, setCollapsed] = useState(viewerCellRelation === "member");

  // Pick a subscribed anchor to mention if relation is "subscribed via anchor".
  const matchedSubscribedAnchor = anchorLinks
    .map((l) => l.anchor)
    .find((a) => viewerSubscribedAnchorIds.includes(a.id));

  const firstAnchor = anchorLinks[0]?.anchor;

  // Membrane-deny case — viewer is not a member and the cell requires scope verification.
  const writeBlocked =
    viewerCellRelation === "none" &&
    cell.membraneWrite &&
    cell.membraneWrite !== "public";

  // Determine which state we're in.
  let state: "member" | "guest" | "subscribed" | "public" | "denied" = "public";
  if (viewerCellRelation === "member") state = "member";
  else if (viewerCellRelation === "guest") state = "guest";
  else if (matchedSubscribedAnchor) state = "subscribed";
  else if (writeBlocked) state = "denied";

  const tier = tierDot[cell.tier];

  if (state === "member" && collapsed) {
    return (
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-md px-3 py-1.5 text-xs text-emerald-800 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${tier}`} />
          ✓ You are a member of{" "}
          <Link href={`/cells/${encodeURIComponent(cell.cellId)}`} className="font-medium underline-offset-2 hover:underline">
            {cell.cellId}
          </Link>
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="text-emerald-700/70 hover:text-emerald-900"
        >
          expand
        </button>
      </div>
    );
  }

  if (state === "guest") {
    return (
      <div className="bg-violet-50/70 border border-violet-200 rounded-md px-3 py-2 text-sm text-violet-900 flex flex-wrap items-center gap-2">
        <span>🪪 You are a guest contributor on this issue in</span>
        <Link
          href={`/cells/${encodeURIComponent(cell.cellId)}`}
          className="inline-flex items-center gap-1 font-medium hover:underline"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${tier}`} />
          {cell.cellId}
        </Link>
        <span className="text-xs text-violet-700/80">
          · scoped to this issue only
        </span>
      </div>
    );
  }

  if (state === "subscribed" && matchedSubscribedAnchor) {
    return (
      <div className="bg-sky-50/70 border border-sky-200 rounded-md px-3 py-2 text-sm text-sky-900 flex flex-wrap items-center gap-2">
        <span>
          🔭 You see this via your{" "}
          <Link
            href={`/anchors/${encodeURIComponent(matchedSubscribedAnchor.anchorId)}`}
            className="font-medium hover:underline"
          >
            {anchorLabel(matchedSubscribedAnchor)}
          </Link>{" "}
          subscription.
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => void onJoinCell()}
            className="px-2.5 py-1 rounded text-xs font-medium bg-white border border-sky-300 hover:bg-sky-100 text-sky-800"
          >
            Join cell
          </button>
          <button
            type="button"
            onClick={onOpenGuestModal}
            className="px-2.5 py-1 rounded text-xs font-medium bg-sky-600 hover:bg-sky-700 text-white"
          >
            Contribute as guest
          </button>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="bg-amber-50/70 border border-amber-200 rounded-md px-3 py-2 text-sm text-amber-900 flex flex-wrap items-center gap-2">
        <span>🔒 Writing in {cell.cellId} requires scope verification</span>
        {cell.scopeProofTypes && cell.scopeProofTypes.length > 0 ? (
          <span className="text-xs text-amber-700/80">
            ({cell.scopeProofTypes.join(", ")})
          </span>
        ) : null}
        <button
          type="button"
          onClick={onOpenGuestModal}
          className="ml-auto px-2.5 py-1 rounded text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white"
        >
          Contribute as guest
        </button>
      </div>
    );
  }

  // Public / not subscribed
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm text-stone-700 flex flex-wrap items-center gap-2">
      <span>🌐 Public issue in {cell.cellId}.</span>
      <div className="flex items-center gap-1.5 ml-auto">
        {firstAnchor ? (
          <button
            type="button"
            onClick={() => void onSubscribeAnchor(firstAnchor.anchorId)}
            className="px-2.5 py-1 rounded text-xs font-medium bg-white border border-stone-300 hover:bg-stone-100 text-stone-700"
          >
            Subscribe to {anchorLabel(firstAnchor)}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void onJoinCell()}
          className="px-2.5 py-1 rounded text-xs font-medium bg-white border border-stone-300 hover:bg-stone-100 text-stone-700"
        >
          Join cell
        </button>
        <button
          type="button"
          onClick={onOpenGuestModal}
          className="px-2.5 py-1 rounded text-xs font-medium bg-stone-800 hover:bg-stone-900 text-white"
        >
          Contribute as guest
        </button>
      </div>
    </div>
  );
}
