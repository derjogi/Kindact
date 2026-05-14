---
status: planned
created: 2026-04-03
priority: medium
tags:
- decision-making
- governance
- smart-contracts
depends_on:
- 007-voting-engine
- 028-tag-registry
- '030'
created_at: 2026-04-30T09:54:56.208617876Z
updated_at: 2026-04-30T09:54:56.208617876Z
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

### Geographic-Scope Delegation (v1, depends on 030 lock)

Topic-tag delegation does not naturally express delegations such as "let my neighborhood council decide local matters" or "my regional water board decides watershed issues." Geography is hierarchical, location-bound rather than subject-bound, and depends on the issue's scope rather than its topic. This section specifies a parallel **scope-based delegation** mechanism that runs alongside topic-tag delegation and shares the same multi-rule resolution machinery.

This feature is **v1 with a hard prerequisite on 030-extensibility-foundation**: it cannot be implemented until 030 finalises the canonical-geography primitive (location commitments, scope polygons, lens overlay format).

#### User Location

Users commit a **primary location** at chosen precision — never raw GPS:

- Precision tiers: `country`, `region`, `city`, `neighborhood`. Each tier is expressed as an H3 (or S2) cell at the appropriate resolution.
- The location commitment is stored in the user's AT Proto PDS (signed by their DID), not on-chain in plaintext. The on-chain identity record (002) stores only an opaque hash/commitment that the user can later prove against.
- The user controls precision: declaring "country only" is supported; declaring "exact home cell" is supported but discouraged.

#### Sybil Posture (MVP)

For v1, location is **self-declared and flagged, not enforced**:

- Anyone can declare any location.
- Locations are flagged in the UI with their verification state (`unverified`, `provider-verified`, `proof-of-residence`).
- Issue-level rules (set by the protocol binding from the issue's lens — see 030) decide whether to require verified locations to vote on hyperlocal issues. The platform does not impose a global minimum.
- Verified-location providers (postal-code mailers, attestation by N existing residents, government-ID-bound proofs) are out of scope for v1 and tracked as future work.

#### Boundary Data

The platform does not ship its own world geography. It references standard datasets via 030's canonical-geography resolvers:

| Layer | Source |
|-------|--------|
| Countries / regions / cities | OpenStreetMap administrative boundaries |
| Neighborhoods | OSM `place=neighbourhood`; fallback to admin subdivisions |
| Watersheds, ecoregions | HydroSHEDS, WWF Ecoregions |
| Custom regions (bioregions, custom communities) | Lens-defined polygons via 030 overlays |

A user's primary location resolves into a **stack of containing scopes** ("user X is inside neighborhood A, which is inside city B, which is inside region C, which is inside country D"). The user can declare a delegation at *each* scope independently.

#### Scope-Match Resolution

For an issue with a geographic scope `S` (an issue is `Wellington-wide`, `East-Side-neighborhood`, `Pacific-Cascadia-bioregion`, etc., per 030):

1. Resolve the user's location into the set of scopes that contain it.
2. Match: find the user's active geographic delegations whose declared scope `T` is **equal to or contains** `S`.
3. Rank by specificity (smallest containing scope wins): an East-Side delegation beats a Wellington-wide delegation for an East-Side-only issue.
4. If multiple equally-specific delegations conflict (e.g., user delegated two different addresses to the same scope) → ambiguous → no delegation applies, user votes directly. (Same rule as multi-tag.)
5. **No "closest scope" fallback.** If the user's location is not inside any scope at the requested level, the geographic delegation does not fire and the user votes directly. Fuzzy proximity rules invite manipulation.

#### Interaction with Topic-Tag Delegation

Geographic delegations are stored alongside topic-tag delegations in the same `Delegation` table, distinguished by a `dimension` field (`topic` vs `scope`):

```solidity
enum DelegationDimension { Topic, Scope }

struct Delegation {
    address delegator;
    address delegate;
    DelegationDimension dimension;
    bytes32[] keys;          // tag IDs if Topic; scope IDs (from 030) if Scope
    uint256 delegatedAt;
    uint256 revokedAt;
}
```

**Multi-dimensional resolution** for an issue carrying both a topic set and a geographic scope:

1. Resolve topic-tag delegation per the existing multi-tag rules.
2. Resolve scope delegation per the rules above.
3. If only one fires → use it.
4. If both fire and point to the same delegate → use it.
5. If both fire and point to different delegates → ambiguous → no delegation applies.

The "ambiguous → no delegation" default is conservative: a delegator who creates a conflicting setup is asked to resolve it before delegation activates.

### Security Considerations

- **Gas**: transitive resolution can be computed off-chain with on-chain proof submission for gas efficiency
- **Eligibility bypass**: only the terminal delegate must pass eligibility — delegators may bypass stakeholder gates. Consider requiring delegators to also meet minimum eligibility
- **Centralization**: max depth limit prevents unbounded accumulation of power
- **Geographic Sybil pressure**: location is self-declared in v1. Hyperlocal issues are vulnerable to flooding by out-of-area accounts unless the issue's lens (030) requires verified locations. This is a known limitation tracked for v2.
- **Location privacy**: location commitments live in the user's PDS at chosen precision. The on-chain registry stores only an opaque commitment. Exact-cell precision is supported but UI-discouraged.

### Extension Points

- Delegation is a module in slot `decision.modifier` per 030, shipped as `kindact/liquid-delegation@1.0.0`. The issue's decision-phase snapshot pins the exact versioned id so a delegation-logic upgrade never silently changes an active decision phase.
- Weighted delegation (partial weight splitting) — would ship as a separate module version or sibling module.
- Topic taxonomy evolution via meta-governance (013).
- Verified-location providers for stronger geographic Sybil resistance (postal-code mailers, resident-attestation networks, government-ID proofs) — v2.

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
