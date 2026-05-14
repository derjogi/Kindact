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
- 030-extensibility-foundation
- 031-core-metrics-framework
created_at: 2026-04-05T10:28:37.053390177Z
updated_at: 2026-04-05T10:28:37.053390177Z
---

# 008 — Work Verification & Rewards

On-chain claim→verify→mint flow with modular verification policies. Implements the final steps of the core loop: doing the work, verifying it under the issue's snapshotted implementation rules, and minting $CC rewards.

## Design

### WorkVerificationFacet

Manages the implementation lifecycle after an issue reaches `Adopted` status.

### WorkPackage

Defined and managed by 017-work-planning. This facet receives approved work packages and manages the verification and reward flow for individual milestones.

### Claim

Implementer claims a milestone within an approved work package.

| Field | Type | Description |
|-------|------|-------------|
| claimId | uint256 | Auto-incremented |
| workPackageId | uint256 | Reference to work package |
| implementerWallet | address | Who's doing the work |
| status | enum | `Active → Submitted → Verified / Rejected` |
| createdAt | uint48 | Claim timestamp |

### ImplementationReport

AT Proto records using Kindact lexicons (`org.kindact.work.report`), stored in the implementer's PDS repo and signed by their DID. The report hash anchored on-chain via 004 is the CID of the AT Proto record.

- **What was done** — description of work performed
- **Time spent** — hours/effort
- **Resources used** — materials, costs
- **Impact achieved** — measurable outcomes
- **Types:** partial (milestone), final

### Evidence

AT Proto blobs/attachments using `org.hypercerts.context.attachment` records, stored in the implementer's PDS repo. Hashes are still stored with the report on-chain, but content lives in AT Proto repos rather than standalone IPFS.

### Verification Flow

1. Implementer submits report with evidence hashes and realized metrics data
2. The issue's implementation snapshot determines which evidence types are required and which verification policy is active
3. Verifiers (volunteers, see below) and/or automated checks review the submitted evidence according to that policy
4. Multiple verifiers are required when the voter-scaled threshold applies
5. On approval → triggers `$CC` mint via `TokenCoreFacet` (003) mint hook, subject to the holdback rules below

### Verifier Model — Volunteer-Based with Exclusions

Verifiers are **always volunteers**, never assigned by the protocol. Any humanity-verified user (per 002) MAY opt in to verify a specific submitted report. The protocol does not pick verifiers — it filters who is *allowed* to volunteer for a given claim.

**Hard exclusions** (a wallet cannot verify a given claim if any apply):

- The wallet is the implementer of the claim, or is a co-claimant on the same work package.
- The wallet has verified another claim by the same implementer within the **recent-verification cooldown** (default 30 days; governance-tunable per 013).
- The wallet has a verified pattern of bad verification — operationally: a non-zero count of dispute-confirmed-bad verifications in the last `M` claims they touched (default `M = 20`, threshold = 1; tunable). Implemented as a per-wallet running counter updated by 012-dispute-resolution.
- The wallet is in the implementer's transitive delegation graph within `n` hops (default `n = 1`; tunable). Prevents collusion via delegation chains.
- The wallet is currently inside an exponential cooldown from a *failed* dispute they raised (per 012's anti-abuse cooldown).

**Soft signals** (do not block, but surface in the UI for context):

- Low historical verification count (new verifier).
- Verifier shares lens membership with the implementer.

A claim becomes verifiable only when the **required number of distinct, eligible volunteers** have submitted approval. Volunteers may also reject; the policy decides how rejections combine with approvals (default: any rejection blocks finalization until reconciled).

### Verifier Rewards

Verifiers performing the work earn compensation. **Default**: verifier rewards equal **the platform fees collected on the issue** (e.g., the buy premium on $CC purchases that funded the issue, fees from hypercert sales linked to the issue, or platform-defined per-claim verification fees). The exact reward source mix is **governance-tunable per 013**.

Distribution: when multiple verifiers are required, the verifier reward pool for that claim is split equally among the verifiers who submitted a final decision aligned with the resolved outcome.

Verifier rewards are subject to the same dispute-window holdback as implementer rewards.

### Reward Caps and Multi-Verifier Threshold

Reward caps and verifier-count requirements both scale with the number of original voters on the issue. Small voter group = small max reward, single verifier sufficient. Larger voter group = higher cap, more verifiers required.

**Default verifier-count tiers** (governance-tunable per 013):

| Original voters on issue | Required verifiers |
|--------------------------|-------------------|
| < 20                     | 1 |
| 20 – 100                 | 3 |
| > 100                    | 5 |

The same scaling logic governs the maximum reward magnitude — small voter group ⇒ small max reward — preventing self-dealing on low-participation issues.

### Holdback (Dispute Window)

When a claim is approved, **only a fraction of the reward is released immediately**; the remainder is held back pending the dispute window.

**Default**: 70% released on verification, **30% held back** until the issue's dispute window (set by the dispute snapshot, see 012) closes without a successful dispute. Released holdback may also be retroactively clawed back via the Debt Ledger (003) if a dispute is later confirmed.

**Tunability**: the holdback percentage is governance-tunable per 013, and may be **tiered** (e.g., 50% small / 30% medium / 15% large) by community decision. Tier configuration is part of the implementation snapshot — once an issue enters Implementing, its holdback policy is frozen for all claims under it.

Holdback applies symmetrically to verifier rewards.

### Partial Rewards

Milestones can trigger partial minting. Total across milestones must not exceed the locked `RewardIntent` from 005.

### Events

- `WorkPackageCreated(uint256 id, uint256 issueId)`
- `ClaimSubmitted(uint256 claimId, address implementer)`
- `ReportSubmitted(uint256 claimId, bytes32 reportHash)`
- `VerificationDecision(uint256 claimId, address verifier, bool approved)`
- `RewardMinted(uint256 claimId, address recipient, uint256 amount)`

### Extension Points

- Pluggable verification evidence types and policy combinators registered as modules in slots `verification.evidence` (multi) and `verification.policy` (single) per 030. Examples: `kindact/photo-evidence@1.0.0`, `kindact/peer-confirmation@1.0.0`, `kindact/threshold-policy@1.0.0`. The implementation-phase snapshot pins fully versioned module ids so a policy update never changes the rules under a running claim.
- ValueFlows integration for structured reporting (future).
- Dispute hooks (012).
- Metrics realization reporting via 031-core-metrics-framework.

## Plan

1. Implement `WorkVerificationFacet` with storage
2. Implement claim lifecycle (claim → submit → verify)
3. Implement volunteer-verifier eligibility filter (hard exclusions, soft signals)
4. Implement voter-scaled reward caps and verifier-count tiers
5. Implement holdback split (immediate vs deferred portion) and dispute-window release
6. Implement verifier-reward pool sourced from platform fees
7. Implement mint trigger via `TokenCoreFacet` (003)
8. Integrate with `IssueRegistryFacet` for state transitions
9. Tests

## Test

- Unit: claim lifecycle (all status transitions)
- Unit: volunteer eligibility — exclusions enforced (self-claim, recent-same-implementer, bad-history, delegation-graph, dispute-cooldown)
- Unit: verifier-count tier selection by original voter count
- Unit: reward cap calculation (voter-scaled)
- Unit: holdback split — immediate portion minted, deferred portion locked until dispute window closes
- Unit: holdback clawback when dispute confirmed during window
- Unit: tiered holdback policy snapshot at Implementing entry; later policy changes do not affect in-flight claims
- Unit: verifier-reward distribution split equally among aligned verifiers
- Unit: partial reward accumulation (must not exceed cap)
- Integration: mint trigger via TokenCoreFacet (immediate + deferred releases)
- Integration: issue state transition to Completed
- Integration: evidence hash verification via 004
- Integration: 012 dispute outcome updates verifier bad-history counter

## Notes

- **Verifier model**: volunteers, not assigned. Eligibility is filtered, not selected. See Verifier Model section.
- Voter-scaled caps and verifier-count tiers are the primary Sybil resistance for reward gaming
- Dispute resolution (012) can override verification decisions and triggers holdback clawback
- RewardIntent locked amount from 005 is the absolute ceiling (immediate + deferred summed across all claims)
- Verification requirements (including holdback %, verifier-count tiers, exclusion windows) must be snapshotted when implementation begins so they cannot be changed mid-claim.
