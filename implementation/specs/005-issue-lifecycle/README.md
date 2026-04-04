---
status: planned
created: '2026-04-03'
tags: [issues, core-loop, smart-contracts]
priority: high
depends_on:
  - 001-diamond-module-registry
  - 004-content-anchoring
---

# 005 — Issue Lifecycle

On-chain issue state machine with off-chain content. Implements the first step of the core loop: identifying and tracking issues from creation through completion.

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
| scope | enum | `Local`, `National`, `Global` |
| rewardAmount | uint256 | Locked $CC mintable on completion |
| contentHash | bytes32 | Points to off-chain body via 004 |
| createdAt | uint48 | Creation timestamp |
| updatedAt | uint48 | Last state change timestamp |

### State Transitions

Transitions enforced by contract — only specific roles/conditions trigger each:

- `Draft → Deliberating` — creator or moderator initiates deliberation
- `Deliberating → VoteReady` — requires deliberation metrics filled (min comments, min duration)
- `VoteReady → Adopted` — triggered by voting engine (007) when vote passes
- `Adopted → Implementing` — work package claimed (008)
- `Implementing → Completed` — work verified and rewards minted (008)
- `Completed → Archived` — time-based or manual

### Off-chain Content

Full issue content (title, summary, description, tags, revisions) stored content-addressed. Hash anchored on-chain via `ContentAnchorFacet` (004).

### RewardIntent

Locked at issue creation or before voting. Specifies maximum $CC mintable on completion. Funds held in contract until resolution.

### Events

- `IssueCreated(uint256 id, address creator, bytes32 contentHash)`
- `IssueStateChanged(uint256 id, Status from, Status to)`
- `RewardLocked(uint256 id, uint256 amount)`

### Extension Points

- Custom state machines per community (future)
- Additional metadata fields via module hooks

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
- Scope field enables future filtering/routing but has no logic in v1
