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
  canonical: "bg-status-deliberating",
  promoted: "bg-status-voting",
  uncurated: "bg-on-surface-variant",
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

  const matchedSubscribedAnchor = anchorLinks
    .map((l) => l.anchor)
    .find((a) => viewerSubscribedAnchorIds.includes(a.id));

  const firstAnchor = anchorLinks[0]?.anchor;

  const writeBlocked =
    viewerCellRelation === "none" &&
    cell.membraneWrite &&
    cell.membraneWrite !== "public";

  let state: "member" | "guest" | "subscribed" | "public" | "denied" = "public";
  if (viewerCellRelation === "member") state = "member";
  else if (viewerCellRelation === "guest") state = "guest";
  else if (matchedSubscribedAnchor) state = "subscribed";
  else if (writeBlocked) state = "denied";

  const tier = tierDot[cell.tier];

  if (state === "member" && collapsed) {
    return (
      <div className="bg-surface-container-lowest border-l-4 border-status-deliberating rounded-md px-3 py-1.5 text-xs text-on-surface flex items-center justify-between gap-3 card-lift">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${tier}`} />
          ✓ You are a member of{" "}
          <Link
            href={`/cells/${encodeURIComponent(cell.cellId)}`}
            className="font-medium underline-offset-2 hover:underline text-primary-dim"
          >
            {cell.cellId}
          </Link>
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="font-meta text-on-surface-variant hover:text-primary-dim"
        >
          expand
        </button>
      </div>
    );
  }

  if (state === "guest") {
    return (
      <div className="bg-surface-container-lowest border-l-4 border-tertiary rounded-md px-3 py-2 text-sm text-on-surface flex flex-wrap items-center gap-2 card-lift">
        <span>🪪 You are a guest contributor on this issue in</span>
        <Link
          href={`/cells/${encodeURIComponent(cell.cellId)}`}
          className="inline-flex items-center gap-1 font-medium hover:underline text-tertiary"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${tier}`} />
          {cell.cellId}
        </Link>
        <span className="font-meta text-xs text-on-surface-variant">
          · scoped to this issue only
        </span>
      </div>
    );
  }

  if (state === "subscribed" && matchedSubscribedAnchor) {
    return (
      <div className="bg-surface-container-lowest border-l-4 border-status-voting rounded-md px-3 py-2 text-sm text-on-surface flex flex-wrap items-center gap-2 card-lift">
        <span>
          🔭 You see this via your{" "}
          <Link
            href={`/anchors/${encodeURIComponent(matchedSubscribedAnchor.anchorId)}`}
            className="font-medium hover:underline text-status-voting"
          >
            {anchorLabel(matchedSubscribedAnchor)}
          </Link>{" "}
          subscription.
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => void onJoinCell()}
            className="font-meta px-2.5 py-1 rounded text-xs font-medium bg-surface-container-low hover:bg-surface-container text-on-surface"
          >
            Join cell
          </button>
          <button
            type="button"
            onClick={onOpenGuestModal}
            className="btn-primary px-2.5 py-1 rounded text-xs font-medium"
          >
            Contribute as guest
          </button>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="bg-surface-container-lowest border-l-4 border-status-implementing rounded-md px-3 py-2 text-sm text-on-surface flex flex-wrap items-center gap-2 card-lift">
        <span>🔒 Writing in {cell.cellId} requires scope verification</span>
        {cell.scopeProofTypes && cell.scopeProofTypes.length > 0 ? (
          <span className="font-meta text-xs text-on-surface-variant">
            ({cell.scopeProofTypes.join(", ")})
          </span>
        ) : null}
        <button
          type="button"
          onClick={onOpenGuestModal}
          className="btn-primary ml-auto px-2.5 py-1 rounded text-xs font-medium"
        >
          Contribute as guest
        </button>
      </div>
    );
  }

  // Public / not subscribed
  return (
    <div className="bg-surface-container-low rounded-md px-3 py-2 text-sm text-on-surface flex flex-wrap items-center gap-2">
      <span>🌐 Public issue in {cell.cellId}.</span>
      <div className="flex items-center gap-1.5 ml-auto">
        {firstAnchor ? (
          <button
            type="button"
            onClick={() => void onSubscribeAnchor(firstAnchor.anchorId)}
            className="font-meta px-2.5 py-1 rounded text-xs font-medium bg-surface-container-lowest hover:bg-surface-container text-on-surface card-lift"
          >
            Subscribe to {anchorLabel(firstAnchor)}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void onJoinCell()}
          className="font-meta px-2.5 py-1 rounded text-xs font-medium bg-surface-container-lowest hover:bg-surface-container text-on-surface card-lift"
        >
          Join cell
        </button>
        <button
          type="button"
          onClick={onOpenGuestModal}
          className="btn-primary px-2.5 py-1 rounded text-xs font-medium"
        >
          Contribute as guest
        </button>
      </div>
    </div>
  );
}
