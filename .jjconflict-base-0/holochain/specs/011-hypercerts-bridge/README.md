---
status: planned
created: '2026-05-12'
tags: [impact, hypercerts, smart-contracts, evm]
priority: high
derivation: ported
ports_from: 011-hypercerts-bridge
depends_on:
  - 008-work-verification-rewards
  - 010-reserve-exchange
related:
  - 040-bridge-specification
---

# 011 — Hypercerts Bridge (EVM)

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [011-hypercerts-bridge](../../../implementation/specs/011-hypercerts-bridge/README.md)

## Overview

Mints recognized impact credentials (Hypercerts) and routes proceeds into the $CC reserve. **Unchanged** from implementation/ in the EVM mechanics — Hypercerts remain canonical-recognized-credentials on EVM/AT-Proto. The hybrid changes only the trigger source and the on-chain anchor field set.

Read the [implementation/ counterpart](../../../implementation/specs/011-hypercerts-bridge/README.md) for the auto-create flow, on-chain data model, fractionalization, retirement, and reserve routing.

## Hybrid-architecture deltas

### Trigger source

Implementation/: trigger is a verified work record from the AppView's indexer.

Hybrid: trigger is a verified work entry on Holochain ([008](../008-work-verification-rewards/README.md)) bridged to EVM via [040](../040-bridge-specification/README.md). The bridge calls `anchorHypercertFromCell(workCID, cellId, recipient, scope, evidence, operationId)`.

### Anchor field set

Each on-chain Hypercert anchor records the Holochain provenance:

| Field | Source |
|---|---|
| `cellId` | Home cell of the originating work claim |
| `cellDnaHash` | Verified Base-conformant at the time of bridging ([044](../044-cross-cell-validation-and-trust/README.md)) |
| `workCID` | Holochain entry hash of the verified work record |
| `quorumProofHash` | Hash of the quorum signature set used by the bridge |

These fields preserve the on-chain anchor's auditability without requiring a verifier to walk back into Holochain.

### AT Proto side

The Hypercerts protocol v2 ecosystem is AT-Proto-rooted. The bridge writes `org.hypercerts.*` records to an AT Proto PDS operated by the Kindact platform, and the EVM anchor references the AT-URI + CID as in implementation/. This means the hybrid still maintains an AT Proto presence — but only for Hypercerts (the recognized-credentials integration), not for general deliberation content.

This is a deliberate split: Holochain handles internal deliberation/work flows; AT Proto handles outward-facing credentials so they remain interoperable with RetroPGF, Gitcoin, and the Hypercerts marketplace.

## Plan

1. [ ] Inherit implementation/ Plan items.
2. [ ] Replace AppView-driven trigger with bridge-driven `anchorHypercertFromCell`.
3. [ ] Add Holochain-provenance fields to the on-chain anchor.
4. [ ] Operate (or contract) an AT Proto PDS for Hypercert publication.
5. [ ] Document the dual-substrate path in user-facing docs.

## Test

- [ ] Inherit implementation/ Test items.
- [ ] Bridge call with non-conformant cell DNA: reverts.
- [ ] Anchored Hypercert resolves on the Hypercerts marketplace and is purchasable.
- [ ] Dispute confirmed → Hypercert retired via clawback flow.

## Open questions

- **AT Proto PDS operation** — Kindact-operated, partner-operated, or per-user PDS? Affects sovereignty and operational load.
- **Migration path** — for any Hypercerts already minted on the current architecture, how to re-anchor with cell provenance metadata.
- **Whether to mint Hypercerts directly to a Holochain-controlled treasury cell** rather than the EVM treasury — would let cells fractionalize without bridging back. Considered but adds complexity; current default keeps treasury on EVM.

## Notes

This is the spec where the "Holochain coordination + EVM credentials" hybrid pays off most clearly. Internal cell deliberation can stay free and agent-signed; external impact recognition uses the recognized-registry path. The bridge is the (increasingly obvious) load-bearing layer making this work.
