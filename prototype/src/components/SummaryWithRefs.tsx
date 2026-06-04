"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

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
  updatedSinceLastVisit?: boolean;
}

/*
 * rehype plugin: walks the rendered HTML AST and, for every text node that
 * overlaps one or more reference ranges, splits the text into <span> elements
 * carrying `data-ref-key` and `data-ref-indices` attributes. A `components`
 * override below picks those spans up and wires hover / click / sticky styling.
 *
 * Because we operate on text nodes only, surrounding markdown formatting
 * (headings, bold, lists, links, code) renders normally — references that
 * span across such formatting simply produce multiple highlighted spans,
 * which is exactly what you want visually.
 */
function makeReferencePlugin(refs: SummaryRef[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return () => (tree: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walk = (node: any) => {
      if (!node || !Array.isArray(node.children)) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const next: any[] = [];

      for (const child of node.children) {
        if (
          child &&
          child.type === "text" &&
          child.position &&
          typeof child.value === "string"
        ) {
          const tStart: number = child.position.start.offset ?? 0;
          const value: string = child.value;
          const tEnd: number =
            child.position.end.offset ?? tStart + value.length;

          // Find references whose source range overlaps this text node.
          const overlapping: { ref: SummaryRef; idx: number }[] = [];
          refs.forEach((r, idx) => {
            if (r.start < tEnd && r.end > tStart) {
              overlapping.push({ ref: r, idx });
            }
          });

          if (overlapping.length === 0) {
            next.push(child);
            continue;
          }

          // Compute local cut points (positions inside `value`).
          const cuts = new Set<number>([0, value.length]);
          for (const { ref } of overlapping) {
            cuts.add(Math.max(0, ref.start - tStart));
            cuts.add(Math.min(value.length, ref.end - tStart));
          }
          const sorted = [...cuts].sort((a, b) => a - b);

          for (let i = 0; i < sorted.length - 1; i++) {
            const s = sorted[i];
            const e = sorted[i + 1];
            if (e <= s) continue;

            const segText = value.slice(s, e);
            const absStart = tStart + s;
            const absEnd = tStart + e;

            // Which reference indices fully cover this segment?
            const segRefIdxs: number[] = [];
            for (const { ref, idx } of overlapping) {
              if (ref.start <= absStart && ref.end >= absEnd) {
                segRefIdxs.push(idx);
              }
            }

            if (segRefIdxs.length > 0) {
              next.push({
                type: "element",
                tagName: "span",
                properties: {
                  "data-ref-key": `${absStart}-${absEnd}`,
                  "data-ref-indices": segRefIdxs.join(","),
                },
                children: [{ type: "text", value: segText }],
              });
            } else {
              next.push({ type: "text", value: segText });
            }
          }
        } else {
          walk(child);
          next.push(child);
        }
      }

      node.children = next;
    };

    walk(tree);
  };
}

export default function SummaryWithRefs({
  content,
  references,
  comments,
  onActiveSources,
  onClearSources,
  updatedSinceLastVisit,
}: SummaryWithRefsProps) {
  const [stickyKey, setStickyKey] = useState<string | null>(null);

  const commentMap = useMemo(() => {
    const map = new Map<string, CommentInfo>();
    for (const c of comments) map.set(c.id, c);
    return map;
  }, [comments]);

  const refs = useMemo(() => references ?? [], [references]);

  const buildSourcesFromIndices = useCallback(
    (indices: number[]) => {
      const seen = new Set<string>();
      const out: {
        commentId: string;
        alias: string;
        text: string;
        strength: string;
      }[] = [];
      for (const i of indices) {
        const r = refs[i];
        if (!r) continue;
        for (const cId of r.commentIds) {
          if (seen.has(cId)) continue;
          seen.add(cId);
          const c = commentMap.get(cId);
          if (c) {
            out.push({
              commentId: c.id,
              alias: c.alias,
              text: c.text,
              strength: r.strength,
            });
          }
        }
      }
      return out;
    },
    [refs, commentMap],
  );

  const handleHover = useCallback(
    (indices: number[]) => {
      if (stickyKey !== null) return;
      const sources = buildSourcesFromIndices(indices);
      if (sources.length === 0) onClearSources();
      else onActiveSources(sources, "Sources");
    },
    [stickyKey, buildSourcesFromIndices, onActiveSources, onClearSources],
  );

  const handleClick = useCallback(
    (key: string, indices: number[]) => {
      if (stickyKey === key) {
        setStickyKey(null);
        onClearSources();
      } else {
        setStickyKey(key);
        const sources = buildSourcesFromIndices(indices);
        if (sources.length === 0) onClearSources();
        else onActiveSources(sources, "Sources");
      }
    },
    [stickyKey, buildSourcesFromIndices, onActiveSources, onClearSources],
  );

  const handleMouseLeave = useCallback(() => {
    if (stickyKey === null) onClearSources();
  }, [stickyKey, onClearSources]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stickyKey !== null) {
        setStickyKey(null);
        onClearSources();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stickyKey, onClearSources]);

  // Scope the rehype plugin to the current reference set.
  const rehypePlugins = useMemo(
    () => (refs.length > 0 ? [makeReferencePlugin(refs)] : []),
    [refs],
  );

  const components: Components = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    span: ({ node, children, ...props }: any) => {
      const dataset = node?.properties ?? {};
      const refKey: string | undefined =
        dataset["data-ref-key"] ?? dataset.dataRefKey;
      const refIndicesStr: string | undefined =
        dataset["data-ref-indices"] ?? dataset.dataRefIndices;

      if (refKey && refIndicesStr) {
        const indices: number[] = refIndicesStr
          .split(",")
          .map((n: string) => Number(n))
          .filter((n: number) => Number.isFinite(n));
        const isSticky = stickyKey === refKey;
        const isDimmed = stickyKey !== null && !isSticky;

        return (
          <span
            data-ref-key={refKey}
            className={`cursor-pointer rounded transition-all duration-150 ${
              isSticky
                ? "bg-primary-container"
                : "hover:bg-surface-container"
            } ${isDimmed ? "opacity-50" : ""}`}
            onMouseEnter={() => handleHover(indices)}
            onClick={() => handleClick(refKey, indices)}
          >
            {children}
          </span>
        );
      }

      return <span {...props}>{children}</span>;
    },
  };

  return (
    <div className="card-lift rounded-md bg-surface-container-lowest p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
          AI Summary
        </h2>
        {updatedSinceLastVisit && (
          <span className="font-meta rounded-full bg-primary-container px-2.5 py-0.5 text-xs text-on-primary-container">
            🟢 Updated since your last visit
          </span>
        )}
      </div>

      <div
        className="prose prose-stone max-w-none font-display text-lg leading-[1.6] text-on-surface
                   prose-headings:font-display prose-headings:text-on-surface
                   prose-p:my-3 prose-p:text-on-surface
                   prose-strong:text-on-surface
                   prose-a:text-tertiary
                   prose-ul:my-3 prose-li:my-1
                   prose-code:font-meta prose-code:text-on-surface prose-code:bg-surface-container-low prose-code:px-1 prose-code:rounded"
        onMouseLeave={handleMouseLeave}
      >
        <ReactMarkdown rehypePlugins={rehypePlugins} components={components}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
