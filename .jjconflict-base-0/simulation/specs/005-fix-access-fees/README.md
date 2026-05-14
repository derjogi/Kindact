---
status: complete
created: '2026-04-02'
tags: [bugfix, S6]
priority: high
---

# Fix Access Fee Model

> **Status**: complete · **Priority**: high · **Created**: 2026-04-02

## Overview

The simulation currently charges every agent `min(balance, 5.0)` per month in access fees. Per the design, only ~5% of users should pay access fees (10 CC/month), not all users.

Addresses red-team feedback point S6.

## Design

### Changes

- Only a fraction of agents (`access_fee_fraction`, default 0.05) pay access fees each month
- Fee amount is 10 CC/month (not 5)
- Which agents pay is determined by: agents who use extended features. For simulation purposes, this can be modeled as the top N% of agents by activity_level (from spec 004), or simply a random 5% each month.

### Implementation

In `policies.py`, replace the per-agent `fee = min(agent.balance, 5.0)` with:

```python
pays_access_fee = rng.random() < params.get('access_fee_fraction', 0.05)
if pays_access_fee:
    fee = min(agent.balance, 10.0)
else:
    fee = 0.0
```

### Impact

This significantly reduces the burn rate. Current model burns ~5 CC × N_agents/month. New model burns ~10 CC × 0.05 × N_agents/month = ~0.5 CC × N_agents/month — roughly 10× less burn from access fees.

This will raise the supply equilibrium and make the system more dependent on other sinks (demurrage, redemptions, Hypercert burns).

## Plan

- [x] Add `access_fee_fraction` param (default 0.05) and `access_fee_amount` param (default 10.0) to scenario defaults
- [x] Update all agent type blocks in policies.py to use probabilistic fee
- [x] Add sliders to dashboard
- [x] Update Phase 1/2/3 worked examples in economics docs if needed

## Test

- [x] Only ~5% of agents pay fees per month (within statistical bounds)
- [x] Fee amount is 10 CC when paid
- [x] Total access fee burn is ~10× lower than before
- [x] Supply equilibrium rises accordingly

## Notes

- Small change, big impact on supply dynamics. Should be implemented early to re-baseline all scenarios.
