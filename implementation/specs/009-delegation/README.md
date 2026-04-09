---
status: planned
created: '2026-04-03'
tags: [decision-making, governance, smart-contracts]
priority: medium
depends_on:
  - 007-voting-engine
  - 028-tag-registry
related:
  - 029-decision-continuity
---

# 009 — Delegation

## Overview

Liquid democracy via per-topic delegation. Extends the core voting engine with delegation as a decision modifier — users delegate voting power on specific tags rather than globally. Conviction-based decision stability is a separate concern handled by [029-decision-continuity](../029-decision-continuity/README.md).

## Design

### DelegationFacet

Extends VotingEngine with delegation capabilities.

**Per-topic delegation** — users delegate by tag/category, not globally:

```solidity
struct Delegation {
    address delegator;
    address delegate;
    bytes32[] topicTags;     // From 028-tag-registry
    uint256 delegatedAt;
    uint256 revokedAt;       // 0 = active
}
```

- Delegation is always instantly revocable
- Direct vote on a specific issue overrides delegation for that issue
- **Transitive delegation**: A→B→C means C votes with A+B+C weight. Max depth configurable (default: 5)
- Circular delegation detection on-chain (reject if cycle detected)

### Multi-Tag Resolution

When an issue has multiple tags, delegation rules are resolved by specificity:

1. **Match**: find all active rules where `rule.tagSet ⊆ issueTags`
2. **Rank**: sort by `|rule.tagSet|` descending (most specific first)
3. **Top tier**: select rules with the largest tag count
4. **Uniqueness**: if top-tier rules point to different delegates → **ambiguous**, no delegation applies

### Transitive Resolution

Delegation chains resolved via BFS with configurable depth limit (default: 5):

- Follow chain until a terminal voter (voted directly, no delegation, or max depth reached)
- **Cycle detection**: if a visited address reappears during traversal, chain is marked unresolved for that issue
- Tally counts represent **represented humans**, not unique transaction senders
- Delegation change during active vote: tally incrementally adjusted (remove old weight, add new weight)

### Events

- `DelegationCreated(delegator, delegate, topicTags[])`
- `DelegationRevoked(delegator, delegate)`

### Security Considerations

- **Gas**: transitive resolution can be computed off-chain with on-chain proof submission for gas efficiency
- **Eligibility bypass**: only the terminal delegate must pass eligibility — delegators may bypass stakeholder gates. Consider requiring delegators to also meet minimum eligibility
- **Centralization**: max depth limit prevents unbounded accumulation of power
- **Governance dimensions**: current design collapses topics/scope/tags into a single tag system, which makes geographic ("local community") delegation difficult to express. Future work may separate scope-based and topic-based delegation

### Extension Points

- Weighted delegation (partial weight splitting)
- Topic taxonomy evolution via meta-governance (013)
- Geographic-scope delegation (separate from topic-tag delegation)

## Plan

1. Implement `DelegationFacet` with per-topic storage
2. Implement transitive delegation resolution (BFS with depth limit)
3. Implement multi-tag resolution algorithm (specificity-ranked)
4. Implement circular delegation detection
5. Integrate with `VotingEngineFacet` — delegation-aware vote tallying
6. Tests for delegation chains, multi-tag resolution, edge cases

## Test

- Delegate and verify vote weight transfers
- Transitive chain A→B→C→D: verify D accumulates all weight
- Exceed max depth: verify delegation ignored beyond limit
- Direct vote overrides delegation
- Revoke delegation mid-vote (tally incrementally adjusted)
- Circular delegation rejected
- Multi-tag resolution: most specific rule wins
- Multi-tag ambiguity: equal-specificity conflict → no delegation applies

## Notes

- Delegation graph stored on-chain but resolution can be computed off-chain for gas efficiency (submit proof)
- Delegation is resolved through the issue's procedural snapshot (018), so later overlay changes do not retroactively alter an active decision phase
- Conviction / decision continuity is intentionally split into [029-decision-continuity](../029-decision-continuity/README.md) — they are orthogonal concerns that interact only through the voting engine
- Tag definitions and the issue tag snapshot are owned by [028-tag-registry](../028-tag-registry/README.md)
