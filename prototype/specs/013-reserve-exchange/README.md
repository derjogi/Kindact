---
status: planned
created: '2026-03-17'
tags:
  - economics
  - later
  - reserve
priority: medium
created_at: '2026-03-17T11:08:03.262Z'
depends_on:
  - 011-cc-ledger
  - 012-fraud-risk-engine
updated_at: '2026-03-17T11:08:27.611Z'
---

# Reserve & Exchange

> **Phase**: Later · **Priority**: Medium · **Subsystem**: Economics

## Overview

Fiat reserve accounting, buy/redeem flow, 3-phase exchange behavior (bootstrap → growth → maturity), premiums, daily redemption cap, reserve floor, and public reserve snapshots. Converts $CC from a social token into a fiat-backed medium of exchange.

## Design

### Economic Formulas

```
Exchange rate: E_t = b_t + (1 - b_t) · (R_t / R_target)²
Buy price:     E_buy = E_t × (1 + premium)    [default premium: 3%]
Reserve:       R_{t+1} = R_t + E_buy · M_r + V_h$ - E_t · X
Backing ratio: b_t = R_t / S_t
```

### Three Phases

| Phase | Condition | Behavior |
|---|---|---|
| Bootstrap | S_t < 100,000 CC | No redemptions; internal circulation only |
| Growth | R_t < R_target ($1M) | Redemptions enabled; confidence curve pricing |
| Maturity | R_t ≥ R_target | Exchange rate reaches $1; reverts if reserve drops |

### Flow Controls

- Daily redemption cap: 1% of current reserve per 24h
- Reserve floor: if b_t < 5%, redemptions pause and queue
- Queued tokens still subject to demurrage (reduces backlog naturally)

### Data Models

- **ReserveSnapshot** — point-in-time reserve state
- **ExchangeQuote** — computed quote with formula inputs
- **ReservePolicy** — phase rules, caps, floor thresholds
- **RedemptionRequest** — queued sell with status
- **FiatSettlement** — external fiat movement record
- **HypercertReserveInflow** — Hypercert sale → reserve linkage

### API Surface

- `GET /reserve/status` — current reserve state, phase, and backing ratio
- `GET /reserve/quote?side=buy|sell` — compute exchange quote
- `POST /reserve/buy` — buy $CC with fiat
- `POST /reserve/redeem` — redeem $CC for fiat
- `POST /reserve/hypercert-inflow` — record Hypercert sale proceeds

## Plan

- [ ] Design reserve state tracking and phase detection
- [ ] Implement confidence curve exchange rate calculation
- [ ] Build buy flow (fiat → reserve → mint $CC)
- [ ] Build redeem flow ($CC → burn → fiat from reserve)
- [ ] Implement daily redemption cap enforcement
- [ ] Implement reserve floor pause with queue
- [ ] Build public reserve snapshot endpoint
- [ ] Integrate Hypercert sale → reserve inflow pipeline

## Test

- [ ] Bootstrap phase blocks all redemptions
- [ ] Exchange rate follows confidence curve formula
- [ ] Daily redemption cap prevents reserve drain
- [ ] Reserve floor triggers redemption pause
- [ ] Buy premium correctly adds to reserve

## Notes

**Open questions:**
- Custody/legal jurisdiction for fiat reserve
- Whether reserve should be pre-seeded before public launch
- Integration with specific payment processors
