---
status: planned
created: '2026-05-12'
tags: [architecture, adr, foundational]
priority: critical
derivation: new
---

# 000 — Substrate Architecture Decision Record

> **Status**: Exploratory · **Derivation**: new · **Counterpart in implementation/**: none (single substrate ADR was implicit)

## Overview

This ADR records *why* the alternative spec set adopts a three-layer hybrid (EVM L2 settlement + System-Agent bridge + Holochain coordination) instead of either (a) the current EVM L2 + AT Protocol architecture or (b) a wholesale Holochain port. Every other spec in this directory is downstream of this decision.

## Context

Kindact's current architecture combines an EVM L2 settlement plane with AT Protocol for content/coordination (see [implementation/](../../../implementation/) and [implementation/THREAD-FINDINGS.md](../../../implementation/THREAD-FINDINGS.md)). A multi-turn architectural exploration ([implementation/holochain-architecture-exploration.md](../../../implementation/holochain-architecture-exploration.md)) re-examined whether Holochain could replace or augment the coordination layer.

The exploration concluded:

1. Several Holochain-incompatibility claims were wrong on examination — demurrage, conditional issuance, mutual credit, multi-flavor tokens all map cleanly to validation rules + System Agent patterns.
2. Other claims hold — fiat reserve custody, recognized Hypercert credentials, oracle networks, identity providers, dispute clawbacks, and confidence-curve-driven redemptions all need EVM atomic state and external ecosystem integration.
3. Lens model fits multi-cell DNA architecture meaningfully better than "filter overlays on shared substrate"; the current model's contradictions are partly substrate constraints.
4. The bridge between substrates becomes the load-bearing security boundary; cross-substrate atomicity is impossible.

## Decision

Adopt a **three-layer hybrid**:

| Layer | Substrate | Role |
|---|---|---|
| **Settlement** | EVM L2 (Optimism / Base) | $CC supply, reserve custody, Hypercerts, dispute clawbacks, identity registry, oracles, parameter registry |
| **Bridge** | System Agent multi-sig (5-of-7 default; Safe-style) | Verifies Holochain quorum signatures, submits EVM transactions, mirrors EVM state into DHT snapshots, holds capability tokens on the Holochain side |
| **Coordination** | Holochain (Base DNA + Global Registry DNA + cell DNAs) | Issues, deliberation, work claims, peer validation, lens/cell membership, free social actions, local mutual-credit accounting |

## Split rationale (what lives where, why)

### Stays on EVM

- **Reserve custody (USDC vault)** — global atomic state, publicly inspectable contract, integration with stablecoin ecosystem.
- **$CC canonical supply + global decay index** — the Holochain mutual-credit ledger is a *local view*; the EVM ERC-20 is the canonical settlement amount that interfaces with reserve, Hypercerts, and external markets.
- **Hypercerts** — recognized impact credentials require AT-Proto-anchored / EVM-native registries. A "DHT entry we call a hypercert" is not interoperable with RetroPGF, Gitcoin, or the Hypercerts Foundation marketplace.
- **Confidence curve & daily redemption caps** — require global aggregates at the moment of transaction; Holochain's eventual-consistency DHT cannot enforce these without countersigned queues that re-introduce centralization.
- **Dispute clawbacks (Debt Ledger)** — global finality requirement.
- **Identity provider integrations** — Gitcoin Passport, BrightID, PoH, Anon Aadhaar, World ID all attest to EVM addresses or DIDs anchored to one.
- **Oracle integrations** — Chainlink, Pyth, RedStone, OB-PoR are EVM-native.

### Moves to Holochain

- **Deliberation** (comments, arguments, AI summaries, proposal documents) — agent-signed by author, peer-validated by cell members, free at the action level.
- **Work claims & verification entries** — peer-validated within the home cell; verified records anchored to EVM via the bridge to trigger mint + Hypercert.
- **Lens / cell membership & subscription** — multi-cell architecture replaces filter-overlay-in-shared-substrate.
- **Local mutual-credit accounting** — per-cell sum-zero ledger for free intra-cell exchange, reconciled to EVM $CC at boundaries.
- **Free social actions** — comments, votes, deliberation entries cost nothing.

### Crosses the bridge

- Verified work → mint $CC + Hypercert
- Reserve deposit / redemption requested → EVM reserve actions
- Dispute confirmed → clawback
- Oracle data → committed to DHT snapshot for Holochain validators
- Meta-governance parameter change → on-chain registry update
- Cell promotion / Base-DNA-version updates → registered on-chain so the bridge's capability tokens know the canonical set

## Consequences

### Positive

- Holochain plays to strengths (agent-centric, peer-validated, free social) where they matter.
- EVM plays to strengths (global finality, mature ecosystem) where they matter.
- Lens model contradictions resolve into multi-cell with anchor-based discovery.
- Substrate independence on the social side: the EVM L2 can swap without rewriting the coordination layer.
- Distributed validation aligns better with Kindact's anti-centralization stance than the single-AppView model.

### Negative

- Bridge is a new load-bearing security surface. Cross-chain bridges are historically the most-attacked surface in crypto.
- ~1.5–2× engineering bandwidth vs. current architecture (EVM + Holochain + bridge service).
- Cross-substrate atomicity is impossible; spec set must accept and design for "pending" states.
- Holochain ecosystem maturity is smaller; some patterns relied on (Base DNA composition, cross-cell challenge) are documented but not battle-tested at scale.
- End-user runtime (local conductor vs. Holo-hosted) is itself an open product question.
- Migration path from any AT-Proto-tracked content already created is non-trivial.

## Assumptions

This ADR rests on these assumptions; if they break, revisit.

1. **The PRD's fiat-bridged answer holds.** If Kindact pivots to closed-loop, drop the reserve, drop the Hypercerts, drop the bridge, and use Holochain alone (different product, different spec set).
2. **Holochain `hdk` zomes-as-libraries tooling matures** sufficiently to support Base-DNA composition by build pipeline. Worst case: own a build-time tool.
3. **Multi-sig bridge with 5-of-7 rotation is acceptable trust** for the redemption path and Hypercert anchoring. If not, alternative designs (light-client bridge, MPC, ZK rollup of Holochain commitments) become candidates — all heavier.
4. **Holo hosting or comparable conductor-as-a-service is available** for the mobile UX path. Otherwise the local-conductor requirement constrains adoption to desktop / power-users.

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| Keep current EVM + AT Protocol unchanged | Lens model contradictions (entities vs. filters) and centralized AppView remain unresolved. |
| Wholesale Holochain (closed-loop currency) | Breaks recognized-credentials integration, fiat reserve, oracle dependence. Different product. |
| Holochain coordination + ZK rollup of Holochain state to EVM (no multi-sig bridge) | Significantly heavier; no off-the-shelf solution; pushes complexity into a different unknown. Worth re-evaluating in 2–3 years. |
| AT Proto coordination + Holochain only for free social actions | Doesn't solve the central AppView problem; doubles infrastructure for marginal gain. |

## Open questions

These gate downstream specs but are intentionally not pre-resolved here. Indexed against [§8 of the exploration doc](../../../implementation/holochain-architecture-exploration.md):

- **§8.1.1 Closed-loop vs. fiat-bridged** — gating product question.
- **§8.1.2 Substrate commitment threshold** — what prototype evidence justifies committing.
- **§8.2.3 Holochain vs. AT Protocol** for the coordination layer — the side-by-side comparison this spec set enables.
- **§8.5.15 Bandwidth for two stacks** — operational reality check.

## Plan

1. [ ] Confirm the closed-loop vs. fiat-bridged decision (§8.1.1) so this ADR's assumptions remain valid.
2. [ ] Prototype one realistic cross-cell scenario (Berlin housing or Manhattan Wind Turbine) end-to-end, conductor + UI + cells + bridge stub.
3. [ ] If prototype validates, freeze this ADR and accept the spec set; if it invalidates, document why and revise.

## Test

- [ ] Side-by-side review with [implementation/THREAD-FINDINGS.md](../../../implementation/THREAD-FINDINGS.md) to confirm no Kindact requirement is dropped silently.
- [ ] Each downstream spec links back to this ADR and identifies which split rationale governs it.

## Notes

This is an Architecture Decision Record in the [Michael Nygard format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions). The decision is *recorded* but not yet *committed*. The user has explicitly stated they want to simmer on the substrate question before committing.
