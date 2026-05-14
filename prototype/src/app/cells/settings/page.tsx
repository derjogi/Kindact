"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import CellBadge from "@/components/CellBadge";
import AnchorPill from "@/components/AnchorPill";
import {
  fetchMyCells,
  fetchMySubscriptions,
  leaveCell,
  unsubscribeAnchor,
  muteAnchor,
} from "@/lib/api";
import type { MyCellMembership, MyAnchorSubscription } from "@/lib/types";
import { useRuntime } from "@/lib/runtime";

type Tab = "cells" | "subscriptions";

export default function CellSettingsPage() {
  const [tab, setTab] = useState<Tab>("subscriptions");
  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-stone-900">Cell settings</h1>
          <Link href="/cells/new" className="text-sm text-stone-600 underline">
            + Create cell
          </Link>
        </div>

        <div className="flex gap-1 border-b border-stone-200">
          <TabButton active={tab === "subscriptions"} onClick={() => setTab("subscriptions")}>
            My Subscriptions
          </TabButton>
          <TabButton active={tab === "cells"} onClick={() => setTab("cells")}>
            My Cells
          </TabButton>
        </div>

        {tab === "subscriptions" ? <SubscriptionsTab /> : <CellsTab />}
      </div>
    </Layout>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm border-b-2 -mb-px ${
        active
          ? "border-stone-800 text-stone-900 font-medium"
          : "border-transparent text-stone-500 hover:text-stone-700"
      }`}
    >
      {children}
    </button>
  );
}

function CellsTab() {
  const [items, setItems] = useState<MyCellMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const cellSync = useRuntime((s) => s.cellSync);
  const upsertCellSync = useRuntime((s) => s.upsertCellSync);
  const syncCellNow = useRuntime((s) => s.syncCellNow);
  const mode = useRuntime((s) => s.mode);
  const pending = useRuntime((s) => s.pending);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchMyCells();
      setItems(data);

      // Seed sync state for any cells we don't already track.
      const now = Date.now();
      for (const m of data) {
        if (!cellSync[m.cell.cellId]) {
          // Deterministic but varied mock state per cell.
          const hash = m.cell.cellId
            .split("")
            .reduce((a, c) => a + c.charCodeAt(0), 0);
          const variant = hash % 4;
          upsertCellSync({
            cellId: m.cell.cellId,
            status:
              variant === 0
                ? "connected"
                : variant === 1
                ? "syncing"
                : variant === 2
                ? "paused"
                : "disconnected",
            syncPercent: variant === 1 ? 60 + (hash % 30) : 100,
            lastGossipAt: now - (hash % 3600) * 1000,
            pendingWrites: variant === 2 ? (hash % 3) + 1 : 0,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLeave(cellUuid: string) {
    if (!confirm("Leave this cell? Your existing posts remain but you stop participating.")) return;
    await leaveCell(cellUuid);
    await load();
  }

  if (loading) return <p className="text-stone-400 text-sm py-6">Loading…</p>;
  if (items.length === 0) {
    return (
      <p className="text-stone-400 text-sm py-6">
        You are not a member of any cells. <Link href="/cells" className="underline">Browse cells</Link>.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((m) => {
        const sync = cellSync[m.cell.cellId];
        const cellPending = pending.filter(
          (p) => p.cellId === m.cell.cellId,
        ).length;
        const writeBlocked = mode === "readonly";

        return (
          <div
            key={m.membershipId}
            className="rounded-lg border border-stone-200 bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CellBadge cell={m.cell} />
                  <span className="text-xs text-stone-400">
                    {m.kind === "guest" ? "guest contributor" : "member"}
                  </span>
                </div>
                <div className="text-xs text-stone-400 mt-1">
                  {m.cell.scopeLevel} · {m.cell.memberCount} members ·{" "}
                  {m.cell.issueCount} issues · joined{" "}
                  {new Date(m.joinedAt).toLocaleDateString()}
                </div>
              </div>
              {m.kind === "member" ? (
                <button
                  onClick={() => onLeave(m.cell.id)}
                  disabled={writeBlocked}
                  className="text-xs text-red-700 hover:underline disabled:text-stone-300 disabled:no-underline disabled:cursor-not-allowed"
                  title={writeBlocked ? "Read-only mode disables writes" : undefined}
                >
                  Leave
                </button>
              ) : null}
            </div>

            {/* Per-cell sync row */}
            <div className="mt-2 pt-2 border-t border-stone-100 grid grid-cols-3 gap-2 text-[11px] text-stone-500">
              <div>
                <span className="block uppercase tracking-wide text-[9px] text-stone-400">
                  Status
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      sync?.status === "connected"
                        ? "bg-emerald-500"
                        : sync?.status === "syncing"
                        ? "bg-amber-500 animate-pulse"
                        : sync?.status === "paused"
                        ? "bg-stone-400"
                        : "bg-rose-500"
                    }`}
                  />
                  {sync?.status === "syncing"
                    ? `syncing ${sync.syncPercent}%`
                    : sync?.status ?? "unknown"}
                </span>
              </div>
              <div>
                <span className="block uppercase tracking-wide text-[9px] text-stone-400">
                  Last gossip
                </span>
                {sync ? relTime(sync.lastGossipAt) : "—"}
              </div>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <span className="block uppercase tracking-wide text-[9px] text-stone-400">
                    Pending writes
                  </span>
                  {(sync?.pendingWrites ?? 0) + cellPending}
                </div>
                <button
                  type="button"
                  onClick={() => syncCellNow(m.cell.cellId)}
                  className="text-[11px] text-stone-600 hover:underline"
                >
                  Sync
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function relTime(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SubscriptionsTab() {
  const [items, setItems] = useState<MyAnchorSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await fetchMySubscriptions());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function onUnsub(anchorId: string) {
    await unsubscribeAnchor(anchorId);
    await load();
  }
  async function onToggleMute(anchorId: string, muted: boolean) {
    await muteAnchor(anchorId, !muted);
    await load();
  }

  if (loading) return <p className="text-stone-400 text-sm py-6">Loading…</p>;
  if (items.length === 0) {
    return (
      <p className="text-stone-400 text-sm py-6">
        No subscriptions yet. <Link href="/anchors" className="underline">Browse anchors</Link> and
        subscribe to topics or places to follow them across cells.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <AnchorPill anchor={s.anchor} state={s.muted ? "muted" : "subscribed"} />
              <span className="text-xs text-stone-400">
                {s.anchor.issueCount} issues · since{" "}
                {new Date(s.subscribedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleMute(s.anchor.anchorId, s.muted)}
              className="text-xs text-stone-600 hover:underline"
            >
              {s.muted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={() => onUnsub(s.anchor.anchorId)}
              className="text-xs text-red-700 hover:underline"
            >
              Unsubscribe
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
