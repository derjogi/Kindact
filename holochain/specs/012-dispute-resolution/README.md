---
status: planned
created: '2026-05-12'
tags: [verification, security, smart-contracts, evm]
priority: high
derivation: ported
ports_from: 012-dispute-resolution
depends_on:
  - 003-cc-token-core
  - 008-work-verification-rewards
related:
  - 040-bridge-specification
  - 044-cross-cell-validation-and-trust
---

# 012 — Dispute Resolution (EVM)

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [012-dispute-resolution](../../../implementation/specs/012-dispute-resolution/README.md)

## Overview

On-chain dispute flow with deposit-based skin-in-the-game, community adjudication, slashing, and clawback via the Debt Ledger. **Unchanged** from implementation/ in the EVM dispute mechanics. The hybrid extends entry points to accept Holochain-originated challenges and adds cross-cell challenge categories from [044](../044-cross-cell-validation-and-trust/README.md).

Read the [implementation/ counterpart](../../../implementation/specs/012-dispute-resolution/README.md) for the dispute lifecycle, deposit economics, resolution thresholds, and clawback.

## Hybrid-architecture deltas

### Challenge entry points

Two challenge sources:

| Source | Path |
|---|---|
| **Direct EVM challenge** (preserved) | User calls `openDispute(claimId, evidenceCID)` on `DisputeResolutionFacet` with $CC deposit |
| **Holochain-originated challenge** | Cell member or cross-cell observer commits a `dispute_challenge` entry; bridge submits `openDisputeFromCell(claimId, cellId, challengeHash, evidenceCID, deposit, operationId)` after quorum |

Both paths converge on the same on-chain dispute record and the same resolution flow.

### New challenge categories

In addition to the implementation/ categories (work-fraud), the hybrid recognizes:

| Category | Source | Outcome |
|---|---|---|
| `binding-invalid` | Cross-cell observer notices missing jurisdictional claim ([043](../043-jurisdictional-claims/README.md)) | Issue's protocol binding reset; issue rolls back to `Draft`; mint reversed if applicable |
| `quorum-fraudulent` | Cross-cell observer notices non-member in quorum signatures ([044](../044-cross-cell-validation-and-trust/README.md)) | Bridged operation reversed; cell flagged for governance review |
| `non-conformant-cell` | Bridged operation came from cell with non-canonical DNA hash | Bridge submission rolled back; cell removed from canonical registry |
| `scope-evasion` | Issue's scope vector misrepresents physical scope | Binding reset; if egregious, creator faces clawback per work-fraud category |

### Adjudication body

Implementation/: 2% of original voters (min 5) with 80% agreement.

Hybrid: same threshold logic, but voter count is sourced from the cell's roster snapshot at the time of the disputed event ([044](../044-cross-cell-validation-and-trust/README.md)). For cross-cell challenges (`binding-invalid`, `non-conformant-cell`), the adjudication body is drawn from the Global Registry's meta-governance roster rather than a single cell.

### Clawback execution

Unchanged on EVM side. Bridge calls `executeClawback(target, amount, debtRef, operationId)` after dispute confirmation. Holochain side reflects the clawback via a notification entry in the user's source chain.

## Plan

1. [ ] Inherit implementation/ Plan items.
2. [ ] Implement `openDisputeFromCell` bridge-side entry point.
3. [ ] Implement new challenge categories (`binding-invalid`, `quorum-fraudulent`, `non-conformant-cell`, `scope-evasion`).
4. [ ] Define cross-cell adjudication roster sourcing.
5. [ ] Document the cross-cell challenger reward economics.

## Test

- [ ] Inherit implementation/ Test items.
- [ ] Cross-cell challenge: peer in cell A flags `binding-invalid` in cell B; dispute opens; adjudication confirms; binding reset.
- [ ] `quorum-fraudulent`: bridge submission with falsified quorum is detected; clawback executed.
- [ ] Bad-faith challenger: deposit burned per implementation/ rules.

## Open questions

- **§8.4.11 Jurisdictional claims model** influences the `binding-invalid` category specifics.
- **Cross-cell challenger reward** — funded by slashed cell's treasury, platform reserve, or both?
- **Anti-griefing for cross-cell challenges** — higher deposit for cross-cell challenges to prevent harassment of foreign cells.
- **Statute of limitations** — how far back can a `binding-invalid` challenge reach into completed issues?

## Notes

The cross-cell challenge mechanism is what gives the multi-cell architecture its accountability story. Without it, an oblivious or hostile home cell could shield invalid bindings from external scrutiny. The dispute pipeline becomes the universal accountability backstop for both intra-cell and cross-cell concerns.
