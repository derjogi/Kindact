"use client";

import Link from "next/link";
import type { AnchorKind } from "@/lib/types";

const kindGlyph: Record<AnchorKind, string> = {
  topic: "#",
  location: "📍",
  event: "🎪",
  cell: "🔁",
};

interface AnchorPillProps {
  anchor: {
    id?: string;
    anchorId: string; // e.g. "anchor:#wind-power"
    displayName: string;
    kind: AnchorKind;
  };
  state?: "default" | "subscribed" | "muted" | "inherited";
  size?: "sm" | "md";
  count?: number; // optional subscriber/issue count to display
  onClick?: () => void;
}

export default function AnchorPill({
  anchor,
  state = "default",
  size = "sm",
  count,
  onClick,
}: AnchorPillProps) {
  const glyph = kindGlyph[anchor.kind];

  const tone =
    state === "subscribed"
      ? "bg-primary-container text-on-primary-container"
      : state === "muted"
      ? "bg-surface-container-low text-on-surface-variant line-through"
      : state === "inherited"
      ? "bg-tertiary-container text-tertiary"
      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container";

  const sizeCls = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  const target = anchor.anchorId; // routing uses the stable global id

  const inner = (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-meta transition-colors ${tone} ${sizeCls}`}
    >
      {/* hash anchors already encode # in displayName via kind glyph */}
      <span aria-hidden className="font-medium">{glyph === "#" ? "#" : glyph}</span>
      <span className="truncate max-w-[10rem]">
        {anchor.kind === "topic"
          ? anchor.displayName.replace(/^#/, "")
          : anchor.displayName}
      </span>
      {typeof count === "number" && count > 0 ? (
        <span className="text-[10px] opacity-60">· {count}</span>
      ) : null}
    </span>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="inline-block" type="button">
        {inner}
      </button>
    );
  }

  return (
    <Link href={`/anchors/${encodeURIComponent(target)}`} className="inline-block">
      {inner}
    </Link>
  );
}
