---
status: planned
created: '2026-03-27'
tags: []
priority: medium
created_at: '2026-03-27T08:09:55.536920592+00:00'
---

# Kindact Economic Simulation

> **Status**: planned · **Priority**: medium · **Created**: 2026-03-27

## Overview

Hybrid ABM + Monte Carlo simulation of Kindact's two-asset economy ($CC + Hypercerts). Models individual agents with heterogeneous behaviors and confidence dynamics, so emergent phenomena (bank runs, bootstrap failure) arise naturally rather than being scripted.

**Primary scenario:** The bootstrap problem — when cash-outs unlock after Phase 1, do users drain the reserve faster than Hypercert sales fill it?

**Scale:** 50 initial users, 3-year horizon (36 monthly timesteps), organic growth.

**Stack:** cadCAD + Streamlit + NumPy + Plotly/Altair, Python 3.11+

## Design

### State Variables

| Variable | Type | Description |
|---|---|---|
| `supply` | float | Total circulating $CC |
| `reserve_fiat` | float | USD in the reserve |
| `exchange_rate` | float | $CC→USD rate via confidence curve |
| `phase` | enum | bootstrap / growth / maturity |
| `agents` | list | Agent objects with wallets, type, behavior |
| `hypercert_portfolio` | list | Unsold Hypercerts with estimated value |
| `total_minted` | float | Cumulative $CC minted (Phase 1→2 at 100k) |
| `demurrage_rate` | float | Monthly decay on all balances (default 0.01) |
| `redemption_queue` | list | Agents waiting when reserve floor hit |

Derived: backing ratio, phase transitions, daily redemption cap, exchange rate formula `E_t = b_t + (1 - b_t) * (R_t / R_target)^2`.

### Agent Types

| Type | Behavior |
|---|---|
| **Contributor** | Completes issues, earns $CC, spends on access fees + local goods |
| **Merchant** | Accepts $CC at discount, periodically redeems to fiat (leaky bucket) |
| **Speculator** | Buys $CC when rising, redeems when confidence drops |
| **Impact Buyer** | External; purchases Hypercerts for fiat at scenario-driven intervals |
| **Fraudster** | Attempts fake verification; penalized if caught |
| **Panicker** | Starts as Contributor/Merchant, switches to cash-out when confidence < threshold |

### Confidence Mechanic

Every agent has a `confidence` score influenced by: exchange rate trend, successful/failed redemptions by others (contagious), time holding $CC. Panics emerge from confidence contagion.

### Scenarios & Events

Base parameters (all adjustable): initial users, growth rate, issues/user/month, reward/issue, demurrage rate, Hypercert sale probability & price, verification quality.

Events injectable at specific months:

| Event | Effect |
|---|---|
| `hypercert_crash` | Impact buyer frequency → near-zero for N months |
| `bank_run` | Confidence shock: X% of agents hit panic threshold |
| `fraud_wave` | Increase fraudsters or lower verification quality |
| `whale_dump` | One agent accumulates Y% of supply, redeems all |
| `growth_spike` | Growth rate × X for N months |
| `stagnation` | Issue rate drops, no new users |
| `demurrage_evasion` | Agents circular-transfer to avoid demurrage |

Monte Carlo: each scenario runs N times (default 500) with randomized agent thresholds and timing → probability distributions.

### Dashboard (Streamlit)

**Sidebar:** preset scenario dropdown, parameter sliders, event timeline editor, Monte Carlo toggle, Run button.

**Charts:** supply & reserve (dual axis), exchange rate with phase markers, backing ratio with 5% danger line, agent population by type, confidence histogram, redemption queue depth.

**Event log:** phase transitions, reserve floor hits, recoveries. Monte Carlo shows median + 10th–90th percentile bands.

## Plan

- [ ] Project scaffolding (Python project, deps, cadCAD config)
- [ ] Implement state variables and update functions
- [ ] Implement agent types and confidence mechanic
- [ ] Implement scenario/event system
- [ ] Build Streamlit dashboard
- [ ] Bootstrap scenario end-to-end test
- [ ] Add remaining scenarios and Monte Carlo layer

## Test

- [ ] Supply equation converges to expected equilibrium with constant params
- [ ] Phase transitions trigger at correct thresholds
- [ ] Exchange rate matches formula for known reserve/supply values
- [ ] Demurrage reduces all balances correctly each timestep
- [ ] Bootstrap scenario: reserve survives vs. drains under varied conditions
- [ ] Bank run: daily cap and reserve floor prevent full drain

## Notes

- Economics formulas sourced from Kindact_Economics.md
- cadCAD chosen over Mesa for native tokenomics support
- Reserve mechanics (USD-denominated) handled as standard cadCAD state variables
