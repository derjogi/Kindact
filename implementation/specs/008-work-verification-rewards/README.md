---
status: planned
created: 2026-04-03
priority: high
tags:
- implementation
- core-loop
- smart-contracts
- token-economy
depends_on:
- 003-cc-token-core
- 005-issue-lifecycle
- 007-voting-engine
- '016'
- '017'
created_at: 2026-04-05T10:28:37.053390177Z
updated_at: 2026-04-05T10:28:37.053390177Z
---

# 008 — Work Verification & Rewards

On-chain claim→verify→mint flow with modular verification policies. Implements the final steps of the core loop: doing the work, verifying it under the issue's snapshotted implementation rules, and minting $CC rewards.

## Design

### WorkVerificationFacet

Manages the implementation lifecycle after an issue reaches `Adopted` status.

### WorkPackage

On-chain record linking to an adopted issue, defining scope of work.

### Claim

Implementer claims a work package.

| Field | Type | Description |
|-------|------|-------------|
| claimId | uint256 | Auto-incremented |
| workPackageId | uint256 | Reference to work package |
| implementerWallet | address | Who's doing the work |
| status | enum | `Active → Submitted → Verified / Rejected` |
| createdAt | uint48 | Claim timestamp |

### ImplementationReport

Off-chain content anchored on-chain via 004:

- **What was done** — description of work performed
- **Time spent** — hours/effort
- **Resources used** — materials, costs
- **Impact achieved** — measurable outcomes
- **Types:** partial (milestone), final

### Evidence

Off-chain assets (photos, videos, documents) content-addressed. Hashes stored with report on-chain.

### Verification Flow

1. Implementer submits report with evidence hashes and realized metrics data
2. The issue's implementation snapshot determines which evidence types are required and which verification policy is active
3. Verifiers and/or automated checks review the submitted evidence according to that policy
4. Multiple verifiers may be required for larger rewards (voter-scaled)
5. On approval → triggers `$CC` mint via `TokenCoreFacet` (003) mint hook

### Reward Caps

Scaled to number of original voters on the issue. Small voter group = small max reward. Prevents self-dealing on low-participation issues.

### Partial Rewards

Milestones can trigger partial minting. Total across milestones must not exceed the locked `RewardIntent` from 005.

### Events

- `WorkPackageCreated(uint256 id, uint256 issueId)`
- `ClaimSubmitted(uint256 claimId, address implementer)`
- `ReportSubmitted(uint256 claimId, bytes32 reportHash)`
- `VerificationDecision(uint256 claimId, address verifier, bool approved)`
- `RewardMinted(uint256 claimId, address recipient, uint256 amount)`

### Extension Points

- Pluggable verification evidence types and policy combinators
- ValueFlows integration for structured reporting (future)
- Dispute hooks (012)
- Metrics realization reporting via 017-core-metrics-framework

## Plan

1. Implement `WorkVerificationFacet` with storage
2. Implement claim lifecycle (claim → submit → verify)
3. Implement verifier selection and rotation logic
4. Implement voter-scaled reward caps
5. Implement mint trigger via `TokenCoreFacet` (003)
6. Integrate with `IssueRegistryFacet` for state transitions
7. Tests

## Test

- Unit: claim lifecycle (all status transitions)
- Unit: verifier selection and rotation
- Unit: reward cap calculation (voter-scaled)
- Unit: partial reward accumulation (must not exceed cap)
- Integration: mint trigger via TokenCoreFacet
- Integration: issue state transition to Completed
- Integration: evidence hash verification via 004

## Notes

- Verifier rotation prevents capture; selection algorithm TBD (may use randomness + reputation)
- Voter-scaled caps are the primary Sybil resistance for reward gaming
- Dispute resolution (012) can override verification decisions
- RewardIntent locked amount from 005 is the absolute ceiling
- Verification requirements must be snapshotted when implementation begins so they cannot be changed mid-claim.
