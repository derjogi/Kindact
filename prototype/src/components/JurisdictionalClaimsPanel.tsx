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
    <div className="bg-amber-50/50 border border-amber-200 rounded-md">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100/50"
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
        <span className="text-xs text-amber-700/80">
          {expanded ? "▲ Hide clauses" : "▼ See clauses applied"}
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-amber-200 px-3 py-2 space-y-2 text-sm text-amber-900">
          {claims.map((c) => (
            <div key={c} className="flex items-start gap-2">
              <code className="text-xs bg-white border border-amber-200 rounded px-1.5 py-0.5">
                {c}
              </code>
              <span className="text-xs text-amber-800/80">
                — applied because this issue lives in <code>{cellId}</code>.
              </span>
            </div>
          ))}
          <p className="text-xs text-amber-700/70 pt-1">
            Prototype: clauses are referenced by id. Full text resolution lives
            in the cell&apos;s jurisdictional claim registry (holochain/043).
          </p>
        </div>
      ) : null}
    </div>
  );
}
