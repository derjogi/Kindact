---
status: planned
created: '2026-05-12'
tags: [infrastructure, backend, holochain, conductor, bridge]
priority: critical
derivation: changed
counterpart: 014-off-chain-backend
depends_on:
  - 001-diamond-module-registry
  - 030-cell-architecture-and-registry
  - 040-bridge-specification
  - 041-base-dna-specification
  - 047-holo-hosting-strategy
---

# 014 — Conductor & Bridge Service

> **Status**: Exploratory · **Derivation**: changed · **Counterpart in implementation/**: [014-off-chain-backend](../../../implementation/specs/014-off-chain-backend/README.md) (the largest change in the hybrid spec set: AppView pattern → conductor + Holo hosting + bridge service).

## Overview

The implementation/ "off-chain backend" was a single AppView indexing chain + AT Proto, serving a REST/GraphQL API to the frontend. In the hybrid, this single backend is replaced by **three distinct services**:

1. **End-user conductor** — local or Holo-hosted Holochain conductor that the frontend connects to over WebSocket.
2. **Bridge service** — multi-instance, run by each System Agent member; mediates Holochain ↔ EVM operations per [040](../040-bridge-specification/README.md).
3. **Public read gateway** — read-only HTTP service serving DHT entry queries for non-conductor clients (search engines, archival, third-party tools).

This is a substantially different operational topology with different trust assumptions per layer.

## Design

### Service topology

```diagram
╭──────────────────╮      ╭─────────────────╮      ╭────────────────╮
│ End-user device  │      │ Bridge service  │      │ Public read    │
│ ─ frontend       │      │ (per signer)    │      │ gateway        │
│ ─ conductor      │      │ ─ Holochain     │      │ ─ HTTP API     │
│ ─ wallet         │      │   client        │      │ ─ DHT client   │
│                  │      │ ─ EVM client    │      │ ─ EVM read     │
│ ─ talks WS       │      │ ─ Safe signer   │      │ ─ AT Proto     │
│   to local       │      │   integration   │      │   read         │
│   conductor      │      │ ─ reconciler    │      │ ─ caching      │
│                  │      │                 │      │                │
│ OR talks WS to   │      │ Run by each of  │      │ Run by         │
│ Holo-hosted      │      │ 7 System Agent  │      │ Kindact +      │
│ conductor        │      │ members         │      │ community      │
╰──────────────────╯      ╰─────────────────╯      ╰────────────────╯
```

### End-user conductor

Per [047](../047-holo-hosting-strategy/README.md):

- Holochain conductor process running on user's device (local) or in Holo's hosting network (hosted).
- Hosts the user's source chain and participates in the DHT for joined cells.
- Exposes a WebSocket API consumed by the frontend ([015](../015-frontend/README.md)).
- Manages cell installation, joining, leaving.
- Keeps the user's signing key (or delegates to the user's wallet for sensitive operations).

### Bridge service

Per [040](../040-bridge-specification/README.md):

- Run independently by each System Agent multi-sig member.
- Subscribes to specific DHT entry types (verified_work aggregates, redemption requests, dispute resolutions, parameter mirror requests).
- Verifies entries: cell DNA conformance per [044](../044-cross-cell-validation-and-trust/README.md), quorum sigs, oracle witness validity per [045](../045-oracle-relay-network/README.md).
- Collects countersignatures from peer bridge instances (for reserve operations per [046](../046-reserve-operation-queue/README.md)).
- Submits EVM transactions through the Safe.
- Maintains the reconciliation worker for orphan detection.
- Mirrors EVM state changes back to DHT entries (parameter changes, cap snapshots, identity score updates).

The bridge service has access to:
- A Holochain conductor pre-configured with cap-tokens for bridge operations.
- An EVM RPC endpoint (preferably with archive node access).
- Their fraction of the Safe signing key.

Each instance is independent. They do not need to be hosted together; the multi-sig only requires that 5-of-7 reach quorum on each operation, which can happen across geographically and operationally distinct hosts.

### Public read gateway

The hybrid loses the unified AppView REST API. Some consumers — search engines, third-party tools, archival services, mobile push-notification services — need HTTP access without running a conductor.

The gateway:
- Runs a read-only Holochain conductor with broad cell membership (or accesses through Holo hosting reads).
- Maintains a Postgres index of anchored content for fast queries.
- Serves a versioned HTTP API: `/issues`, `/issues/:id`, `/issues/:id/comments`, etc.
- Consumes the EVM chain directly for on-chain state.
- Caches aggressively; cache invalidation by anchored-event subscription.

The gateway is **explicitly not authoritative** — it is a convenience service. Verifiable reads always go to the DHT directly via a conductor. The gateway publishes its operational policy and may be operated by multiple parties (Kindact + community).

The HTTP API is a **published, versioned contract** under `holochain/api-spec/` (analogous to implementation/'s API spec). Multiple gateway operators must conform to it.

### Database schema (gateway)

Postgres for fast read aggregation:

| Table | Description |
|---|---|
| `cells` | Mirror of Global Registry cell list |
| `issues` | Anchored issue records joined with cell DHT data |
| `comments`, `arguments`, `proposals`, `summaries` | Indexed deliberation entries |
| `votes` | Indexed vote entries with current tally |
| `work_packages`, `claims`, `reports`, `verifications` | Indexed work flow |
| `disputes` | Indexed dispute entries |
| `hypercerts` | EVM + AT Proto Hypercert anchors |
| `users` | EVM wallet + DID + Holochain agent key linkage |
| `audit_events` | Append-only ledger for tamper-evident gateway provenance |

This schema is roughly the implementation/ schema with `cellId` and `cellDnaHash` added to most tables and source columns repointed at Holochain entry hashes.

### Notification service

Implementation/ has the AppView push notifications. In the hybrid:

- Conductor-side: each user's conductor maintains a notification stream from their joined cells and subscribed anchors.
- Gateway-mediated push: for mobile users with intermittent conductor connectivity, the gateway can forward selected events to a push-notification service (FCM / APNs).
- Privacy: push delivery includes only event metadata; payload requires conductor read.

## Plan

1. [ ] Define the bridge service reference implementation (Rust or TypeScript).
2. [ ] Build conductor packaging: Tauri/Electron desktop wrapper; mobile build instructions.
3. [ ] Define the public read gateway HTTP API and version it under `holochain/api-spec/`.
4. [ ] Implement the gateway service.
5. [ ] Build the gateway-to-push-notification path.
6. [ ] Document the trust model for each service tier.
7. [ ] Plan operational runbook: bridge member onboarding, gateway operator onboarding, conductor support tier.

## Test

- [ ] End-user conductor (local + Holo): joins cell, authors entry, gossip propagates.
- [ ] Bridge service: detects verified work entry, collects 5-of-7 countersigs, submits EVM tx, anchors receipt back.
- [ ] Reconciliation: simulated mid-flight failure; pending state resolves to either complete or rolled-back.
- [ ] Gateway: serves issue API; matches DHT data; latency under target.
- [ ] Notification: cell event triggers push to mobile user within SLA.

## Open questions

- **§8.5.15 Bandwidth for two stacks** — three services instead of one is more operational load; how much can be community-operated?
- **§8.2.6 End-user runtime** — local vs. Holo-hosted vs. hybrid default.
- **Bridge service language** — Rust (Holochain-native) or TypeScript (faster prototyping)?
- **Gateway operator economics** — funded by Kindact, community, or paid by gateway consumers?
- **API contract evolution** — versioning strategy for the gateway API; deprecation policy.
- **Conductor support tier** — when a user's conductor breaks, who supports them? Holo support? Kindact support? Community?

## Notes

This is the largest implementation-time delta. The implementation/ spec was a single Node/PostgreSQL/AppView service; the hybrid splits it into a per-user conductor (multiplicity = N users), a per-signer bridge service (multiplicity = 7), and a multi-operator read gateway (multiplicity = 1+ community). Each service has its own deployment, monitoring, and security profile.

The trade-off is a meaningful gain in decentralization: no single party operates the AppView and serves authoritative reads. The cost is operational complexity, which is the bandwidth concern in [§8.5.15](../../../implementation/holochain-architecture-exploration.md). This spec is the largest argument for or against the hybrid depending on the team's tolerance for that complexity.
