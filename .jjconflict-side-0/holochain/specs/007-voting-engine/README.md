---
status: planned
created: '2026-05-12'
tags: [decision-making, core-loop, smart-contracts, holochain]
priority: high
derivation: changed
counterpart: 007-voting-engine
depends_on:
  - 002-identity-primitive
  - 005-issue-lifecycle
  - 030-cell-architecture-and-registry
  - 040-bridge-specification
  - 041-base-dna-specification
---

# 007 — Voting Engine

> **Status**: Exploratory · **Derivation**: changed · **Counterpart in implementation/**: [007-voting-engine](../../../implementation/specs/007-voting-engine/README.md) (vote casting moves to Holochain; tally finalization stays on EVM).

## Overview

Approval voting remains the default decision engine. Vote *casting* moves to Holochain (free, peer-validated, fluid). Vote *tally finalization* triggers a bridge event that records the canonical tally on EVM, where the issue's status transition is enforced. This split: free + fluid + private-by-default in the cell; canonical + public-finality on chain.

Read the [implementation/ counterpart](../../../implementation/specs/007-voting-engine/README.md) for the on-chain VotingEngineFacet, eligibility gate, vote choices, and decision continuity rules.

## Design

### Vote entry on Holochain

```json
{
  "type": "vote",
  "issueRef": {"cellId": "...", "issueHash": "..."},
  "choice": "approve",  // approve | reject | abstain
  "eligibilityProof": {
    "humanityScore": 65,
    "scoreSnapshotHash": "uhCAk...",
    "modifierAttestations": [
      {"modifier": "scope_relevance", "attestor": "cell:berlin", "signature": "..."},
      {"modifier": "quiz_pass", "attestor": "cell:berlin", "signature": "..."}
    ]
  },
  "castAt": 1715000000,
  "supersedes": "uhCAk..."  // previous vote entry, if changed
}
```

Vote entries are committed in the issue's home cell. They are signed by the voter's Holochain agent key (resolved via [002](../002-identity-primitive/README.md) to a humanity-verified EVM identity).

### Fluid voting

Holochain's source-chain model fits fluid voting naturally. Each new vote entry supersedes the previous one. The current tally is computed from the most recent valid entry per voter.

### Eligibility gate

The issue's protocol binding declares which eligibility modifiers apply (e.g., `scope_relevance`, `quiz_pass`). Off-chain attestation services (or cell-internal services) issue signed attestations that the voter includes in their vote entry. Cell validators check:
- `humanityScore` matches the latest snapshot for the voter.
- Required modifier attestations are present and validly signed.
- Voter is not excluded by jurisdictional-claim eligibility modifiers ([043](../043-jurisdictional-claims/README.md)).

### Tally finalization

When the issue's protocol binding triggers finalization (time-based, threshold-based, or explicit per the decision continuity rules):

1. The cell computes the canonical tally from current vote entries.
2. The cell's quorum (M-of-N validators) signs a `tally_finalization` entry recording counts and the entry-hash set used.
3. Bridge ([040](../040-bridge-specification/README.md)) submits `finalizeTally(issueId, approve, reject, abstain, voterCount, tallyProofHash, operationId)` to `VotingEngineFacet`.
4. EVM facet validates the quorum signatures, applies decision-continuity rules from implementation/ (e.g., supermajority requirements, persistence over time), and emits `IssueAdopted` or `IssueRejected`.
5. Subsequent issue lifecycle transitions ([005](../005-issue-lifecycle/README.md)) follow.

### Cross-cell vote prevention

Each voter casts at most one vote per issue. Enforcement:
- Cell validators check that the voter's agent key has not previously voted on this `issueRef`.
- If the voter changes vote, the new entry must `supersede` the prior entry (chain validation).
- If the voter has multiple agent keys linked to the same identity ([002](../002-identity-primitive/README.md)), the rule is per-identity (resolved via Registry mirror at validation), not per-agent.

### Decision engines beyond approval

Cells can install alternative decision engine zomes (consensus, ranked-choice, score, quadratic) per their protocol binding. The Base DNA requires that approval voting remain available as a fallback ([041](../041-base-dna-specification/README.md)).

For non-approval engines, the on-chain tally is computed and bridged similarly: cell tallies first, then bridge submits canonical result. The on-chain `VotingEngineFacet` accepts pre-computed results from approved decision engines.

## Plan

1. [ ] Implement `kindact_voting` zome with vote, supersede, and tally entries.
2. [ ] Implement eligibility-attestation entry types.
3. [ ] Implement bridge tally-finalization path.
4. [ ] Add `finalizeTally` to `VotingEngineFacet` (EVM) restricted to `BRIDGE_OPERATOR`.
5. [ ] Implement decision-continuity rules from implementation/ on the EVM side (unchanged).
6. [ ] Implement multi-agent-key-per-identity vote uniqueness.

## Test

- [ ] Vote casting in cell is free; entry appears for cell members within gossip SLA.
- [ ] Fluid voting: voter changes vote N times; only most-recent entry counted.
- [ ] Eligibility: voter without `scope_relevance` attestation rejected by cell validators.
- [ ] Tally finalization: quorum signs; bridge submits; EVM records canonical tally; issue transitions.
- [ ] Multi-agent-key voter: votes from two agents linked to same identity counted as one.
- [ ] Cross-cell challenge: tally finalization with falsified quorum flagged via [044](../044-cross-cell-validation-and-trust/README.md).

## Open questions

- **Vote secrecy** — votes are signed entries, visible to cell members. Public visibility is the default. Anonymous voting (e.g., zero-knowledge proofs of eligibility + randomized vote) is desirable for some decisions; out of scope for v1?
- **Cross-cell vote eligibility** — for a global meta-governance vote, which cells' voters count? Constitutional vote requires platform-wide aggregation.
- **Decision engine plugin model** — how is a non-approval engine vetted before being installed in a cell? See [041](../041-base-dna-specification/README.md) module-manifest validation.
- **Tally finalization timing** — pure time-based, threshold-based, or hybrid? Decision continuity rules govern this; same trade-offs as implementation/.
- **Vote display while open** — show running tally to cell members? May influence later voters; implementation/ has the same question.

## Notes

This spec is a clean illustration of the hybrid pattern: cheap and fluid where it can be (cell), canonical and final where it must be (EVM). The user-facing impact is positive: voting becomes free and feels real-time, while the canonical decision retains the auditability of an on-chain record.
