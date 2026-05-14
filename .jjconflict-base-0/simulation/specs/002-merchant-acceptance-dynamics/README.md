---
status: complete
created: '2026-04-02'
tags: [realism, agents, C1]
priority: high
---

# Merchant Acceptance Dynamics

> **Status**: complete · **Priority**: high · **Created**: 2026-04-02

## Overview

Currently merchants are a fixed agent type with hardcoded behavior: they receive random trade income and periodically redeem. In reality, merchant *willingness to accept $CC* is the critical adoption question and should emerge from agent-level dynamics.

Addresses red-team feedback point C1: "Is there variability in how many merchants there are, and how willing actors are to accept CC?"

## Design

### Agent-Level Changes

Add to all agents (not just merchants):
- `intrinsic_motivation: float` — baseline willingness to participate for non-monetary reasons (community values, coordination utility). Drawn from a distribution at creation, higher for early adopters, lower for later joiners.
- `acceptance_willingness: float` — computed each timestep, determines how much $CC trade the agent engages in.

### Acceptance Willingness Formula

```
acceptance_willingness = clamp(0, 1,
    w_intrinsic * intrinsic_motivation
  + w_exchange * exchange_rate_signal      # higher rate → more willing
  + w_network  * merchant_density_signal   # more merchants accepting → more willing (network effect)
  + w_confidence * confidence              # personal confidence in $CC
)
```

Where `merchant_density_signal = n_accepting / n_agents` — the fraction of agents currently willing to accept $CC creates a self-reinforcing adoption curve.

### Behavioral Impact

- Merchant trade income should scale with `acceptance_willingness` rather than being a flat random draw
- Contributors' willingness to *do work for $CC* should also use this (weighted more toward intrinsic_motivation in Phase 1)
- Early adopters (low start_id) get higher intrinsic_motivation; later joiners get lower values unless the exchange rate is attractive

### Intrinsic Motivation Distribution

- Phase 1 joiners: `Beta(5, 2)` → skewed high (idealists)
- Phase 2 joiners: `Beta(3, 3)` → mixed
- Phase 3+ joiners: `Beta(2, 4)` → skewed low (need monetary incentive)

This creates the realistic pattern: early community is held together by values, later growth requires real value.

## Plan

- [x] Add `intrinsic_motivation` field to Agent dataclass
- [x] Add `acceptance_willingness` field to Agent, computed each timestep in update_agents
- [x] Modify merchant trade income to scale with acceptance_willingness
- [x] Modify contributor work decision to factor in acceptance_willingness (very low willingness → agent doesn't do issues that month)
- [x] Make intrinsic_motivation distribution shift with platform phase / join time
- [x] Add `merchant_density_signal` computation
- [x] Wire acceptance_willingness weights into AgentConfig for tunability
- [x] Update dashboard to show acceptance_willingness distribution chart

## Test

- [x] Early-phase agents have higher intrinsic_motivation on average
- [x] Acceptance willingness rises with exchange rate and merchant density
- [x] With zero exchange rate and zero merchant density, only high-intrinsic agents participate
- [x] Network effect creates S-curve adoption pattern in acceptance over time

## Notes

- Connects to C3 (intrinsic platform value) — intrinsic_motivation captures the coordination value independent of $CC monetary worth.
- The merchant_density_signal creates a tipping-point dynamic that mirrors real community currency adoption patterns.
