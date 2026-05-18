"use client";

import { useState } from "react";

interface Props {
  cellId: string;
  claims: string[];
}

export default function JurisdictionalClaimsPanel({ cellId, claims }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!claims || claims.length === 0) return null;

  return (
    <div className="bg-surface-container-lowest border-l-4 border-status-implementing rounded-md card-lift">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors rounded-md"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden>⚖️</span>
          <span>
            This issue is subject to{" "}
            <strong>
              {claims.length === 1 ? claims[0] : `${claims.length} jurisdictional claim(s)`}
            </strong>
          </span>
        </span>
        <span className="font-meta text-xs text-on-surface-variant">
          {expanded ? "▲ Hide clauses" : "▼ See clauses applied"}
        </span>
      </button>

      {expanded ? (
        <div className="px-3 py-2 space-y-2 text-sm text-on-surface bg-surface-container-low rounded-b-md">
          {claims.map((c) => (
            <div key={c} className="flex items-start gap-2">
              <code className="text-xs bg-surface-container-lowest rounded px-1.5 py-0.5 font-mono">
                {c}
              </code>
              <span className="text-xs text-on-surface-variant">
                — applied because this issue lives in <code className="font-mono">{cellId}</code>.
              </span>
            </div>
          ))}
          <p className="text-xs text-on-surface-variant pt-1">
            Prototype: clauses are referenced by id. Full text resolution lives
            in the cell&apos;s jurisdictional claim registry (holochain/043).
          </p>
        </div>
      ) : null}
    </div>
  );
}
