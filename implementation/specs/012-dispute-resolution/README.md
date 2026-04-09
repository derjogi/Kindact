---
status: planned
created: 2026-04-03
priority: medium
tags:
- verification
- security
- smart-contracts
depends_on:
- 003-cc-token-core
- 008-work-verification-rewards
- '016'
created_at: 2026-04-05T10:28:37.168826256Z
updated_at: 2026-04-05T10:28:37.168826256Z
---

# 012 — Dispute Resolution

## Overview

On-chain dispute flow for challenging verified work, with deposit-based skin in the game, community adjudication, slashing, and clawback.

## Design

### DisputeResolutionFacet

Handles challenges to verified work claims.

**Dispute flow**:

1. **Challenge**: challenger flags a claim with a small $CC deposit (skin in the game)
2. **Halt**: payments on the disputed claim halt immediately
3. **Snapshot**: issue records the active dispute procedure before review begins
4. **Review**: community engagement period under the issue's snapshotted dispute rules
5. **Resolution threshold**: 2% of original voters (min 5 people), 80% agreement to confirm fraud
6. **Outcomes**:
   - *Fraud confirmed*: clawback $CC from perpetrator (balance can go negative), challenger deposit returned + bonus
   - *Dismissed*: challenger deposit burned, claim payments resume
   - *Timeout (no verdict)*: restrictions loosen gradually, payments resume with delay

### On-Chain Data

```solidity
struct Dispute {
    uint256 disputeId;
    uint256 claimId;        // The claim being disputed
    address challenger;
    uint256 deposit;        // $CC staked by challenger
    bytes32 evidenceHash;   // Content-addressed challenge rationale
    uint48  openedAt;
    uint48  resolvedAt;     // 0 = pending
    Outcome outcome;        // Pending, FraudConfirmed, Dismissed, Timeout
    uint256 forFraud;       // Vote count: fraud confirmed
    uint256 againstFraud;   // Vote count: dismissed
}
```

The dispute binds to the issue's **snapshotted dispute rules** (from 005's procedural snapshot) — rules frozen at the time the issue entered the implementation phase apply, preventing mid-dispute rule changes.

### Clawback Mechanism

- On confirmed fraud, `TokenCoreFacet` (003) first seizes the perpetrator's current balance.
- If current balance is insufficient, the remainder is recorded in the **debt ledger** (003) — future mint earnings are automatically offset against the debt.
- Demurrage does not apply to debt (the obligation remains fixed).
- Confirmed fraud → on-chain restriction record, reduced platform privileges.

### Anti-Abuse

- **Verifier rotation**: same verifier cannot approve the same issue repeatedly
- **Rate-limited accusations**: failed disputes trigger exponential cooldown on the challenger
  - 1st failed: 24h cooldown
  - 2nd failed: 72h cooldown
  - 3rd failed: 7d cooldown, etc.

### Events

- `DisputeOpened(disputeId, claimId, challenger, deposit)`
- `DisputeVoteCast(disputeId, voter, isFraud)`
- `DisputeResolved(disputeId, outcome, clawbackAmount)`
- `ClawbackExecuted(perpetrator, amount, newBalance)`
- `ChallengerPenalized(challenger, depositBurned, cooldownUntil)`

### Extension Points

- Escalation to external arbitration (Kleros, Aragon Court)
- Staking-based dispute mechanisms
- Additional dispute procedures, provided they snapshot cleanly at dispute open

## Plan

1. Implement `DisputeResolutionFacet` with state machine (open → review → resolved)
2. Implement deposit/slashing mechanics
3. Implement community voting on disputes (threshold-based)
4. Implement clawback (negative balance support in TokenCore)
5. Implement rate limiting (exponential cooldown)
6. Integrate with `WorkVerificationFacet` and `TokenCoreFacet`
7. Tests

## Test

- Open dispute halts payments on claim
- Fraud confirmed: clawback executed, challenger rewarded
- Dispute dismissed: deposit burned, payments resume
- Timeout: payments resume after delay
- Rate limiting: exponential cooldown on repeat failed disputes
- Verifier rotation enforced
- Negative balance correctly offsets future earnings
- Edge: dispute on already-disputed claim, dispute during payout

## Notes

- Debt is tracked in a separate ledger in 003 (not as negative ERC-20 balances) to maintain standard ERC-20 compatibility.
- Deposit amount should scale with claim size to prevent griefing on large claims.
