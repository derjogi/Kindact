---
status: planned
created: 2026-04-03
priority: high
tags:
- decision-making
- core-loop
- smart-contracts
depends_on:
- 002-identity-primitive
- 005-issue-lifecycle
- '016'
- '017'
created_at: 2026-04-05T10:28:37.006531858Z
updated_at: 2026-04-05T10:28:37.006531858Z
---

# 007 — Voting Engine

On-chain approval voting as Kindact's default decision engine. This spec owns the core tally and vote recording path, while participation modifiers and decision continuity rules are resolved via the issue's procedural snapshot.

## Design

### VotingEngineFacet

On-chain approval voting within the Diamond. Fluid/ongoing — votes can be changed at any time, no fixed close date.

### Vote Types

| Choice | Weight | Description |
|--------|--------|-------------|
| Approve | 1 | Support the issue |
| Reject | 1 | Oppose the issue |
| Abstain | 1 | Counted for quorum, not for threshold |

One-person-one-vote enforced via `IdentityPrimitive` (002). No token-weighted voting.

### Eligibility Gate

Before voting, user must satisfy the issue's active participation modifiers, which may include an off-chain eligibility check:

1. **Quiz** — demonstrates understanding of the issue
2. **Stakeholder relevance** — confirms connection to the issue's scope

Contract stores signed attestations (EIP-712) from the relevant off-chain eligibility services. Attestations are verified on-chain before the vote is recorded and must match the issue's snapshotted decision rules.

### On-chain Fields per Vote

| Field | Type | Description |
|-------|------|-------------|
| issueId | uint256 | Reference to issue (005) |
| voterWallet | address | Voter identity |
| choice | enum | Approve / Reject / Abstain |
| timestamp | uint48 | When cast or last changed |

### Tally

Maintained incrementally on-chain: `approveCount`, `rejectCount`, `abstainCount`. Updated on every vote cast or changed.

### Decision Criteria

1. **Quorum** — configurable minimum voter count
2. **Adoption threshold** — configurable approval percentage (e.g., >50% of non-abstain votes)
3. **Continuity policy** — the issue's snapshotted continuity rule determines how a live tally stabilizes, reopens, or becomes harder to reverse over time

When all three criteria are satisfied, triggers issue state transition to `Adopted` via 005.

### Events

- `VoteCast(uint256 issueId, address voter, Choice choice)`
- `VoteChanged(uint256 issueId, address voter, Choice from, Choice to)`
- `DecisionContinuityCheckpoint(uint256 issueId, bytes32 policyRef)`
- `DecisionReached(uint256 issueId, bool adopted)`

### Extension Points

- Pluggable voting modes via new facets (future: quadratic, ranked choice)
- Delegation hooks (009)
- Decision continuity hooks such as conviction accumulation or reconsideration windows (009)
- Metrics gate integration with 017-core-metrics-framework before decision opening

## Plan

1. Implement `VotingEngineFacet` with storage and vote recording
2. Implement eligibility attestation verification (EIP-712)
3. Implement incremental tally logic
4. Implement integration point for issue-snapshotted continuity policies
5. Implement state transition trigger → `IssueRegistryFacet`
6. Integrate with `IdentityPrimitive` for one-person-one-vote
7. Tests

## Test

- Unit: vote casting, changing, and tally updates
- Unit: eligibility attestation verification (valid + invalid signatures)
- Unit: quorum and threshold calculations
- Unit: continuity policy integration uses the issue snapshot rather than ambient platform defaults
- Integration: state transition to Adopted in IssueRegistryFacet
- Integration: identity check via 002

## Notes

- Fluid voting means the tally is always live; the issue snapshot determines how that live tally stabilizes or reopens.
- Abstain votes count toward quorum but not toward approval threshold
- Attestation expiry should be configurable (prevents stale eligibility)
- Voter count feeds into reward cap calculation in 008
- This spec should stay narrow: approval tallying belongs here, while delegation and continuity belong in 009.
