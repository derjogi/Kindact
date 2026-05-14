"use client";

import { useEffect, useState } from "react";
import { useRuntime, type RuntimeMode } from "@/lib/runtime";
import WalletKeySigningModal from "./WalletKeySigningModal";

const chipFor: Record<RuntimeMode, { dot: string; label: string; bg: string; text: string }> = {
  local: {
    dot: "bg-status-deliberating",
    label: "Local",
    bg: "bg-primary-container",
    text: "text-on-primary-container",
  },
  hosted: {
    dot: "bg-status-voting",
    label: "Hosted",
    bg: "bg-surface-container-low",
    text: "text-status-voting",
  },
  readonly: {
    dot: "bg-on-surface-variant",
    label: "Read-only",
    bg: "bg-surface-container-low",
    text: "text-on-surface-variant",
  },
  reconnecting: {
    dot: "bg-status-implementing animate-pulse",
    label: "Reconnecting…",
    bg: "bg-surface-container-low",
    text: "text-status-implementing",
  },
  offline: {
    dot: "bg-status-adopted",
    label: "Offline",
    bg: "bg-surface-container-low",
    text: "text-status-adopted",
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
        className={`inline-flex items-center gap-1.5 rounded-full font-meta px-2 py-0.5 text-xs ${chip.bg} ${chip.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />
        <span className="whitespace-nowrap">{chipText}</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-on-surface/30 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <aside
            className="w-full max-w-sm bg-surface-container-lowest h-full elevation-floating p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-on-surface">
                Conductor Runtime
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <div className="font-meta text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                  Current mode
                </div>
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 ${chip.bg} ${chip.text}`}
                >
                  <span className={`w-2 h-2 rounded-full ${chip.dot}`} />
                  <span className="font-medium">{chip.label}</span>
                </div>
              </div>

              <dl className="grid grid-cols-[110px_1fr] gap-y-1.5 text-xs text-on-surface-variant">
                <dt>Endpoint</dt>
                <dd className="font-mono text-on-surface truncate">{endpoint}</dd>
                <dt>Agent key</dt>
                <dd className="font-mono text-on-surface truncate">{agentKey}</dd>
                <dt>Cells</dt>
                <dd className="text-on-surface">{cellCount} installed</dd>
                <dt>Pending writes</dt>
                <dd className="text-on-surface">
                  {pending.length} total · {pendingCount} queued
                </dd>
              </dl>

              {/* Switch mode */}
              <div>
                <div className="font-meta text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                  Switch mode
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["local", "hosted", "readonly"] as RuntimeMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`font-meta px-2 py-1 rounded text-xs ${
                        mode === m
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
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
                  className="font-meta px-2.5 py-1 text-xs rounded bg-surface-container-low hover:bg-surface-container text-on-surface"
                >
                  Sync now
                </button>
                <button
                  type="button"
                  onClick={() => (simEnabled ? stopSim() : startSim())}
                  className="font-meta px-2.5 py-1 text-xs rounded bg-surface-container-low hover:bg-surface-container text-on-surface"
                >
                  {simEnabled ? "Stop simulation" : "Start simulation"}
                </button>
              </div>

              {/* Cells */}
              {cellCount > 0 ? (
                <div>
                  <div className="font-meta text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                    Cell sync
                  </div>
                  <ul className="space-y-1.5">
                    {Object.values(cellSync).map((c) => (
                      <li
                        key={c.cellId}
                        className="flex items-center justify-between gap-2 rounded bg-surface-container-low px-2 py-1.5"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-mono text-on-surface truncate">
                            {c.cellId}
                          </div>
                          <div className="font-meta text-[10px] text-on-surface-variant mt-0.5">
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
                          className="font-meta text-[10px] text-on-surface-variant hover:text-primary-dim hover:underline shrink-0"
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
                  <div className="font-meta text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                    Recent writes
                  </div>
                  <ul className="space-y-1 text-xs">
                    {pending.slice(-6).reverse().map((p) => (
                      <li key={p.id} className="flex items-center gap-2">
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            p.status === "confirmed"
                              ? "bg-status-deliberating"
                              : p.status === "rejected"
                              ? "bg-status-adopted"
                              : p.status === "syncing"
                              ? "bg-status-implementing animate-pulse"
                              : "bg-on-surface-variant"
                          }`}
                        />
                        <span className="text-on-surface truncate flex-1">{p.label}</span>
                        <span className="font-meta text-on-surface-variant">{p.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Dev menu */}
              <div className="pt-3">
                <div className="font-meta text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                  Dev: force state
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["local", "hosted", "readonly", "offline", "reconnecting"] as RuntimeMode[]).map(
                    (m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => forceMode(m)}
                        className="font-meta px-2 py-1 text-[11px] rounded bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
                      >
                        {m}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Demo actions */}
              <div>
                <div className="font-meta text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
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
                    className="font-meta px-2 py-1 text-[11px] rounded bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
                  >
                    Trigger bridge op
                  </button>
                  <button
                    type="button"
                    onClick={() => setSigningOpen(true)}
                    className="font-meta px-2 py-1 text-[11px] rounded bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
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
