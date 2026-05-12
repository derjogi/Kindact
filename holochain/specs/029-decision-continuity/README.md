---
status: planned
created: '2026-04-09'
tags: [decision-making, governance, smart-contracts]
priority: medium
derivation: ported
ports_from: 029-decision-continuity
depends_on:
  - 007-voting-engine
  - 013-meta-governance
related:
  - 009-delegation
---

# 029 — Decision Continuity (Conviction Voting)

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [029-decision-continuity](../../../implementation/specs/029-decision-continuity/README.md)

## Hybrid notes

Decision continuity rules port directly. Enforcement runs on EVM `VotingEngineFacet` per [007](../007-voting-engine/README.md) at tally finalization; cell-side fluid voting respects the same rules.


## Overview

Once an issue is adopted, its decision accumulates **conviction** over time — the longer it remains uncontested, the harder it becomes to reverse. This creates stability without permanence: decisions can always be revisited, but casual or temporary opposition cannot undo established community will.

Conviction is separate from delegation: delegation determines *who casts represented votes*; conviction determines *how hard it is to undo an accepted decision*.

## Design

### ConvictionFacet

Deployed as a Diamond facet. Tracks post-adoption stability for each issue.

### Conviction Accumulation

After an issue reaches `Adopted` status (via 007, with delegation resolved per 009):

- Conviction starts at 0
- Conviction increases linearly over time while the issue remains uncontested
- Formula: `conviction = k * time_since_adoption` where `k` is a governance-adjustable parameter (via 013)

### Reversal Threshold

To reverse an adopted decision:

```
required_opposition > base_threshold + conviction
```

Where:
- `base_threshold` = the original adoption threshold percentage (e.g., 50%)
- `conviction` = `k * time_since_adoption`

The longer a decision stands, the higher the bar for reversal.

### Reversal Process

1. Any verified user can initiate a **reversal challenge** on an adopted issue
2. A new voting round opens with the elevated threshold
3. If opposition exceeds the reversal threshold → issue status reverts to `Deliberating`
4. If opposition fails to reach threshold within observation period → challenge dismissed, conviction continues accumulating
5. Successful reversal resets conviction to 0

### Conviction Cap

Conviction does not grow without bound — it reaches a maximum (`convictionCap`, governance-adjustable). This ensures decisions are never truly irreversible. Even the most established decision can be overturned with sufficient opposition.

### Conviction and Implementation

Conviction protects decisions during and after implementation:

- If work is in progress (status: `Implementing`), reversal doesn't automatically void completed work
- Already-verified milestones and minted rewards are not affected by reversal
- Reversal stops *future* work on the issue; it reverts to `Deliberating` for reconsideration

### Parameters (governance-adjustable via 013)

| Parameter | Default | Description |
|-----------|---------|-------------|
| `convictionRate` (k) | configurable | How fast conviction grows per unit time |
| `convictionCap` | configurable | Maximum conviction value |
| `challengeObservationPeriod` | 14 days | How long a reversal challenge stays open |
| `challengeCooldown` | 30 days | Minimum time between challenges on same issue |

### Events

- `ConvictionUpdated(uint256 indexed issueId, uint256 newConviction)`
- `ReversalChallengeInitiated(uint256 indexed issueId, address challenger, uint256 requiredThreshold)`
- `ReversalSucceeded(uint256 indexed issueId)`
- `ReversalFailed(uint256 indexed issueId)`

### Extension Points

- Non-linear conviction curves (e.g., logarithmic — fast initial growth, slow later)
- Per-issue conviction parameters based on issue scope or impact
- Conviction decay if participation drops below a threshold

## Plan

1. Implement `ConvictionFacet` with linear accumulation logic
2. Implement reversal challenge initiation and elevated threshold
3. Implement challenge observation period and resolution
4. Implement conviction cap
5. Implement challenge cooldown
6. Integrate with issue lifecycle (005) — reversal triggers state transition
7. Add conviction parameters to meta-governance (013)
8. Tests

## Test

- Conviction accumulates linearly after adoption
- Conviction reaches cap and stops growing
- Reversal challenge: opposition below threshold → dismissed
- Reversal challenge: opposition exceeds threshold → issue reverts to Deliberating
- Successful reversal resets conviction to 0
- Challenge cooldown enforced — cannot challenge again too soon
- Conviction parameters adjustable via meta-governance
- Reversal during implementation: future work stops, completed milestones unaffected
- Edge: challenge initiated just before cap → threshold correctly computed

## Notes

- Conviction provides decision stability without permanence — every decision remains reversible
- The psychological effect matters: seeing "Conviction: 6 months stable — reversal requires 78% opposition" communicates legitimacy
- Linear growth is simplest for v1; community may vote for non-linear curves via 013
- Separated from delegation (009) because they are orthogonal concerns that interact only through the voting engine
