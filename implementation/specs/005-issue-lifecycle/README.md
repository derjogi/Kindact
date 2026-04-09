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

Additionally, adopted issues can be **amended** or **reversed** (see below).

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

### RewardCeiling

Set during issue creation or deliberation. Specifies the maximum $CC that can be minted on verified completion — this is an **authorized emission budget**, not escrowed funds. No tokens exist until work is verified and minted via 008. The ceiling is allocated across milestones by the approved work package (017).

### Events

- `IssueCreated(uint256 indexed id, address indexed creator, bytes32 contentHash)`
- `IssueStateChanged(uint256 indexed id, Status from, Status to)`
- `RewardCeilingSet(uint256 indexed id, uint256 amount)`
- `SnapshotCreated(uint256 indexed id, uint16 version, bytes32 snapshotHash)`
- `IssueAmended(uint256 indexed id, uint16 oldVersion, uint16 newVersion)`

### Extension Points

- Additional metadata fields and derived views via module hooks
- Issue protocol binding, overlay resolution, and procedural snapshots are delegated to 016-extensibility-foundation
- Metrics gating and canonical metric bundles are delegated to 017-core-metrics-framework

## Plan

1. Implement `IssueRegistryFacet` with storage, state enum, and version tracking.
2. Implement state transition logic with condition guards.
3. Implement reward ceiling mechanism (authorized mint budget).
4. Implement decision snapshot creation at adoption.
5. Implement amendment and reversal flows (version increment, snapshot update).
6. Integrate with `ContentAnchorFacet` (004) for content hash storage.
7. Integrate with `MetricsBundleFacet` (016) for net-impact gate.
8. Tests.

## Test

- Unit: each state transition (valid + invalid).
- Unit: reward ceiling set and enforced.
- Unit: net-impact gate blocks VoteReady when metrics verdict is not positive.
- Unit: decision snapshot created at adoption with correct data.
- Unit: amendment flow — version increments, new snapshot created.
- Unit: reversal — adopted issue returns to Deliberating, conviction resets.
- Integration: content hash anchoring via 004.
- Integration: state transition triggered by voting engine (007).
- Integration: work package approval triggers Implementing via 017.

## Notes

- State machine is deliberately linear for v1; branching/parallel states deferred
- Reward amounts capped by voter-scaled logic in 008
- Scope must become richer than a coarse enum because protocol binding depends on canonical location refs and topic tags.
- While the lifecycle remains linear in v1, decision continuity modules should be limited to semantics that can fit this lifecycle cleanly unless reopening/reversal states are added later.
