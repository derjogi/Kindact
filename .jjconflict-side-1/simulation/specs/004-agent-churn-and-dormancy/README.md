---
status: complete
created: '2026-04-02'
tags: [realism, agents, S4]
priority: high
---

# Agent Churn and Dormancy

> **Status**: complete · **Priority**: high · **Created**: 2026-04-02

## Overview

Agents never leave the simulation. In reality, churn is the #1 killer of community currencies. People who earn worthless tokens for months will stop participating.

Addresses red-team feedback point S4.

## Design

### Agent States

Add `activity_level: float` (0.0 = dormant, 1.0 = fully active) to Agent. This replaces the binary active/inactive.

Each timestep, activity_level is updated:

```python
activity_delta = (
    w_conf * (confidence - 0.5)        # confident → more active
  + w_earn * earned_this_month_signal   # earning something → stay active
  + w_intrinsic * intrinsic_motivation  # values-driven staying power
  + w_inertia * (activity_level - 0.5)  # momentum
)
activity_level = clamp(0.0, 1.0, activity_level + activity_delta * 0.1)
```

### Behavioral Impact

- Agents with `activity_level < 0.1` become **dormant**: no issues, no fees, no trade. Their balance still decays via demurrage.
- Agents with `activity_level < 0.05` for 3+ consecutive months **exit**: removed from the agent list entirely.
- An agent's contribution rate (issues completed, trade volume) scales linearly with `activity_level`.

### Exit Effects

When an agent exits:
- Their remaining balance is effectively burned (tokens still exist in supply but decay to zero with no activity)
- Or: balance is zeroed and removed from supply (simpler, and the amounts will be tiny due to demurrage)
- They are removed from the agent count

### Dashboard

- Show churn rate (exits per month) and dormancy rate
- Show active vs. dormant vs. exited agent counts over time

## Plan

- [x] Add `activity_level` field to Agent (default 1.0)
- [x] Add `months_dormant` counter to Agent
- [x] Implement activity_level update in update_agents
- [x] Scale all agent behaviors (issues, trade, fees) by activity_level
- [x] Implement dormancy threshold (activity < 0.1 → no actions)
- [x] Implement exit condition (dormant 3+ months → removed)
- [x] Handle exited agent balances in supply accounting
- [x] Add churn/dormancy metrics to DataFrame extraction in run.py
- [x] Add churn chart to dashboard

## Test

- [x] Agents with sustained low confidence become dormant
- [x] Dormant agents still lose balance to demurrage
- [x] Agents dormant for 3+ months exit the simulation
- [x] High intrinsic_motivation agents resist going dormant even with low exchange rate
- [x] Churn rate is visible and nonzero in bootstrap scenario

## Notes

- Depends on spec 002 (intrinsic_motivation field).
- This will likely make the bootstrap scenario look worse — which is the point. The sim should show how hard bootstrapping actually is.
