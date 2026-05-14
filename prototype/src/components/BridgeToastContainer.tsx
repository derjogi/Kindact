"use client";

import { useRuntime, type BridgePhase } from "@/lib/runtime";

const phaseLabel: Record<BridgePhase, string> = {
  submitted: "Submitted",
  bridge_signers_quorum: "Bridge quorum",
  on_chain_confirmed: "On-chain confirmed",
  failed: "Failed",
};

const phaseTone: Record<BridgePhase, string> = {
  submitted: "bg-sky-50 text-sky-800 border-sky-200",
  bridge_signers_quorum: "bg-amber-50 text-amber-800 border-amber-200",
  on_chain_confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  failed: "bg-rose-50 text-rose-800 border-rose-200",
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
          className={`pointer-events-auto rounded-lg border px-3 py-2 text-xs shadow-sm max-w-xs ${phaseTone[op.phase]}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{op.label}</span>
            <span className="text-[10px] uppercase tracking-wide">
              {phaseLabel[op.phase]}
            </span>
          </div>
          {op.phase !== "on_chain_confirmed" ? (
            <div className="mt-1 text-[11px] opacity-80">
              Queue position #{op.queuePosition ?? "?"}
              {op.etaSeconds ? ` · ETA ${op.etaSeconds}s` : ""}
            </div>
          ) : null}
          {op.txHash ? (
            <div className="mt-1 font-mono text-[10px] truncate opacity-70">
              {op.txHash}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
