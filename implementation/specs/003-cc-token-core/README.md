---
status: planned
created: '2026-04-03'
tags: [token-economy, skeleton, smart-contracts, economics]
priority: critical
depends_on:
  - 001-diamond-module-registry
---

# 003 — $CC Token Core

## Overview

$CC (Community Currency) is an ERC-20 token with **continuous demurrage** — balances decay over time, incentivizing circulation over hoarding. Implemented as a Diamond facet with a global decay index model.

## Design

### TokenCoreFacet

Implements the full ERC-20 interface (`IERC20`, `IERC20Metadata`). All balance reads apply demurrage transparently.

### Demurrage Model

**Global decay index** — avoids per-balance timers.

- Storage: each account stores `rawBalance` and `balanceDecayIndex` (the global index at time of last checkpoint).
- A global `currentDecayIndex` increments continuously at the configured decay rate (~1% per month).

```
effectiveBalance(account) = rawBalance * (currentDecayIndex / balanceDecayIndex)
```

Since decay reduces value, `currentDecayIndex` is structured so the ratio decreases over time (or equivalently, raw balances are inflated and the index normalizes down). Implementation uses fixed-point math (e.g., 1e18 scale).

- **Checkpoint**: `_applyDemurrage(account)` — called before any balance mutation. Recalculates `rawBalance` to reflect accumulated decay, updates `balanceDecayIndex` to current.
- **Global checkpoint**: periodic `demurrageCheckpoint()` updates `currentDecayIndex`. Anyone can call it; also called lazily on transfers/mints/burns.

### Mint

- Only callable by authorized modules registered in `ModuleRegistry` (e.g., `WorkVerification`, `ReserveMinting`).
- Access enforced via role check: `MINTER_ROLE`.
- Emits `Mint(address indexed to, uint256 amount, bytes32 sourceType, bytes32 sourceRef)`.

### Burn

- Callable for: access fees, transaction fees, hypercert purchases, governance-approved burns.
- Emits `Burn(address indexed from, uint256 amount, bytes32 burnType)`.

### Transfer

Standard ERC-20 `transfer` / `transferFrom`. Both sender and receiver balances have demurrage applied before the transfer executes.

### MonetarySnapshot

Periodic on-chain snapshot (callable by anyone, incentivized by governance):

```
struct MonetarySnapshot {
    uint256 totalSupply;
    uint256 totalMinted;
    uint256 totalBurned;
    uint256 currentDecayIndex;
    uint64  timestamp;
}
```

Stored in a rolling array in `AppStorage`.

### Token Parameters

- **No pre-mine.** No founder allocation. All $CC is minted through verified work or governance-approved mechanisms.
- Demurrage rate: ~1% per month (governance-adjustable).
- Decimals: 18.
- Name: "Community Currency", Symbol: "CC".

### Events

- `Transfer(address indexed from, address indexed to, uint256 value)` — standard ERC-20.
- `Mint(address indexed to, uint256 amount, bytes32 sourceType, bytes32 sourceRef)`
- `Burn(address indexed from, uint256 amount, bytes32 burnType)`
- `DemurrageCheckpoint(uint256 newDecayIndex, uint64 timestamp)`
- `MonetarySnapshot(uint256 totalSupply, uint256 currentDecayIndex, uint64 timestamp)`

### Extension Points

- New mint/burn source modules register via `ModuleRegistry` and receive `MINTER_ROLE` or `BURNER_ROLE`.
- Demurrage rate adjustable via governance.
- Snapshot frequency adjustable.

## Plan

1. Implement demurrage math library (`DemurrageLib`) with fixed-point arithmetic.
2. Implement `TokenCoreFacet` — ERC-20 interface with demurrage-aware `balanceOf`, `transfer`, `transferFrom`, `approve`, `allowance`.
3. Implement mint/burn functions with role-based access control.
4. Implement `MonetarySnapshot` mechanism.
5. Write comprehensive tests (see below).
6. Gas optimization pass — minimize checkpoint cost.

## Test

- Unit: demurrage math precision over varying time intervals (1 second, 1 day, 1 month, 1 year, 10 years).
- Unit: ERC-20 compliance (OpenZeppelin test suite).
- Demurrage: balance decays correctly, transfer applies decay to both parties, mint applies decay before adding.
- Access: unauthorized mint/burn reverts.
- Snapshot: values are correct after mints, burns, and decay.
- Edge: zero balances, max uint256, rounding errors, gas cost with many accounts.
- Fuzz: random sequences of mint/transfer/burn/checkpoint with demurrage assertions.

## Notes

- The global decay index approach is gas-efficient (O(1) per read) but requires careful fixed-point math to avoid precision loss over long periods.
- Reference: Circles UBI and Freicoin for demurrage implementation patterns.
- Consider storing demurrage-adjusted `totalSupply` or computing it lazily.
