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

### On-Chain Data

```solidity
struct ReserveState {
    Phase   phase;          // Bootstrap, Growth, Maturity
    uint256 reserveBalance; // Total fiat-denominated reserve
    uint256 rTarget;        // Target reserve for maturity
    uint256 dailyRedeemed;  // Rolling 24h redemption total
    uint48  dailyResetAt;   // Next daily cap reset timestamp
}

struct QueuedRedemption {
    address redeemer;
    uint256 ccAmount;
    uint48  queuedAt;       // Subject to demurrage from this point
    bool    fulfilled;
}
```

### Fiat Oracle

The reserve facet does not embed a specific oracle implementation. Instead, it defines a fixed interface that any registered oracle module must implement:

```solidity
interface IReserveOracle {
    /// Push the latest fiat balance backing $CC, with a verifiable attestation.
    function reportReserveBalance(
        uint256 fiatAmountCents,
        bytes calldata attestationProof,
        uint64 observedAt
    ) external;
}
```

**Design constraints:**

- Balance reporting MUST be **automated and high-frequency**. Manual signing loops (e.g., a human-operated multisig that re-signs the balance every few minutes) are not acceptable as the steady-state mechanism — they don't scale to the cadence the price curve and redemption flow require.
- Every accepted update MUST carry an attestation chain back to the underlying bank balance source. Acceptable provider categories:
  - **Decentralized oracle networks with proof-of-reserves adapters** (Chainlink PoR, Pyth, RedStone) connected to Open Banking APIs (e.g., apicentre.paymentsnz.co.nz, EU PSD2 endpoints, Plaid/TrueLayer with verifiable response signing).
  - **zkTLS / TLSNotary attestations** of HTTPS responses from the bank's balance endpoint, verified on-chain.
  - **Bank-signed attestations**, where the bank itself publishes signed balance statements that the contract verifies cryptographically.
- Multiple oracle modules MAY be registered; the facet may require N-of-M agreement (or median-of-M) before accepting a balance update. This provides defense in depth without putting humans in the read loop.
- Oracle modules are **registered, replaced, and removed via meta-governance (013)** without modifying the reserve facet itself.
- The facet does not impose a fixed update cadence. Each consumer (pricing, redemption) reads the most recent attested value and accounts for `observedAt` age in its own staleness checks.

**Bootstrap-only multisig role.** A platform multisig MAY be used to *configure* the initial registered oracle module(s) (and to gate emergency reserve corrections subject to a timelock per 013), but it MUST NOT be the source of routine balance updates themselves. Routine reads always flow through `IReserveOracle` implementations driven by automated attestations.

**Why no manual multisig path for routine reads.** The confidence-curve price `E_t = b_t + (1 - b_t)(R_t / R_{target})^2` reacts to changes in the reserve balance. Live deposits, redemptions, and external transfers all change `R_t`. A human-signed update loop would either (a) introduce stale pricing windows long enough to be arbitraged, or (b) require operators on-call 24/7 to co-sign — neither is acceptable.

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
- Fiat oracle is a pluggable module conforming to `IReserveOracle`; no manual multisig in the steady-state read loop (see Fiat Oracle section)
