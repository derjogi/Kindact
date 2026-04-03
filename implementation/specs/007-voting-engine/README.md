---
status: planned
created: '2026-04-03'
tags: [decision-making, core-loop, smart-contracts]
priority: high
depends_on:
  - 002-identity-primitive
  - 005-issue-lifecycle
---

# 007 — Voting Engine

On-chain approval voting with eligibility gates and observation periods. Implements the decision step of the core loop.

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

Before voting, user must pass an off-chain eligibility check:

1. **Quiz** — demonstrates understanding of the issue
2. **Stakeholder relevance** — confirms connection to the issue's scope

Contract stores a signed attestation (EIP-712) from the off-chain eligibility service. Attestation verified on-chain before vote is recorded.

### On-chain Fields per Vote

| Field | Type | Description |
|-------|------|-------------|
| issueId | uint256 | Reference to issue (005) |
| voterWallet | address | Voter identity |
| choice | enum | Approve / Reject / Abstain |
| timestamp | uint48 | When cast or last changed |
| eligibilityAttestation | bytes | Signed attestation from off-chain service |

### Tally

Maintained incrementally on-chain: `approveCount`, `rejectCount`, `abstainCount`. Updated on every vote cast or changed.

### Decision Criteria

1. **Quorum** — configurable minimum voter count
2. **Adoption threshold** — configurable approval percentage (e.g., >50% of non-abstain votes)
3. **Observation period** — after threshold met, configurable window (e.g., 7 days) before finalization. Allows late objections to shift the tally.

When all three criteria are satisfied, triggers issue state transition to `Adopted` via 005.

### Events

- `VoteCast(uint256 issueId, address voter, Choice choice)`
- `VoteChanged(uint256 issueId, address voter, Choice from, Choice to)`
- `ObservationStarted(uint256 issueId, uint256 endsAt)`
- `DecisionReached(uint256 issueId, bool adopted)`

### Extension Points

- Pluggable voting modes via new facets (future: quadratic, ranked choice)
- Delegation hooks (009)
- Conviction voting hooks (009)

## Plan

1. Implement `VotingEngineFacet` with storage and vote recording
2. Implement eligibility attestation verification (EIP-712)
3. Implement incremental tally logic
4. Implement observation period tracking
5. Implement state transition trigger → `IssueRegistryFacet`
6. Integrate with `IdentityPrimitive` for one-person-one-vote
7. Tests

## Test

- Unit: vote casting, changing, and tally updates
- Unit: eligibility attestation verification (valid + invalid signatures)
- Unit: quorum and threshold calculations
- Unit: observation period logic (start, expire, reset on tally shift)
- Integration: state transition to Adopted in IssueRegistryFacet
- Integration: identity check via 002

## Notes

- Fluid voting means the tally is always live; observation period prevents premature finalization
- Abstain votes count toward quorum but not toward approval threshold
- Attestation expiry should be configurable (prevents stale eligibility)
- Voter count feeds into reward cap calculation in 008
