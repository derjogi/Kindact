---
status: complete
created: '2026-04-02'
tags: [realism, hypercerts, C2]
priority: high
---

# Hypercert Bootstrapping Curve

> **Status**: complete · **Priority**: high · **Created**: 2026-04-02

## Overview

The current simulation uses a flat `hypercert_avg_price` parameter (default $1,000) for all Hypercert sales regardless of platform maturity. In reality, early Hypercerts should be nearly unsellable, and when they do sell, prices should be low — growing as the platform builds credibility.

Addresses red-team feedback point C2: early months should have near-zero sales at low prices, ramping up over time.

## Design

### Price Curve

Replace the flat `hypercert_avg_price` with a maturity-dependent price:

```python
track_record = sold_count / (sold_count + 10)  # existing sigmoid
months_active = timestep
maturity_factor = min(1.0, (months_active / 24) ** 0.5)  # slow ramp over ~2 years

base_price = hypercert_min_price + (hypercert_max_price - hypercert_min_price) * track_record * maturity_factor
sale_price = base_price * rng.uniform(0.7, 1.3)  # variance per sale
```

New params: `hypercert_min_price` (default: $100), `hypercert_max_price` (default: $2,000).

### Sale Probability Adjustment

The existing `platform_attractiveness` formula already suppresses early sales via `track_record`. But it should also have a hard floor for the first ~5 months:

```python
if timestep < 5:
    sale_prob = 0.0  # no external buyers yet — no track record
else:
    sale_prob = base_sale_prob * platform_attractiveness
```

### Dashboard

Add price-over-time chart showing realized Hypercert sale prices to visualize the bootstrapping curve.

## Plan

- [x] Add `hypercert_min_price` and `hypercert_max_price` to scenario params (replace single `hypercert_avg_price`)
- [x] Implement maturity-dependent price curve in policies.py Hypercert sales section
- [x] Add hard zero-sales floor for first N months (configurable, default 5)
- [x] Add per-sale price variance
- [x] Add dashboard sliders for min/max price and zero-sales months
- [x] Add realized Hypercert price chart to dashboard

## Test

- [x] No Hypercerts sell in months 0–4 (default config)
- [x] Early sales (months 5–12) average significantly below $500
- [x] Late sales (months 24+) approach hypercert_max_price as track record builds
- [x] Price variance produces realistic spread, not uniform prices

## Notes

- The existing `platform_attractiveness` sigmoid is good; this spec layers price dynamics on top without replacing it.
