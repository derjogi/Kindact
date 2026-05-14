---
status: planned
created: '2026-05-12'
tags: [frontend, ux, holochain]
priority: high
derivation: changed
counterpart: 015-frontend
depends_on:
  - 014-conductor-and-bridge-service
  - 006-deliberation-cell
  - 030-cell-architecture-and-registry
  - 047-holo-hosting-strategy
related:
  - 032-design-system-foundations
  - 033-component-library
  - 034-information-architecture
---

# 015 — Frontend

> **Status**: Exploratory · **Derivation**: changed · **Counterpart in implementation/**: [015-frontend](../../../implementation/specs/015-frontend/README.md). The component design and screen inventory are unchanged; the data layer is rewired to talk to a conductor over WebSocket instead of an AppView REST API.

## Overview

The frontend is the same Next.js + wagmi + Tailwind app from implementation/, with one substantial substitution: the data layer talks to a Holochain conductor over WebSocket (per [014](../014-conductor-and-bridge-service/README.md), [047](../047-holo-hosting-strategy/README.md)) instead of to a unified AppView REST/GraphQL endpoint. The design system specs ([032–039 in implementation/](../../../implementation/specs/)) port directly without modification.

Read the [implementation/ counterpart](../../../implementation/specs/015-frontend/README.md) for the screen inventory, wallet-first auth, and component approach.

## What changes

### Data layer

| Implementation/ | Hybrid |
|---|---|
| `fetch('/api/issues')` to AppView REST | Conductor WebSocket zome call: `callZome('issues', 'list_issues', filter)` |
| GraphQL queries | Zome calls per cell + aggregator function in the frontend |
| Persistent HTTP connection | WebSocket connection to local or Holo-hosted conductor |
| Single API origin | Per-cell zome calls + per-bridge-call EVM tx + per-gateway HTTP fallback |

A thin client SDK (`@kindact/conductor-client`) wraps the WebSocket protocol and exposes a typed API similar to the AppView client, so most React components don't change.

### Conductor connection management

```typescript
interface ConductorConnection {
  mode: 'local' | 'holo' | 'gateway-readonly';
  endpoint: string;
  agentKey: AgentPubKey;
  installedCells: CellInfo[];
  status: 'connected' | 'reconnecting' | 'disconnected';
}
```

Connection priority on app load:
1. Try `ws://localhost:8888` (local conductor).
2. Try Holo Web SDK.
3. Fall back to gateway read-only mode.

A persistent UI element shows the current mode and offers switching ([047](../047-holo-hosting-strategy/README.md)).

### Cell installation UX

When a user joins a cell:
- Conductor installs the cell DNA + zomes locally.
- DHT membership starts; the user appears in the cell's roster.
- UI shows "joining" / "syncing" progress.

When a user leaves:
- Conductor stops participating in the cell's DHT.
- Source-chain entries authored remain (immutable) but the cell no longer counts the user as active.

When a user is a guest contributor on a single issue:
- Lightweight join — partial cell access, no validation duties.
- UI clearly labels "Guest contributor in cell X for issue Y."

### Wallet integration unchanged

Wallet-first auth, RainbowKit, EVM L2 connection — unchanged. The wallet signs:
- Identity-linkage proofs (linking Holochain agent keys per [002](../002-identity-primitive/README.md)).
- Reserve-purchase EVM transactions.
- Constitutional vote attestations (when on-chain attestation is required).

The Holochain agent key signs:
- Day-to-day cell entries (comments, votes, work claims).

The frontend orchestrates which key to use for which action.

### Real-time updates

Conductor pushes notifications over the WebSocket as new entries arrive (validated, gossip received). The frontend subscribes to specific entry types per screen:
- Issue page: subscribes to comments, vote changes, status transitions for that issue.
- Dashboard: subscribes to anchor matches per the user's subscriptions ([042](../042-anchor-and-subscription-model/README.md)).
- Notifications: subscribes to mentions, dispute events, governance events.

In gateway-readonly mode, real-time updates degrade to polling.

### Screens

Per implementation/, with these additions:

| Screen | Hybrid additions |
|---|---|
| Dashboard | Anchor subscriptions; cell membership list; runtime mode indicator |
| Issue detail | Cell name + cell governance link; binding view (which jurisdictional claims apply); guest-contributor option |
| Voting | Free vote casting (no gas indicator); fluid voting UI (change vote anytime) |
| Implementation | Local-mutual-credit option vs. canonical-$CC payment selector |
| Profile | Multiple Holochain agent keys; runtime mode selector; cell list |
| Token | Local-credit balance per cell + canonical $CC balance + reconciliation prompt; redemption queue status |
| Cell Settings (was Lens Settings) | Subscriptions; cell memberships; cell promotion status; cell creation flow |
| Meta-Governance | Bridge multi-sig roster view; oracle relay roster view; cell promotion proposals; jurisdictional-claim authority proposals |

### Design system & accessibility

The design system specs ([032 Design System Foundations](../../../implementation/specs/032-design-system-foundations/README.md), [033 Component Library](../../../implementation/specs/033-component-library/README.md), [034 Information Architecture](../../../implementation/specs/034-information-architecture/README.md), [035 Governance Data Visualization](../../../implementation/specs/035-governance-data-visualization/README.md), [036 Anonymization Visual Language](../../../implementation/specs/036-anonymization-visual-language/README.md), [037 Motion and Feedback](../../../implementation/specs/037-motion-and-feedback/README.md), [038 Accessibility and Responsive](../../../implementation/specs/038-accessibility-and-responsive/README.md), [039 Empty/Loading/Error States](../../../implementation/specs/039-empty-loading-error-states/README.md)) port directly. New empty/loading/error states are added for conductor-disconnect, Holo-host-unreachable, gateway-fallback, bridge-pending-redemption, and queue-cap-blown.

UI sub-specs ([018–027 in implementation/](../../../implementation/specs/)) port with the same component skeletons; the screen-level changes above flow into them.

## Plan

1. [ ] Build `@kindact/conductor-client` WebSocket SDK.
2. [ ] Wire conductor connection management with priority + fallback.
3. [ ] Update screens with hybrid additions per the table above.
4. [ ] Add new empty/loading/error states for conductor + bridge UX.
5. [ ] Implement runtime-mode confirmation UI for sensitive operations ([047](../047-holo-hosting-strategy/README.md)).
6. [ ] Implement guest contributor flow.
7. [ ] Performance test: how many anchor subscriptions before frontend perf degrades?

## Test

- [ ] Local conductor: app loads, connects, joins cell, posts entry.
- [ ] Holo-hosted: app loads via Web SDK, signs locally, posts entry; entry verifiable on Holo host's served data.
- [ ] Gateway-readonly: app loads with no conductor; can browse but cannot write; UI clearly indicates mode.
- [ ] Conductor disconnect mid-session: graceful reconnect; UI status updates.
- [ ] Vote casting: cell vote → instant feedback; tally finalization → on-chain confirmation visible.
- [ ] Redemption: queued status visible; updates as queue progresses; final tx hash visible.

## Open questions

- **SDK language** — TypeScript only, or do we need a Holochain-aware backend SDK for SSR?
- **SSR / static rendering** — does Next.js SSR work against a conductor connection? Probably need gateway-readonly for SSR pages.
- **Mobile UX** — Holo-hosted is the realistic path; what's the minimum viable mobile experience?
- **Offline behavior** — conductor can queue writes offline; UI needs to surface "offline-write pending sync" clearly.
- **Performance** — how many cells before WebSocket multiplexing degrades?

## Notes

The frontend is the place where the hybrid's UX promises are tested. Free comments + free votes + visible "redemption processes within 5 minutes" + "your local credit moves instantly" should add up to a tangibly better feel than the implementation/'s gas-everywhere model. If the conductor connection management or Holo-hosted sign-in flow feels worse than today's wallet-only login, the UX argument for the hybrid weakens substantially.

The design system carries over because it was substrate-independent in implementation/; that earlier scope decision pays off here.
