"use client";

import { useRuntime } from "@/lib/runtime";

/**
 * Per-page banner shown when the conductor is offline or reconnecting.
 * Sits at the top of the main content area.
 */
export default function OfflineBanner() {
  const mode = useRuntime((s) => s.mode);
  const pending = useRuntime((s) => s.pending);
  const queued = pending.filter((p) => p.status === "queued").length;

  if (mode === "offline") {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 flex items-center gap-2">
        <span aria-hidden>📥</span>
        <span>
          Offline · writes are queued in your source chain
          {queued > 0 ? ` · ${queued} pending` : ""}. They will sync when you
          reconnect.
        </span>
      </div>
    );
  }

  if (mode === "reconnecting") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 flex items-center gap-2">
        <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span>Reconnecting to the conductor…</span>
      </div>
    );
  }

  if (mode === "readonly") {
    return (
      <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 flex items-center gap-2">
        <span aria-hidden>⚪</span>
        <span>
          Read-only mode. Sign in to a Holochain conductor or Holo host to write.
        </span>
      </div>
    );
  }

  return null;
}
