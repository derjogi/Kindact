---
status: planned
created: '2026-05-12'
tags: [holochain, validation, trust, security]
priority: high
derivation: new
depends_on:
  - 030-cell-architecture-and-registry
  - 041-base-dna-specification
  - 043-jurisdictional-claims
---

# 044 — Cross-Cell Validation & Trust

> **Status**: Exploratory · **Derivation**: new · **Counterpart in implementation/**: implicit in [014-off-chain-backend](../../../implementation/specs/014-off-chain-backend/README.md) AppView (single trusted indexer).

## Overview

Each cell has its own validators (members in the cell's DHT). The bridge ([040](../040-bridge-specification/README.md)) and other cells need a way to trust quorum signatures from a foreign cell without re-validating every entry in that cell. This spec defines:

1. How a cell's Base-DNA conformance is verified.
2. How quorum signatures are scoped and verified across cells.
3. How a non-member contributes to a foreign cell (guest contributor model).
4. How cross-cell challenges work for invalid bindings, missed jurisdictional claims, or fraudulent quorum.

## Design

### Base-DNA conformance check

Every cell registers its DNA hash with the Global Registry. Validators of any other cell, the bridge, and external clients can verify a cell is Kindact-conformant by:

1. Looking up `cellId` in the Global Registry.
2. Reading the registered `dnaHash` and `baseDnaVersion`.
3. Comparing against the canonical Base DNA hashes published by the EVM `BaseDNARegistry` facet ([001](../001-diamond-module-registry/README.md), [041](../041-base-dna-specification/README.md)).

A cell whose DNA hash does not include a current canonical Base is flagged `non-conformant`. Non-conformant cells:
- Cannot anchor entries to the Global Registry.
- Cannot bridge work claims for $CC mint.
- Cannot have their issues anchored to global anchors.
- Are visible only to direct opt-in members.

### Quorum signature scope

When a cell submits an event for bridging (e.g., verified work), it provides:

```json
{
  "cellId": "kindact:berlin",
  "dnaHash": "uhCkk...",
  "entryHash": "uhCAk...",
  "quorumSignatures": [
    {"agent": "uhCAk...", "signature": "..."},
    ...
  ],
  "validatorRoster": {
    "snapshotAt": 1715000000,
    "rosterHash": "uhCkk...",
    "rosterSignedBy": ["genesisDids", "..."]
  }
}
```

Verification:
1. `dnaHash` matches the Global Registry entry for `cellId`.
2. Each signing `agent` was a member of the cell at `snapshotAt`, per the cell's own membership history.
3. The `rosterHash` matches the cell's authoritative membership snapshot.
4. Quorum threshold N-of-M is met for the entry's category (configurable per category).
5. `entryHash` is reachable from at least one current cell member's source chain head.

The bridge (and any third party) can perform this check without joining the cell.

### Quorum thresholds

Default thresholds, configurable per cell within meta-governance bounds:

| Entry category | Default threshold |
|---|---|
| Comment / argument | None (single agent signature suffices) |
| Vote | None (per-agent vote) |
| Work claim verification | M-of-N where N = active cell members and M ≥ 5 (or the cell's all members if fewer than 5) |
| Hypercert anchor | M-of-N as above |
| Dispute confirmation | M-of-N where N = active cell members and M ≥ ceil(0.6 * N) |
| Cell governance change | Per cell's decision engine (default: approval voting majority) |

The bridge enforces a floor: bridged operations require at least 5 distinct quorum signatures regardless of cell size. Cells with fewer than 5 members cannot bridge until they grow.

### Guest contributor model

A non-member of cell C may contribute to one issue in C without becoming a full member.

| Property | Member | Guest contributor |
|---|---|---|
| Author entries on a specific issue | ✓ | ✓ (only on the joined issue; revoked when issue resolves) |
| Read full cell data | ✓ | Limited to the issue and its dependencies |
| Validation duties | Eligible | None |
| Cell governance vote | ✓ | None |
| Issue voting | ✓ (subject to issue's eligibility modifiers) | Subject to issue's eligibility modifiers; cell-residency modifiers exclude them |
| Counted in quorum membership | ✓ | No |

Guest contributor entries persist after the issue resolves (source chains are immutable) but the guest's authoring rights expire. Guest contributors are flagged in the UI so members can apply appropriate scope-relevance filters.

### Cross-cell challenges

A peer in cell A may challenge an entry in cell B if:

| Challenge type | Trigger |
|---|---|
| `binding-invalid` | Issue's protocol binding omits an applicable jurisdictional claim ([043](../043-jurisdictional-claims/README.md)) or has an incorrect binding hash. |
| `quorum-fraudulent` | Quorum signatures include an agent who was not a cell member at `snapshotAt`, or roster snapshot does not match cell history. |
| `non-conformant-cell` | Bridged operation came from a cell whose DNA hash does not include a current canonical Base. |
| `scope-evasion` | Issue's scope vector misrepresents physical or topical scope (escalates to dispute resolution per [012](../012-dispute-resolution/README.md)). |

Challenges enter the dispute pipeline. If upheld, downstream actions (mint, anchor, clawback) are reversed via reconciliation. The challenger receives a $CC reward funded by the slashed cell's treasury or by the platform reserve if the cell has none.

### What this prevents

- A rogue cell forking Base DNA to remove humanity-verification cannot have its mints accepted by the bridge.
- A cell silently inflating its membership to fake quorum is detectable by anyone who walks the cell's membership history.
- Two cells cannot independently bridge the same Holochain entry as a different `operationId` (canonical hashing prevents this).
- A cell's home jurisdiction cannot be ignored by a hostile creator because anyone watching the relevant jurisdictional claim can flag.

## Plan

1. [ ] Implement `validatorRoster` snapshot entries in Base DNA.
2. [ ] Implement bridge-side quorum signature verification using Registry-resolved roster.
3. [ ] Implement guest contributor mode in cell membership zome.
4. [ ] Implement challenge entry types and dispute pipeline integration.
5. [ ] Implement cross-cell observer pattern (a cell can subscribe to specific bridged operations from foreign cells for monitoring).
6. [ ] Document the floor of 5 quorum signatures and the policy for sub-threshold cells.

## Test

- [ ] Cell with tampered Base DNA: bridge submission rejected.
- [ ] Cell with valid Base but quorum signature from a non-member at snapshot time: rejected.
- [ ] Guest contributor: can author on the joined issue; rejected on other issues; not counted in quorum.
- [ ] Cross-cell challenge: peer in cell A flags a `binding-invalid` in cell B; dispute pipeline upholds; binding reset; mint reversed.
- [ ] Sub-5-member cell cannot bridge any operation regardless of internal threshold.

## Open questions

- **§8.3.9 Guest contributor model** — exact rights, revocation timing, indicator UX.
- **Quorum threshold floor** — is 5 the right floor, or scale with platform population?
- **Challenger reward economics** — funded by slashed cell or platform reserve? Anti-griefing for false challenges?
- **Roster snapshot frequency** — every entry includes a roster reference, or daily/weekly snapshots used by reference?
- **Privacy of validator identity** — full DID disclosure, or pseudonymous-but-stable roster identifiers?

## Notes

The "trust the cell because its DNA matches a canonical hash and its roster proves quorum" pattern is the multi-cell substitute for "trust the AppView because everyone uses the same one." The trust shift is from operator-of-AppView to maintainer-of-Base-DNA + verifier-of-canonical-hash. The bridge's `BaseDNARegistry` facet is the authority anchor that makes this work.
