---
status: planned
created: 2026-04-03
priority: high
tags:
- issues
- core-loop
- smart-contracts
depends_on:
- 001-diamond-module-registry
- 004-content-anchoring
- '016'
- '017'
created_at: 2026-04-05T10:28:36.928106682Z
updated_at: 2026-04-05T10:28:36.928106682Z
---

# 005 — Issue Lifecycle

On-chain issue state machine with off-chain content and issue-centric protocol binding. Implements the first step of the core loop: identifying issues, resolving which modules apply to them, and carrying those rules through decision, implementation, and dispute phases.

## Design

### IssueRegistryFacet

On-chain state machine managing issue lifecycle within the Diamond.

**States:** `Draft → Deliberating → VoteReady → Adopted → Implementing → Completed → Archived`

**On-chain fields per issue:**

| Field | Type | Description |
|-------|------|-------------|
| id | uint256 | Auto-incremented issue identifier |
| status | enum | Current lifecycle state |
| creatorWallet | address | Issue creator |
| scopeVectorHash | bytes32 | Canonical scope vector: location refs, topic tags, scope level |
| rewardAmount | uint256 | Locked $CC mintable on completion |
| contentHash | bytes32 | Points to off-chain body via 004 |
| protocolBindingHash | bytes32 | Resolved issue protocol binding from 016 |
| metricsBundleHash | bytes32 | Canonical baseline metrics bundle from 017 |
| decisionSnapshotHash | bytes32 | Null until decision opens |
| implementationSnapshotHash | bytes32 | Null until implementation begins |
| disputeSnapshotHash | bytes32 | Null until dispute opens |
| createdAt | uint48 | Creation timestamp |
| updatedAt | uint48 | Last state change timestamp |

### State Transitions

Transitions enforced by contract — only specific roles/conditions trigger each:

- `Draft → Deliberating` — creator or moderator initiates deliberation
- `Deliberating → VoteReady` — requires resolved protocol binding, baseline metrics present, and net-impact gate satisfied
- `VoteReady → Adopted` — triggered by the active `decision.engine` in the issue's protocol binding when the snapshotted decision rules are satisfied
- `Adopted → Implementing` — work package claimed (008)
- `Implementing → Completed` — work verified and rewards minted (008)
- `Completed → Archived` — time-based or manual

At `VoteReady`, `Implementing`, and dispute-open boundaries, the issue records procedural snapshots defined by 016-extensibility-foundation.

### Off-chain Content

Full issue content (title, summary, description, tags, revisions, canonical location refs) stored content-addressed. Hash anchored on-chain via `ContentAnchorFacet` (004).

### RewardIntent

Locked at issue creation or before voting. Specifies maximum $CC mintable on completion. Funds held in contract until resolution.

### Events

- `IssueCreated(uint256 id, address creator, bytes32 contentHash)`
- `IssueStateChanged(uint256 id, Status from, Status to)`
- `RewardLocked(uint256 id, uint256 amount)`

### Extension Points

- Additional metadata fields and derived views via module hooks
- Issue protocol binding, overlay resolution, and procedural snapshots are delegated to 016-extensibility-foundation
- Metrics gating and canonical metric bundles are delegated to 017-core-metrics-framework

## Plan

1. Implement `IssueRegistryFacet` with storage and state enum
2. Implement state transition logic with role/condition guards
3. Implement reward locking mechanism
4. Integrate with `ContentAnchorFacet` for content hash storage
5. Tests for all valid state transitions
6. Tests for rejected invalid transitions

## Test

- Unit: each state transition (valid + invalid)
- Unit: reward locking and release
- Integration: content hash anchoring via 004
- Integration: state transition triggered by voting engine (007)

## Notes

- State machine is deliberately linear for v1; branching/parallel states deferred
- Reward amounts capped by voter-scaled logic in 008
- Scope must become richer than a coarse enum because protocol binding depends on canonical location refs and topic tags.
- While the lifecycle remains linear in v1, decision continuity modules should be limited to semantics that can fit this lifecycle cleanly unless reopening/reversal states are added later.
