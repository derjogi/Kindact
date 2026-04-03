---
status: planned
created: '2026-04-03'
tags: [decision-making, governance, smart-contracts]
priority: medium
depends_on:
  - 007-voting-engine
---

# 009 — Delegation & Conviction Voting

## Overview

Liquid democracy + conviction voting. Extends VotingEngine with per-topic delegation and time-weighted conviction accumulation for decisions.

## Design

### DelegationFacet

Extends VotingEngine with delegation capabilities.

**Per-topic delegation** — users delegate by tag/category, not globally:

```
struct Delegation {
    address delegator;
    address delegate;
    bytes32[] topicTags;
    uint256 delegatedAt;
    uint256 revokedAt;      // 0 = active
}
```

- Delegation is always instantly revocable
- Direct vote on a specific issue overrides delegation for that issue
- **Transitive delegation**: A→B→C means C votes with A+B+C weight. Max depth configurable (default: 5)
- Circular delegation detection on-chain (reject if cycle detected)

### ConvictionFacet

Decisions accumulate conviction over time — the longer uncontested, the harder to reverse.

**Conviction formula**: conviction grows linearly with time since adoption. Reversal requires:

```
opposition_votes > base_threshold + conviction_bonus
conviction_bonus = k * time_since_adoption
```

Where `k` is a governance-adjustable parameter.

### Events

- `DelegationCreated(delegator, delegate, topicTags[])`
- `DelegationRevoked(delegator, delegate)`
- `ConvictionUpdated(issueId, newConviction)`

### Extension Points

- Weighted delegation (partial weight splitting)
- Topic taxonomy evolution via meta-governance

## Plan

1. Implement `DelegationFacet` with per-topic storage
2. Implement transitive delegation resolution (BFS with depth limit)
3. Implement `ConvictionFacet` with linear accumulation
4. Integrate with `VotingEngineFacet` — delegation-aware vote tallying
5. Tests for delegation chains, conviction accumulation, edge cases

## Test

- Delegate and verify vote weight transfers
- Transitive chain A→B→C→D: verify D accumulates all weight
- Exceed max depth: verify delegation ignored beyond limit
- Direct vote overrides delegation
- Revoke delegation mid-vote
- Circular delegation rejected
- Conviction grows over time, reversal threshold increases
- Conviction resets on successful reversal

## Notes

- Delegation graph stored on-chain but resolution can be computed off-chain for gas efficiency (submit proof)
- Conviction parameters adjustable via 013-meta-governance
