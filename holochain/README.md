# Kindact — Holochain Hybrid Alternative (Exploratory Spec Set)

> **Status**: Exploratory. Sibling to [implementation/](../implementation/). Not a commitment to build.
> **Purpose**: Side-by-side comparison spec set against the current EVM L2 + AT Protocol architecture.
> **Source**: [implementation/holochain-architecture-exploration.md](../implementation/holochain-architecture-exploration.md). Read that document first.

## Architectural target

A three-layer **hybrid**, not a wholesale Holochain port:

```diagram
╭────────────────────────────────────────────────────────────────╮
│ HOLOCHAIN COORDINATION LAYER                                    │
│   Deliberation, work claims, peer validation, lens/cell         │
│   membership, free social actions, local mutual-credit          │
│   accounting (per cell). Composed of: Base DNA + Global         │
│   Registry DNA + promoted public cells + user-created cells.    │
╰─────────────────────────────────┬───────────────────────────────╯
                                  │
                                  ▼
╭────────────────────────────────────────────────────────────────╮
│ BRIDGE — System Agent multi-sig                                  │
│   Capability-token-controlled in Holochain, EVM signing key on  │
│   the chain side. Idempotent retry + reconciliation. The single │
│   most security-critical surface in the design.                 │
╰─────────────────────────────────┬───────────────────────────────╯
                                  ▼
╭────────────────────────────────────────────────────────────────╮
│ EVM L2 SETTLEMENT LAYER (Optimism / Base)                        │
│   $CC ERC-20 + global decay index, reserve custody (USDC),      │
│   Hypercerts (recognized impact credentials), dispute clawbacks │
│   via Debt Ledger, identity provider integrations, oracles.     │
╰────────────────────────────────────────────────────────────────╯
```

## Spec set

Specs are numbered to align with the corresponding [implementation/specs](../implementation/specs/) where one exists, with new specs in the 040+ range. Status of each spec relative to the current implementation set is recorded in its frontmatter (`derivation: ported | changed | new | replaces`).

### Foundational

- [000 — Substrate Architecture Decision Record](specs/000-substrate-architecture-decision-record/README.md) — Why hybrid; what lives where; assumptions.

### EVM settlement layer (mostly ported)

- [001 — Diamond Module Registry](specs/001-diamond-module-registry/README.md)
- [003 — $CC Token Core](specs/003-cc-token-core/README.md)
- [010 — Reserve Exchange](specs/010-reserve-exchange/README.md)
- [011 — Hypercerts Bridge](specs/011-hypercerts-bridge/README.md)
- [012 — Dispute Resolution](specs/012-dispute-resolution/README.md)
- [013 — Meta-Governance](specs/013-meta-governance/README.md)

### Bridge

- [040 — Bridge Specification](specs/040-bridge-specification/README.md)

### Holochain coordination layer

- [041 — Base DNA Specification](specs/041-base-dna-specification/README.md)
- [030 — Cell Architecture & Registry](specs/030-cell-architecture-and-registry/README.md) *(replaces lens model)*
- [042 — Anchor & Subscription Model](specs/042-anchor-and-subscription-model/README.md)
- [043 — Jurisdictional Claims](specs/043-jurisdictional-claims/README.md)
- [044 — Cross-Cell Validation & Trust](specs/044-cross-cell-validation-and-trust/README.md)
- [045 — Oracle Relay Network](specs/045-oracle-relay-network/README.md)
- [046 — Reserve Operation Queue](specs/046-reserve-operation-queue/README.md)
- [047 — Holo Hosting Strategy](specs/047-holo-hosting-strategy/README.md)

### Cross-layer feature specs (substantially changed from implementation)

- [002 — Identity Primitive](specs/002-identity-primitive/README.md) — adds Holochain agent-key bridging
- [004 — Content Anchoring (DHT)](specs/004-content-anchoring/README.md) — DHT replaces AT Proto AppView
- [005 — Issue Lifecycle](specs/005-issue-lifecycle/README.md) — home cell + cellHash
- [006 — Deliberation Cell](specs/006-deliberation-cell/README.md) — Holochain zomes replace AppView
- [007 — Voting Engine](specs/007-voting-engine/README.md) — free vote casting on Holochain, tally finalization on EVM
- [008 — Work Verification & Rewards](specs/008-work-verification-rewards/README.md) — DHT entries + bridge mint
- [014 — Conductor & Bridge Service](specs/014-conductor-and-bridge-service/README.md) — replaces AppView backend
- [015 — Frontend](specs/015-frontend/README.md) — talks to local/Holo conductor over WebSocket
- [016 — Impact Metrics](specs/016-impact-metrics/README.md) — DHT entries

### Ported from implementation/ (substrate-agnostic + minor hybrid notes)

Each of these has been duplicated into this project so it has its own status and lifecycle independent of the implementation/ counterpart. A short **Hybrid notes** block at the top of each flags substrate substitutions to verify before relying on details below.

- Cross-cutting: 009 Delegation, 017 Work Planning, 028 Tag Registry, 029 Decision Continuity, 031 Core Metrics Framework
- UI sub-specs: 018–027 (note: 026 is renamed in spec text to *Cell Configuration*)
- Design system: 032–039

The duplication is intentional — the user should be able to evolve either project independently without losing track of completed work in the other.

## How to read this set

1. Read the [exploration document](../implementation/holochain-architecture-exploration.md) for context (~1h).
2. Read [000 ADR](specs/000-substrate-architecture-decision-record/README.md) for the governing decision and split rationale.
3. Read [040 Bridge](specs/040-bridge-specification/README.md), [041 Base DNA](specs/041-base-dna-specification/README.md), [030 Cell Architecture](specs/030-cell-architecture-and-registry/README.md) — these are the load-bearing new pieces.
4. Walk the changed cross-layer specs (002, 004–008, 014–016) to see how the core loop maps onto the hybrid.
5. Treat the EVM ports (001, 003, 010–013) as confirming the settlement plane is unchanged.

## Open decisions

The 17 open decisions listed in [§8 of the exploration document](../implementation/holochain-architecture-exploration.md) are not pre-resolved here. Each spec flags the decisions that affect it under **Open questions**. The spec set assumes the current PRD answer to the **closed-loop vs. fiat-bridged** question (fiat-bridged); flipping that answer would simplify the architecture dramatically and obsolete much of this set.

## Reference architectures

- [Neighbourhoods](https://neighbourhoods.network/) — recursive We pattern, applet governance, sensemaker (closest existing analog).
- [Acorn](https://acorn.software/) — multi-cell project organization in production.
- [HoloFuel](https://holo.host/holofuel/) — System Agent + countersigned redemption, mutual credit at scale.
- [Holochain `hdk`](https://github.com/holochain/holochain) — current state of zomes-as-libraries tooling.
- [Hypercerts v2](https://hypercerts.org/) — recognized impact credentials.
- [Safe](https://safe.global/) — bridge multi-sig pattern.

## Caveats

This is exploratory spec work. No code has been written. Performance, ecosystem maturity, and bridge-security claims rest on documented Holochain patterns and existing hApp deployments rather than on Kindact-specific testing. See [§12 of the exploration document](../implementation/holochain-architecture-exploration.md) for the honest caveats.
