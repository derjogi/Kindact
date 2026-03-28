"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

interface SummaryRef {
  start: number;
  end: number;
  commentIds: string[];
  strength: string;
}

interface CommentInfo {
  id: string;
  alias: string;
  text: string;
}

interface SummaryWithRefsProps {
  content: string;
  references: SummaryRef[] | null;
  comments: CommentInfo[];
  onActiveSources: (
    sources: {
      commentId: string;
      alias: string;
      text: string;
      strength: string;
    }[],
    label: string,
  ) => void;
  onClearSources: () => void;
}

export default function SummaryWithRefs({
  content,
  references,
  comments,
  onActiveSources,
  onClearSources,
}: SummaryWithRefsProps) {
  const [stickyIndex, setStickyIndex] = useState<number | null>(null);

  const commentMap = useMemo(() => {
    const map = new Map<string, CommentInfo>();
    for (const c of comments) map.set(c.id, c);
    return map;
  }, [comments]);

  const segments = useMemo(() => {
    if (!references || references.length === 0) {
      return [
        { start: 0, end: content.length, text: content, refs: [] as SummaryRef[] },
      ];
    }

    const points = new Set<number>();
    points.add(0);
    points.add(content.length);
    for (const ref of references) {
      points.add(Math.max(0, ref.start));
      points.add(Math.min(content.length, ref.end));
    }
    const sorted = Array.from(points).sort((a, b) => a - b);

    const segs: {
      start: number;
      end: number;
      text: string;
      refs: SummaryRef[];
    }[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const s = sorted[i];
      const e = sorted[i + 1];
      const matchingRefs = references.filter((r) => r.start <= s && r.end >= e);
      segs.push({ start: s, end: e, text: content.slice(s, e), refs: matchingRefs });
    }
    return segs;
  }, [content, references]);

  const handleSegmentHover = useCallback(
    (segIndex: number) => {
      if (stickyIndex !== null) return;
      const seg = segments[segIndex];
      if (!seg || seg.refs.length === 0) {
        onClearSources();
        return;
      }
      onActiveSources(buildSources(seg.refs, commentMap), "Sources");
    },
    [segments, stickyIndex, commentMap, onActiveSources, onClearSources],
  );

  const handleSegmentClick = useCallback(
    (segIndex: number) => {
      const seg = segments[segIndex];
      if (!seg || seg.refs.length === 0) {
        setStickyIndex(null);
        onClearSources();
        return;
      }
      if (stickyIndex === segIndex) {
        setStickyIndex(null);
        onClearSources();
      } else {
        setStickyIndex(segIndex);
        onActiveSources(buildSources(seg.refs, commentMap), "Sources");
      }
    },
    [segments, stickyIndex, commentMap, onActiveSources, onClearSources],
  );

  const handleMouseLeave = useCallback(() => {
    if (stickyIndex === null) {
      onClearSources();
    }
  }, [stickyIndex, onClearSources]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stickyIndex !== null) {
        setStickyIndex(null);
        onClearSources();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stickyIndex, onClearSources]);

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">
          Summary
        </h2>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
          🟢 Updated recently
        </span>
      </div>
      <div
        className="text-sm leading-relaxed text-stone-700"
        onMouseLeave={handleMouseLeave}
      >
        {segments.map((seg, i) => {
          const hasRefs = seg.refs.length > 0;
          const isSticky = stickyIndex === i;
          const isDimmed = stickyIndex !== null && stickyIndex !== i;

          return (
            <span
              key={i}
              className={`
                ${hasRefs ? "cursor-pointer" : ""}
                ${isSticky ? "rounded bg-yellow-100" : ""}
                ${hasRefs && !isSticky ? "rounded hover:bg-yellow-50" : ""}
                ${isDimmed ? "opacity-50" : ""}
                transition-all duration-150
              `}
              onMouseEnter={() => handleSegmentHover(i)}
              onClick={() => handleSegmentClick(i)}
            >
              {seg.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function buildSources(
  refs: { commentIds: string[]; strength: string }[],
  commentMap: Map<string, CommentInfo>,
) {
  const seen = new Set<string>();
  const sources: {
    commentId: string;
    alias: string;
    text: string;
    strength: string;
  }[] = [];
  for (const ref of refs) {
    for (const cId of ref.commentIds) {
      if (seen.has(cId)) continue;
      seen.add(cId);
      const c = commentMap.get(cId);
      if (c) {
        sources.push({
          commentId: c.id,
          alias: c.alias,
          text: c.text,
          strength: ref.strength,
        });
      }
    }
  }
  return sources;
}
