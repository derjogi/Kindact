---
status: planned
created: '2026-04-02'
tags: [realism, confidence, M10]
priority: medium
---

# Exogenous Perception Shocks

> **Status**: planned · **Priority**: medium · **Created**: 2026-04-02

## Overview

The confidence model only uses endogenous signals (exchange rate trend, redemption success, holding time). Real-world confidence is affected by external events: media coverage, fraud scandals, government endorsements, competitor launches, etc.

Add a `platform_perception` variable that randomly fluctuates and feeds into the confidence function, with mean-reversion ensuring negative events don't permanently cripple the system.

Addresses red-team feedback point M10.

## Design

### Perception Variable

New state variable `platform_perception: float` (range -1.0 to 1.0, starts at 0.0 = neutral).

Each timestep:
```python
# Random shock: small perturbations most months, occasional large ones
shock = rng.normal(0, 0.1)  # small random noise
if rng.random() < 0.05:     # 5% chance of major event per month
    shock += rng.choice([-0.5, -0.3, 0.3, 0.5])  # big positive or negative

# Mean reversion: decay toward 0 with half-life of ~1 month
perception = perception * 0.6 + shock
perception = clamp(-1.0, 1.0, perception)
```

This guarantees that even a -0.5 shock returns to near-neutral within ~2 months (0.6^2 = 0.36, so a -0.5 becomes -0.18 after 2 months plus noise).

### Integration with Confidence

Add `platform_perception` as a new signal in `update_confidence`:

```python
w_perception = 0.2  # take weight from existing signals proportionally
perception_signal = platform_perception  # already in [-1, 1]
```

Rebalance existing weights: trend 0.25, redemption 0.3, holding 0.1, inertia 0.15, perception 0.2.

### Dashboard

- Add perception timeline chart
- Mark major shock events on the exchange rate chart

## Plan

- [ ] Add `platform_perception` to genesis state (initial: 0.0)
- [ ] Add `update_perception` mechanism function
- [ ] Wire into partial_state_update_blocks
- [ ] Add perception_signal to confidence.py update_confidence
- [ ] Rebalance confidence weights
- [ ] Add perception chart to dashboard
- [ ] Add configurable shock parameters (frequency, magnitude) to params

## Test

- [ ] Perception mean-reverts to near-zero within 2-3 months after a shock
- [ ] Negative perception shock temporarily reduces average agent confidence
- [ ] Large negative shock can trigger panicking in susceptible agents
- [ ] Perception shocks add realistic volatility to exchange rate trajectory
- [ ] Over long runs, perception averages near zero

## Notes

- This is a lightweight way to model "the world happening" without needing a full governance simulation.
- The 2-month mean-reversion reflects the assumption that the platform can adapt to crises relatively quickly.
