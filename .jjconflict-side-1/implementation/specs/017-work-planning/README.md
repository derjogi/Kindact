---
status: planned
created: '2026-04-14'
tags: [implementation, core-loop, smart-contracts]
priority: high
depends_on:
  - 005-issue-lifecycle
  - 008-work-verification-rewards
---

# 017 — Work Planning & Reward Definition

## Overview

Defines how adopted issues become actionable work. Covers work package creation, milestone decomposition, reward allocation, and multi-implementer coordination. Bridges the gap between a community decision (005) and implementation tracking (008).

## Design

### Work Packages

After an issue reaches `Adopted` status, anyone can propose a **work package** — a concrete plan for implementing the decision.

```
struct WorkPackage {
    uint256 id;
    uint256 issueId;
    address proposer;
    bytes32 planHash;         // IPFS hash of detailed plan
    uint256 rewardCeiling;    // max $CC mintable for this package
    uint8   milestoneCount;
    Status  status;           // Proposed → Approved → Active → Completed
}
```

### Who Creates Work Packages

- **Anyone** can propose a work package for an adopted issue.
- Multiple competing packages can be proposed for the same issue.
- The community selects the best package via lightweight approval (simple majority of interested voters via 007).
- Issue creator has no special authority over work packages.

### Milestones

Each work package is broken into milestones with individual reward allocations:

```
struct Milestone {
    uint256 id;
    uint256 workPackageId;
    bytes32 descriptionHash;
    uint256 rewardAllocation;   // portion of package's rewardCeiling
    uint48  estimatedDuration;
    Status  status;             // Pending → Active → Submitted → Verified
}
```

- Sum of milestone allocations must not exceed the package's `rewardCeiling`.
- Milestones are sequential by default but can be marked as parallelizable.
- Each milestone triggers independent verification via 008.

### Reward Definition

- **Mint ceiling** is set during issue creation or deliberation — it is an authorized emission budget, not escrowed funds.
- Work package proposer allocates the ceiling across milestones.
- Voter-scaled caps (from 008) apply as an additional constraint.
- The community can adjust the ceiling via amendment vote if needed.

### Multi-Implementer Support

- A single work package can have **multiple implementers** assigned to different milestones.
- Implementers claim specific milestones, not entire packages.
- Reward for each milestone goes to whoever completes and gets verified.

### Package Lifecycle

1. Issue reaches `Adopted`.
2. Anyone proposes work package(s) with milestone breakdown.
3. Community approves a package (lightweight vote via 007).
4. Implementers claim milestones.
5. Each milestone follows the claim → submit → verify → mint flow (008).
6. All milestones verified → package complete → issue transitions to `Completed`.

### Events

- `WorkPackageProposed(uint256 indexed id, uint256 indexed issueId, address proposer)`
- `WorkPackageApproved(uint256 indexed id, uint256 indexed issueId)`
- `MilestoneCreated(uint256 id, uint256 indexed workPackageId, uint256 rewardAllocation)`
- `MilestoneClaimed(uint256 indexed milestoneId, address implementer)`

### Extension Points

- Competitive bidding on work packages.
- Reputation-weighted package selection.
- ValueFlows integration for structured resource planning.

## Plan

1. Implement `WorkPlanningFacet` with package and milestone storage.
2. Implement package proposal and lightweight approval flow.
3. Implement milestone decomposition and reward allocation logic.
4. Implement multi-implementer claim management.
5. Integrate with `IssueRegistryFacet` (005) and `WorkVerificationFacet` (008).
6. Tests.

## Test

- Unit: propose work package, milestone creation, reward allocation.
- Unit: milestone allocations cannot exceed package ceiling.
- Unit: multiple packages proposed, one approved.
- Unit: multi-implementer claims on different milestones.
- Integration: full flow — adopt issue → propose package → approve → claim → verify → mint.
- Integration: package completion triggers issue state transition to Completed.
- Edge: single milestone package, all milestones claimed by same person, abandoned milestone.

## Notes

- Work packages are the primary mechanism for turning decisions into action.
- The lightweight approval vote for packages uses the same voting engine (007) but with lower thresholds.
- Implementers work against the approved version of the issue at time of package approval (frozen snapshot model from prior design work).
