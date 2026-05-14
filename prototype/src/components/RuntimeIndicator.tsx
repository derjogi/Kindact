"use client";

import { useEffect, useState } from "react";
import { useRuntime, type RuntimeMode } from "@/lib/runtime";
import WalletKeySigningModal from "./WalletKeySigningModal";

const chipFor: Record<RuntimeMode, { dot: string; label: string; bg: string; text: string }> = {
  local: {
    dot: "bg-emerald-500",
    label: "Local",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-800",
  },
  hosted: {
    dot: "bg-sky-500",
    label: "Hosted",
    bg: "bg-sky-50 border-sky-200",
    text: "text-sky-800",
  },
  readonly: {
    dot: "bg-stone-400",
    label: "Read-only",
    bg: "bg-stone-50 border-stone-200",
    text: "text-stone-600",
  },
  reconnecting: {
    dot: "bg-amber-500 animate-pulse",
    label: "Reconnecting…",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
  },
  offline: {
    dot: "bg-rose-500",
    label: "Offline",
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-800",
  },
};

export default function RuntimeIndicator() {
  const mode = useRuntime((s) => s.mode);
  const cellSync = useRuntime((s) => s.cellSync);
  const pending = useRuntime((s) => s.pending);
  const endpoint = useRuntime((s) => s.endpoint);
  const agentKey = useRuntime((s) => s.agentKey);
  const setMode = useRuntime((s) => s.setMode);
  const forceMode = useRuntime((s) => s.forceMode);
  const syncCellNow = useRuntime((s) => s.syncCellNow);
  const flushQueue = useRuntime((s) => s.flushQueue);
  const startSim = useRuntime((s) => s.startSim);
  const stopSim = useRuntime((s) => s.stopSim);
  const simEnabled = useRuntime((s) => s.simEnabled);
  const startBridgeOp = useRuntime((s) => s.startBridgeOp);
  const advanceBridgeOp = useRuntime((s) => s.advanceBridgeOp);

  const [open, setOpen] = useState(false);
  const [signingOpen, setSigningOpen] = useState(false);

  // Auto-start sim if the env flag is set.
  useEffect(() => {
    if (simEnabled) startSim();
    return () => stopSim();
    // We deliberately want one-shot effect on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chip = chipFor[mode];
  const cellCount = Object.keys(cellSync).length;
  const pendingCount = pending.filter((p) => p.status === "queued").length;

  const chipText =
    mode === "offline" && pendingCount > 0
      ? `${chip.label} · ${pendingCount} pending`
      : mode === "local" || mode === "hosted"
      ? `${chip.label}${cellCount > 0 ? ` · ${cellCount} cells` : ""}`
      : chip.label;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Conductor runtime"
        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${chip.bg} ${chip.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />
        <span className="whitespace-nowrap">{chipText}</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-stone-900/30"
          onClick={() => setOpen(false)}
        >
          <aside
            className="w-full max-w-sm bg-white h-full shadow-xl p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-stone-900">
                Conductor Runtime
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">
                  Current mode
                </div>
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 ${chip.bg} ${chip.text}`}
                >
                  <span className={`w-2 h-2 rounded-full ${chip.dot}`} />
                  <span className="font-medium">{chip.label}</span>
                </div>
              </div>

              <dl className="grid grid-cols-[110px_1fr] gap-y-1.5 text-xs text-stone-600">
                <dt className="text-stone-400">Endpoint</dt>
                <dd className="font-mono text-stone-700 truncate">{endpoint}</dd>
                <dt className="text-stone-400">Agent key</dt>
                <dd className="font-mono text-stone-700 truncate">{agentKey}</dd>
                <dt className="text-stone-400">Cells</dt>
                <dd className="text-stone-700">{cellCount} installed</dd>
                <dt className="text-stone-400">Pending writes</dt>
                <dd className="text-stone-700">{pending.length} total · {pendingCount} queued</dd>
              </dl>

              {/* Switch mode */}
              <div>
                <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">
                  Switch mode
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["local", "hosted", "readonly"] as RuntimeMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`px-2 py-1 rounded text-xs border ${
                        mode === m
                          ? "bg-stone-800 text-white border-stone-800"
                          : "bg-white text-stone-600 border-stone-300 hover:border-stone-400"
                      }`}
                    >
                      {chipFor[m].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    flushQueue();
                    Object.keys(cellSync).forEach(syncCellNow);
                  }}
                  className="px-2.5 py-1 text-xs rounded bg-white border border-stone-300 hover:bg-stone-50"
                >
                  Sync now
                </button>
                <button
                  type="button"
                  onClick={() => (simEnabled ? stopSim() : startSim())}
                  className="px-2.5 py-1 text-xs rounded bg-white border border-stone-300 hover:bg-stone-50"
                >
                  {simEnabled ? "Stop simulation" : "Start simulation"}
                </button>
              </div>

              {/* Cells */}
              {cellCount > 0 ? (
                <div>
                  <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">
                    Cell sync
                  </div>
                  <ul className="space-y-1.5">
                    {Object.values(cellSync).map((c) => (
                      <li
                        key={c.cellId}
                        className="flex items-center justify-between gap-2 rounded border border-stone-200 px-2 py-1.5"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-mono text-stone-700 truncate">
                            {c.cellId}
                          </div>
                          <div className="text-[10px] text-stone-500 mt-0.5">
                            {c.status}
                            {c.status === "syncing" ? ` ${c.syncPercent}%` : ""}
                            {c.pendingWrites > 0
                              ? ` · ${c.pendingWrites} pending`
                              : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => syncCellNow(c.cellId)}
                          className="text-[10px] text-stone-600 hover:underline shrink-0"
                        >
                          Sync
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Pending writes detail */}
              {pending.length > 0 ? (
                <div>
                  <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">
                    Recent writes
                  </div>
                  <ul className="space-y-1 text-xs">
                    {pending.slice(-6).reverse().map((p) => (
                      <li key={p.id} className="flex items-center gap-2">
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            p.status === "confirmed"
                              ? "bg-emerald-500"
                              : p.status === "rejected"
                              ? "bg-rose-500"
                              : p.status === "syncing"
                              ? "bg-amber-500 animate-pulse"
                              : "bg-stone-400"
                          }`}
                        />
                        <span className="text-stone-600 truncate flex-1">{p.label}</span>
                        <span className="text-stone-400">{p.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Dev menu */}
              <div className="pt-3 border-t border-stone-200">
                <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">
                  Dev: force state
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["local", "hosted", "readonly", "offline", "reconnecting"] as RuntimeMode[]).map(
                    (m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => forceMode(m)}
                        className="px-2 py-1 text-[11px] rounded border border-stone-300 hover:bg-stone-50 text-stone-600"
                      >
                        {m}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Demo actions */}
              <div>
                <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">
                  Demo
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const id = startBridgeOp("Redeem 50 $CC → USDC");
                      window.setTimeout(
                        () => advanceBridgeOp(id, "bridge_signers_quorum"),
                        2500,
                      );
                      window.setTimeout(
                        () =>
                          advanceBridgeOp(id, "on_chain_confirmed", {
                            txHash:
                              "0x" +
                              Math.random().toString(16).slice(2).padEnd(40, "0"),
                          }),
                        5500,
                      );
                    }}
                    className="px-2 py-1 text-[11px] rounded border border-stone-300 hover:bg-stone-50 text-stone-600"
                  >
                    Trigger bridge op
                  </button>
                  <button
                    type="button"
                    onClick={() => setSigningOpen(true)}
                    className="px-2 py-1 text-[11px] rounded border border-stone-300 hover:bg-stone-50 text-stone-600"
                  >
                    Constitutional vote
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      <WalletKeySigningModal
        open={signingOpen}
        actionLabel="Constitutional vote attestation"
        onConfirm={() => {
          setSigningOpen(false);
          const id = startBridgeOp("Constitutional vote attestation");
          window.setTimeout(
            () => advanceBridgeOp(id, "bridge_signers_quorum"),
            2000,
          );
          window.setTimeout(
            () =>
              advanceBridgeOp(id, "on_chain_confirmed", {
                txHash:
                  "0x" +
                  Math.random().toString(16).slice(2).padEnd(40, "0"),
              }),
            4500,
          );
        }}
        onCancel={() => setSigningOpen(false)}
      />
    </>
  );
}
