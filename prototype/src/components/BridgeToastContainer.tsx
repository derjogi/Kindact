"use client";

import { useRuntime, type BridgePhase } from "@/lib/runtime";

const phaseLabel: Record<BridgePhase, string> = {
  submitted: "Submitted",
  bridge_signers_quorum: "Bridge quorum",
  on_chain_confirmed: "On-chain confirmed",
  failed: "Failed",
};

// Status-palette toned variants; phases map to the civic status colors via
// `border-l-4` accent rails (no all-around borders).
const phaseTone: Record<BridgePhase, string> = {
  submitted: "bg-surface-container-lowest text-on-surface border-status-voting",
  bridge_signers_quorum:
    "bg-surface-container-lowest text-on-surface border-status-implementing",
  on_chain_confirmed:
    "bg-surface-container-lowest text-on-surface border-status-deliberating",
  failed: "bg-surface-container-lowest text-on-surface border-status-adopted",
};

export default function BridgeToastContainer() {
  const bridgeOps = useRuntime((s) => s.bridgeOps);

  // Show the most recent 3 unfinished + freshly confirmed ops.
  const active = bridgeOps
    .filter((o) => o.phase !== "failed")
    .slice(-3)
    .reverse();

  if (active.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-40 flex flex-col gap-2 pointer-events-none">
      {active.map((op) => (
        <div
          key={op.id}
          className={`pointer-events-auto rounded-md border-l-4 px-3 py-2 text-xs elevation-floating max-w-xs ${phaseTone[op.phase]}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{op.label}</span>
            <span className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
              {phaseLabel[op.phase]}
            </span>
          </div>
          {op.phase !== "on_chain_confirmed" ? (
            <div className="mt-1 text-[11px] text-on-surface-variant">
              Queue position #{op.queuePosition ?? "?"}
              {op.etaSeconds ? ` · ETA ${op.etaSeconds}s` : ""}
            </div>
          ) : null}
          {op.txHash ? (
            <div className="mt-1 font-mono text-[10px] truncate text-on-surface-variant">
              {op.txHash}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
