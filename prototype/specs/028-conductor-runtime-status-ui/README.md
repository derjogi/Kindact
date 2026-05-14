---
status: planned
created: '2026-05-14'
tags:
  - frontend
  - ux
  - holochain
  - runtime
priority: medium
created_at: '2026-05-14T01:31:24.204270422+00:00'
---

# Conductor Runtime Status & Sync Indicators

> Add the persistent UI affordances Holochain requires the user to understand: which conductor mode they're on, per-cell sync state, offline-write pending, and bridge-pending operations.

Counterpart in holochain/: [015-frontend §Conductor connection management & §Real-time updates](../../../holochain/specs/015-frontend/README.md), [047-holo-hosting-strategy](../../../holochain/specs/047-holo-hosting-strategy/README.md), [039 Empty/Loading/Error States](../../../holochain/specs/039-empty-loading-error-states/README.md).

## Overview

A Holochain user can be in one of three runtime modes — **local conductor**, **Holo-hosted**, or **gateway-readonly** — with very different capabilities (e.g. read-only mode can browse but not write). They can also be temporarily offline with queued writes, or waiting on a bridge tx for an EVM-side operation. None of this is in the prototype today. Even on mocked data, surfacing these states now keeps designs honest and forces empty/loading/error patterns to be designed up front.

## Design

### Persistent runtime indicator (top bar)

A small chip next to the wallet balance, always visible:

```
🟢 Local · 7 cells   ← local conductor connected
🔵 Hosted · 7 cells  ← Holo-hosted
⚪ Read-only         ← gateway fallback, no writes
🟡 Reconnecting…     ← transient
🔴 Offline · 3 pending ← writes queued in source chain
```

Click → drawer with: current mode, endpoint, agent key (truncated), installed cells with per-cell sync %, "Switch mode" action, "Sync now" action.

### Per-cell sync state

Inside Cell Settings → My Cells (per [026](../026-cell-discovery-and-membership-ui/README.md)), each row shows:

| Column | State |
|---|---|
| Status | `connected` · `syncing 73%` · `paused` · `disconnected` |
| Last gossip | relative time |
| Pending writes | count, expandable into the queued-entries list |

### Inline write-state on actions

When the user submits a comment / vote / report:

- **Local / Hosted**: optimistic insert with a subtle "↗ syncing" footer that turns into "✓ confirmed" once gossip acks; "⚠ rejected by validator" on validation failure.
- **Read-only**: writes are disabled; CTAs render as `Sign in to a conductor to write` with a one-tap mode-switch.
- **Offline**: writes accept and stack with a "📥 Will sync when online · 3 pending" banner on the issue.

### Bridge-pending visibility

For EVM-side operations (reserve purchase, $CC redemption, constitutional vote attestation per [holochain/015](../../../holochain/specs/015-frontend/README.md)):

- Token Wallet shows redemption queue position, ETA, and final tx hash on completion.
- A non-blocking toast surfaces phase transitions: `submitted → bridge signers quorum → on-chain confirmed`.

### Runtime-mode confirmation for sensitive operations

Per holochain/047, sensitive operations (constitutional votes, large $CC redemptions) require the user to confirm they understand which key signs what. A modal: *"This action signs with your **wallet** (not your Holochain key). Switching modes will not affect this signature."*

### Mock implementation

Behind a feature flag `NEXT_PUBLIC_RUNTIME_SIM=true`, simulate:

- Random reconnect events every ~60s (10% chance) to exercise the reconnecting state.
- Toggle in dev menu: force `read-only`, force `offline`, force `bridge-pending`.
- All API calls in `src/lib/api.ts` honor the simulated mode (read-only rejects writes, offline queues them).

## Plan

- [ ] Add `useConductorStatus()` hook + simulated state machine in `src/lib/runtime.ts`.
- [ ] `<RuntimeIndicator>` chip in Layout top bar + drawer panel.
- [ ] Wire optimistic-write footer into comment, vote, report submission paths.
- [ ] Per-cell sync rows in Cell Settings → My Cells.
- [ ] Bridge-pending toast + Token Wallet queue widget (mocked timeline).
- [ ] Read-only and offline empty/error states across pages.
- [ ] Dev menu toggles for forced modes.

## Test

- [ ] Forcing read-only disables Comment / Vote / Submit Report CTAs with the mode-switch hint.
- [ ] Forcing offline lets the user submit a comment that appears with the "Will sync when online" banner; reconnecting clears the banner and turns optimistic items into confirmed.
- [ ] Reconnecting state appears at least once during a 5-minute session with simulation on.
- [ ] Bridge-pending toast progresses through all three phases for a mocked redemption.
- [ ] Wallet/agent-key signing modal appears for the constitutional-vote test action.

## Notes

This is the spec that pushes the prototype out of "happy path everywhere" mode. Even before a real conductor exists, designing for partial-availability surfaces every place the current UI silently assumes an always-connected, always-confirmed backend.

Open: do we want a graceful animation language for the optimistic → confirmed transition, or rely on simple state changes? Tie-in to [030 Stitch Civic Archive Visual Refresh](../030-stitch-civic-archive-visual-refresh/README.md) and holochain/[037 Motion and Feedback](../../../holochain/specs/037-motion-and-feedback/README.md).
