---
status: planned
created: '2026-05-12'
tags: [issues, core-loop, smart-contracts, holochain]
priority: high
derivation: changed
counterpart: 005-issue-lifecycle
depends_on:
  - 001-diamond-module-registry
  - 004-content-anchoring
  - 030-cell-architecture-and-registry
  - 041-base-dna-specification
  - 043-jurisdictional-claims
---

# 005 — Issue Lifecycle

> **Status**: Exploratory · **Derivation**: changed · **Counterpart in implementation/**: [005-issue-lifecycle](../../../implementation/specs/005-issue-lifecycle/README.md)

## Overview

On-chain issue state machine **shifts to a Holochain home cell** with on-chain anchoring at status transitions. The state machine itself, scope vector, protocol binding hash, and metrics bundle hash are all preserved from implementation/. The home cell becomes the new authority for cell-internal lifecycle progression; the on-chain record records `cellId` and `cellHash` alongside the existing fields.

Read the [implementation/ counterpart](../../../implementation/specs/005-issue-lifecycle/README.md) for state-transition details, validation rules, amend/reverse semantics, and protocol binding resolution.

## What changes

### Issue resides in a home cell

An issue is created in a single home cell. The cell is chosen by the creator. The issue's content (description, deliberation, votes, work claims) lives in the cell's DHT. The on-chain record is a lightweight anchor.

```diagram
Cell (home)                                   EVM (anchor)
─────────────                                 ─────────────
Issue entry            ────────────────────▶  IssueRecord
  description                                   id
  scope vector                                  status
  protocol binding                              creatorWallet
  rewardAmount (proposed)                       cellId
  ...                                           cellHash (DNA hash)
                                                scopeVectorHash
                                                rewardAmount (locked)
                                                contentHash
                                                protocolBindingHash
                                                metricsBundleHash
                                                decisionSnapshotHash
                                                implementationSnapshotHash
                                                disputeSnapshotHash
                                                createdAt
                                                updatedAt
```

### On-chain fields

```solidity
struct Issue {
    uint256 id;
    Status  status;
    address creatorWallet;
    bytes32 cellId;                  // home cell hash from Global Registry
    bytes32 cellDnaHash;             // proves cell was Base-conformant at creation
    bytes32 scopeVectorHash;
    uint256 rewardAmount;
    bytes32 contentHash;
    bytes32 protocolBindingHash;
    bytes32 metricsBundleHash;
    bytes32 decisionSnapshotHash;
    bytes32 implementationSnapshotHash;
    bytes32 disputeSnapshotHash;
    uint48  createdAt;
    uint48  updatedAt;
}
```

`protocolBindingHash` includes the cell's overlay set plus any applicable jurisdictional claims ([043](../043-jurisdictional-claims/README.md)) at canonical hashing time, so two cells indexing the same chain compute the same binding hash.

### State transitions

States preserved: `Draft → Deliberating → VoteReady → Adopted → Implementing → Completed → Archived` plus amend/reverse.

Transition mechanics:

| Transition | Triggered by | Anchored on EVM? |
|---|---|---|
| `Draft → Deliberating` | Cell members agree to publish | Optional |
| `Deliberating → VoteReady` | Net-impact gate satisfied + binding finalized | **Yes** |
| `VoteReady → Adopted` | Vote tally finalized ([007](../007-voting-engine/README.md)) | **Yes** |
| `Adopted → Implementing` | Work package(s) approved | **Yes** |
| `Implementing → Completed` | Work verified ([008](../008-work-verification-rewards/README.md)) | **Yes** |
| `Completed → Archived` | Time-based or explicit | Optional |
| `Adopted → Amended` | Amendment vote passes | **Yes** |
| `Adopted → Reversed` | Reversal vote passes | **Yes** |

Each anchored transition: bridge submits via [040](../040-bridge-specification/README.md); on-chain `setStatus` validates the transition and the snapshot reference.

### Cross-cell challenge

If a peer notices a status transition that violates the issue's protocol binding (e.g., transitioned to `VoteReady` without a positive net-impact verdict), they can flag `binding-invalid` per [044](../044-cross-cell-validation-and-trust/README.md). Dispute pipeline ([012](../012-dispute-resolution/README.md)) adjudicates; if upheld, transition reverted.

### Protocol binding hash

Same canonical hashing as implementation/, with two changes:

1. The hash includes `appliedJurisdictionalClaims: [claimId, ...]` from [043](../043-jurisdictional-claims/README.md).
2. The hash is computed by the home cell's validators at issue creation and re-verified at each anchored transition. Divergence is grounds for `binding-invalid`.

### Reward locking

`rewardAmount` is locked at issue creation (escrowed from the creator's $CC balance per implementation/). The lock is on the EVM canonical $CC, not on local mutual-credit balances. This means an issue's reward is bridged out of the creator's effective balance even if the creator holds local-credit-only $CC; the bridge handles the conversion at lock time.

## Plan

1. [ ] Implement `kindact_base_lifecycle` zome with `Issue` entry type and state-transition validation.
2. [ ] Add `cellId`, `cellDnaHash` to `IssueRecord` on EVM.
3. [ ] Implement bridge-driven anchored transitions.
4. [ ] Implement protocol binding hashing including jurisdictional claims.
5. [ ] Implement cross-cell `binding-invalid` flag flow.
6. [ ] Implement local-credit / canonical $CC reconciliation on reward lock.

## Test

- [ ] Issue created in cell C; on-chain record has `cellId` matching Registry; `cellDnaHash` verified Base-conformant.
- [ ] Net-impact gate enforced: `Deliberating → VoteReady` rejected if metrics bundle's verdict is not positive.
- [ ] Protocol binding hash: two cells indexing the same issue compute identical hash; divergence flagged.
- [ ] Jurisdictional claim enforcement: outsider creates housing issue in Berlin scope; Berlin claim applies; binding hash includes claim.
- [ ] Cross-cell challenge: missing claim → `binding-invalid` → dispute upheld → state rolled back.

## Open questions

- **Cross-cell issue migration** — can an issue's home cell change after creation (e.g., escalation from project cell to canonical cell)?
- **Issue cloning across cells** — explicitly disallowed (single home cell), but is referencing/threading allowed?
- **Reward lock bridging UX** — when reward locks and the user holds local-credit, is the bridge step transparent or visible?
- **Archival semantics** — archived entries remain readable; what about indexing for historical queries?

## Notes

The user's stated preference is single home cell per issue. This spec implements that preference. The cross-jurisdictional case is handled via jurisdictional claims, not via the issue belonging to multiple cells. This is the simpler design and probably correct, but worth confirming after prototyping (per [§8.2.4](../../../implementation/holochain-architecture-exploration.md)).
