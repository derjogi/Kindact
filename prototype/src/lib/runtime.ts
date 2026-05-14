"use client";

import { create } from "zustand";

// ─── Types ──────────────────────────────────────────────────────────────────

export type RuntimeMode =
  | "local"        // local Holochain conductor
  | "hosted"       // Holo-hosted
  | "readonly"     // gateway fallback, no writes
  | "reconnecting" // transient
  | "offline";     // writes queued in source chain

export type WriteKind =
  | "comment"
  | "argument"
  | "vote"
  | "report"
  | "join"
  | "subscribe"
  | "other";

export interface PendingWrite {
  id: string;
  kind: WriteKind;
  label: string;
  cellId?: string;
  createdAt: number;
  status: "queued" | "syncing" | "confirmed" | "rejected";
}

export type BridgePhase =
  | "submitted"
  | "bridge_signers_quorum"
  | "on_chain_confirmed"
  | "failed";

export interface BridgeOp {
  id: string;
  label: string;
  phase: BridgePhase;
  startedAt: number;
  txHash?: string;
  queuePosition?: number;
  etaSeconds?: number;
}

export interface CellSyncState {
  cellId: string; // stable cell id (or db id) — caller decides
  status: "connected" | "syncing" | "paused" | "disconnected";
  syncPercent: number;
  lastGossipAt: number;
  pendingWrites: number;
}

interface RuntimeState {
  mode: RuntimeMode;
  prevMode: RuntimeMode; // what to restore after a transient reconnect
  endpoint: string;
  agentKey: string;
  cellSync: Record<string, CellSyncState>;
  pending: PendingWrite[];
  bridgeOps: BridgeOp[];
  simEnabled: boolean;
  simIntervalId: number | null;

  // mode controls
  setMode: (mode: RuntimeMode) => void;
  forceMode: (mode: RuntimeMode | null) => void; // null clears forcing

  // writes
  enqueueWrite: (w: Omit<PendingWrite, "id" | "createdAt" | "status">) => string;
  markWrite: (id: string, status: PendingWrite["status"]) => void;
  flushQueue: () => void;

  // bridge ops
  startBridgeOp: (label: string) => string;
  advanceBridgeOp: (id: string, phase: BridgePhase, extra?: Partial<BridgeOp>) => void;

  // cell sync
  upsertCellSync: (s: CellSyncState) => void;
  syncCellNow: (cellId: string) => void;

  // sim lifecycle
  startSim: () => void;
  stopSim: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const SIM_FLAG =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_RUNTIME_SIM === "true";

// ─── Store ──────────────────────────────────────────────────────────────────

export const useRuntime = create<RuntimeState>()((set, get) => ({
  mode: "local",
  prevMode: "local",
  endpoint: "ws://localhost:8888 (mock)",
  agentKey: "uhCAk4-mock-agent-key-truncated",
  cellSync: {},
  pending: [],
  bridgeOps: [],
  simEnabled: SIM_FLAG,
  simIntervalId: null,

  setMode: (mode) =>
    set((s) => ({
      prevMode: s.mode === "reconnecting" ? s.prevMode : s.mode,
      mode,
    })),

  forceMode: (mode) => {
    if (mode === null) {
      set({ mode: "local" });
      return;
    }
    set((s) => ({
      prevMode: s.mode === "reconnecting" ? s.prevMode : s.mode,
      mode,
    }));
  },

  enqueueWrite: (w) => {
    const id = uid("w");
    const entry: PendingWrite = {
      id,
      kind: w.kind,
      label: w.label,
      cellId: w.cellId,
      createdAt: Date.now(),
      status: get().mode === "offline" ? "queued" : "syncing",
    };
    set((s) => ({ pending: [...s.pending, entry] }));
    return id;
  },

  markWrite: (id, status) =>
    set((s) => ({
      pending: s.pending.map((p) => (p.id === id ? { ...p, status } : p)),
    })),

  flushQueue: () =>
    set((s) => ({
      pending: s.pending.map((p) =>
        p.status === "queued" ? { ...p, status: "syncing" } : p,
      ),
    })),

  startBridgeOp: (label) => {
    const id = uid("br");
    const op: BridgeOp = {
      id,
      label,
      phase: "submitted",
      startedAt: Date.now(),
      queuePosition: Math.floor(Math.random() * 5) + 1,
      etaSeconds: 30,
    };
    set((s) => ({ bridgeOps: [...s.bridgeOps, op] }));
    return id;
  },

  advanceBridgeOp: (id, phase, extra) =>
    set((s) => ({
      bridgeOps: s.bridgeOps.map((op) =>
        op.id === id ? { ...op, phase, ...(extra ?? {}) } : op,
      ),
    })),

  upsertCellSync: (entry) =>
    set((s) => ({ cellSync: { ...s.cellSync, [entry.cellId]: entry } })),

  syncCellNow: (cellId) =>
    set((s) => {
      const cur = s.cellSync[cellId];
      if (!cur) return s;
      return {
        cellSync: {
          ...s.cellSync,
          [cellId]: {
            ...cur,
            status: "connected",
            syncPercent: 100,
            lastGossipAt: Date.now(),
            pendingWrites: 0,
          },
        },
      };
    }),

  startSim: () => {
    if (typeof window === "undefined") return;
    if (get().simIntervalId !== null) return;
    const id = window.setInterval(() => {
      const s = get();
      // 10% chance per tick to flicker reconnecting for ~3s.
      if (
        (s.mode === "local" || s.mode === "hosted") &&
        Math.random() < 0.1
      ) {
        const before = s.mode;
        set({ mode: "reconnecting", prevMode: before });
        window.setTimeout(() => {
          // Only restore if we're still in reconnecting (user may have switched).
          if (get().mode === "reconnecting") {
            set({ mode: before });
            get().flushQueue();
          }
        }, 3000);
      }
    }, 60_000);
    set({ simIntervalId: id as unknown as number, simEnabled: true });
  },

  stopSim: () => {
    if (typeof window === "undefined") return;
    const id = get().simIntervalId;
    if (id !== null) window.clearInterval(id);
    set({ simIntervalId: null, simEnabled: false });
  },
}));

// ─── Helpers exported for api.ts wrapping ───────────────────────────────────

/**
 * Gate a write call by current runtime mode.
 *  - readonly  → throw with a friendly message; UI should redirect to mode switch.
 *  - offline   → enqueue and resolve with a mock optimistic id, do NOT call fn.
 *  - others    → enqueue (syncing), call fn, mark confirmed/rejected.
 */
export async function gatedWrite<T>(
  meta: { kind: WriteKind; label: string; cellId?: string },
  fn: () => Promise<T>,
): Promise<T> {
  const rt = useRuntime.getState();

  if (rt.mode === "readonly") {
    throw new Error(
      "Read-only mode: connect a Holochain conductor or Holo host to write.",
    );
  }

  const id = rt.enqueueWrite(meta);

  if (rt.mode === "offline") {
    // Queue it; resolve with a sentinel that callers can treat as optimistic.
    return { __queued: true, __pendingId: id } as unknown as T;
  }

  try {
    const result = await fn();
    rt.markWrite(id, "confirmed");
    return result;
  } catch (err) {
    rt.markWrite(id, "rejected");
    throw err;
  }
}

export function isQueuedResult(v: unknown): v is { __queued: true; __pendingId: string } {
  return (
    !!v && typeof v === "object" && (v as Record<string, unknown>).__queued === true
  );
}
