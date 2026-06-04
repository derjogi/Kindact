"use client";

import { useRuntime } from "@/lib/runtime";

/**
 * Per-page banner shown when the conductor is offline or reconnecting.
 * Sits at the top of the main content area. Uses tonal layering + a
 * status-palette accent rail rather than full borders.
 */
export default function OfflineBanner() {
  const mode = useRuntime((s) => s.mode);
  const pending = useRuntime((s) => s.pending);
  const queued = pending.filter((p) => p.status === "queued").length;

  if (mode === "offline") {
    return (
      <div className="rounded-md border-l-4 border-status-adopted bg-surface-container-lowest px-3 py-2 text-sm text-on-surface flex items-center gap-2 card-lift">
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
      <div className="rounded-md border-l-4 border-status-implementing bg-surface-container-lowest px-3 py-2 text-sm text-on-surface flex items-center gap-2 card-lift">
        <span
          aria-hidden
          className="inline-block w-1.5 h-1.5 rounded-full bg-status-implementing animate-pulse"
        />
        <span>Reconnecting to the conductor…</span>
      </div>
    );
  }

  if (mode === "readonly") {
    return (
      <div className="rounded-md bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant flex items-center gap-2">
        <span aria-hidden>⚪</span>
        <span>
          Read-only mode. Sign in to a Holochain conductor or Holo host to write.
        </span>
      </div>
    );
  }

  return null;
}
