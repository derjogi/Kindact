---
status: planned
created: '2026-04-03'
tags: [economics, token-economy, smart-contracts]
priority: medium
depends_on:
  - 003-cc-token-core
---

# 010 — Reserve Exchange

## Overview

Fiat-backed reserve for $CC with phased exchange rates, buy premium, and bank run prevention via flow controls.

## Design

### ReserveExchangeFacet

Manages the fiat-backed reserve and $CC exchange.

**Three phases** (from Kindact_Economics.md):

| Phase | Condition | Behavior |
|-------|-----------|----------|
| Bootstrap | supply < 100k $CC | No cash-outs, internal circulation only |
| Growth | reserve < $1M target | Exchange enabled, confidence curve rate |
| Maturity | reserve ≥ target | Exchange rate → $1, stablecoin behavior |

**Confidence curve** (Growth phase):

```
E = b + (1-b) * (R / R_target)^2
where b = R / S  (backing ratio)
```

**Buy premium**: 3% on fiat→$CC purchases, flows into reserve.

**Reserve minting**: buying $CC with fiat creates new tokens (secondary mint channel alongside work rewards).

### Flow Controls (Bank Run Prevention)

- **Daily redemption cap**: 1% of reserve per 24h rolling window
- **Reserve floor**: if backing ratio < 5%, redemptions pause and queue
- **Queued redemptions**: subject to demurrage (liability shrinks over time)

### On-chain vs Off-chain

- **On-chain**: reserve balance tracking, exchange rate computation, redemption queue, phase state
- **Off-chain**: fiat payment processing (Stripe, bank transfers) — oracle reports fiat deposits

### Events

- `ReservePurchase(buyer, fiatAmount, ccMinted, exchangeRate)`
- `Redemption(redeemer, ccBurned, fiatAmount, exchangeRate)`
- `PhaseTransition(oldPhase, newPhase)`
- `RedemptionQueued(redeemer, ccAmount, queuePosition)`

### Extension Points

- Governance-adjustable `R_target` and phase thresholds (via 013)
- Additional flow controls (velocity limits, progressive fees)

## Plan

1. Implement `ReserveExchangeFacet` with phase state machine
2. Implement confidence curve math (fixed-point arithmetic)
3. Implement flow controls (daily cap, reserve floor, queue)
4. Implement redemption queue with demurrage integration
5. Integrate with `TokenCoreFacet` for minting/burning
6. Tests for all phase transitions and edge cases

## Test

- Phase transitions at correct thresholds
- Confidence curve returns correct exchange rates
- Buy premium correctly adds to reserve
- Daily cap enforced across multiple redemptions
- Reserve floor triggers queue
- Queued redemptions shrink with demurrage
- Reserve minting creates correct token amounts
- Edge: exactly at phase boundary, zero reserve, max supply

## Notes

- Fixed-point math library needed for on-chain curve computation (use PRBMath or similar)
- Fiat oracle must be tamper-resistant — multisig attestation of deposits
