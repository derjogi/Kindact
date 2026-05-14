---
status: planned
created: '2026-05-12'
tags: [implementation, core-loop, smart-contracts, holochain, token-economy]
priority: high
derivation: changed
counterpart: 008-work-verification-rewards
depends_on:
  - 003-cc-token-core
  - 005-issue-lifecycle
  - 007-voting-engine
  - 030-cell-architecture-and-registry
  - 040-bridge-specification
---

# 008 — Work Verification & Rewards

> **Status**: Exploratory · **Derivation**: changed · **Counterpart in implementation/**: [008-work-verification-rewards](../../../implementation/specs/008-work-verification-rewards/README.md) (verification moves to Holochain peer validation; mint moves through bridge).

## Overview

Work claim → submit → peer-verify → bridge mint. Implementation claims and reports live as DHT entries in the issue's home cell. Verification is by cell-internal validators per the cell's verification policy. Once verified by quorum, the bridge mints $CC and anchors a Hypercert on EVM ([040](../040-bridge-specification/README.md), [011](../011-hypercerts-bridge/README.md)).

Read the [implementation/ counterpart](../../../implementation/specs/008-work-verification-rewards/README.md) for the work package model, claim/report fields, verification policies, and reward economics.

## What changes

### Entries on Holochain

| Implementation/ object | Holochain entry type |
|---|---|
| WorkPackage | `WorkPackage` (managed by `kindact_work_planning` zome — see [017 in implementation/](../../../implementation/specs/017-work-planning/README.md)) |
| Claim | `WorkClaim` |
| ImplementationReport | `WorkReport` (signed by implementer's agent key) |
| Verification | `WorkVerification` (signed by verifier's agent key; aggregates into quorum) |

### Claim flow

1. Implementer joins the issue's home cell (or as guest contributor per [044](../044-cross-cell-validation-and-trust/README.md)).
2. Implementer commits a `WorkClaim` entry referencing a `WorkPackage` milestone.
3. Implementer commits `WorkReport` entries describing what was done; evidence attached as referenced entries (or IPFS CIDs for large blobs).
4. Cell validators (or designated verifiers per the cell's policy) commit `WorkVerification` entries.
5. When verifications reach quorum (M-of-N per the cell's verification policy), the cell signs a `verified_work` aggregate entry.
6. Bridge ([040](../040-bridge-specification/README.md)) detects the aggregate, verifies quorum signatures + cell DNA conformance, submits `mintFromVerifiedWork(workCID, recipient, amount, operationId)` to EVM.
7. EVM mints $CC to implementer; emits `WorkRewarded` event.
8. Hypercert anchored per [011](../011-hypercerts-bridge/README.md).

### Verification policies

The cell's protocol binding declares verification policy. Examples:

| Policy | Description |
|---|---|
| `peer_attest` | Any 5 cell members verify; default |
| `quorum_majority` | Majority of active cell members verify |
| `expert_attest` | Designated expert role(s) verify; expert role registered in cell governance |
| `external_oracle` | External oracle (e.g., Chainlink Functions) attests; bridge consumes attestation |
| `community_proof` | Stakeholder community (e.g., Berlin neighbors for housing) attests via cell-specific proof type |

Verification policies are first-class modules ([001](../001-diamond-module-registry/README.md), [030](../030-cell-architecture-and-registry/README.md)) and must be registered before use.

### Local mutual-credit option

For very small cells (e.g., per-issue working groups), the implementer may opt to receive payment as local mutual-credit rather than canonical $CC. Local credit:
- Costs no bridge operation; appears immediately in the cell's local ledger.
- Can be spent intra-cell with other members.
- Can be reconciled outward to canonical $CC later.

This option exists to avoid bridge load for casual / low-value work. Default is canonical $CC for any work above a configurable threshold.

### Cross-cell challenge

`quorum-fraudulent` and `binding-invalid` challenges from [044](../044-cross-cell-validation-and-trust/README.md) and [012](../012-dispute-resolution/README.md) apply. If upheld, bridge reverses mint via clawback path.

### Failure handling

Bridge submission can fail (EVM congestion, reorg, etc.). The `verified_work` entry is in `pending` state until receipt is anchored back to the cell. If reconciliation determines the EVM tx never landed, the cell can re-attempt; if it landed and the entry never received the receipt, reconciliation populates the receipt retrospectively.

The implementer's UI shows the work as `verified, payment processing` during this window. Latency target: 30 minutes from quorum to receipt.

## Plan

1. [ ] Implement `kindact_work` zome with claim, report, verification, and aggregate entry types.
2. [ ] Implement verification-policy module registration and binding.
3. [ ] Implement quorum aggregate signing path.
4. [ ] Implement bridge `mintFromVerifiedWork` flow (EVM-side restricted to `BRIDGE_OPERATOR`).
5. [ ] Implement local-mutual-credit payment option.
6. [ ] Implement reconciliation worker for orphaned verified-work entries.

## Test

- [ ] End-to-end: claim → report → 5 verifications → quorum → bridge → mint within latency target.
- [ ] Verification with non-conformant cell DNA: bridge rejects.
- [ ] Quorum signature from non-member at snapshot: bridge rejects; cross-cell challenge upheld; mint reversed.
- [ ] Local mutual-credit option: implementer receives credit instantly; reconciles outward later.
- [ ] EVM tx fails mid-flight: pending state; reconciliation either replays or rolls back.

## Open questions

- **Verification policy default per cell type** — promoted cells may have stricter defaults (e.g., `expert_attest`) than user-created cells.
- **Threshold for canonical-$CC vs. local-credit** — what work value triggers canonical mint by default?
- **Hypercert minting threshold** — every verified work or only above a value threshold? Implementation/ defaults govern; same here.
- **Cross-cell verifier participation** — can a non-member verifier (with relevant expertise) verify in a cell as a guest contributor?
- **Verification disputes** — separate dispute path or rolled into [012](../012-dispute-resolution/README.md)?

## Notes

The work-verification flow is where the hybrid's coordination-on-Holochain pattern is most visible. Free claim authoring, free verification attestations, peer-validated quorum, and only the final mint touches EVM. Compared to implementation/, the gas cost per work item drops from one EVM tx per claim to one EVM tx per verified work — an order of magnitude reduction at scale. The trade is bridge complexity, which is paid once at the protocol level.
