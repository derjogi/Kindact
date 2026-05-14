---
status: planned
created: '2026-04-02'
tags: [realism, fairness, S8]
priority: medium
---

# Redemption Pool (Pro-Rata Distribution)

> **Status**: planned · **Priority**: medium · **Created**: 2026-04-02

## Overview

Currently, agents are processed sequentially in list order when redeeming. Agents earlier in the list consume the daily cap; later agents get nothing. This is unfair and unrealistic.

Replace with a pool model: all agents declare desired redemptions, then the available cap is distributed pro-rata.

Addresses red-team feedback point S8.

## Design

### Two-Pass Approach

**Pass 1** (in agent_decisions): Collect all desired redemptions into a list of `(agent_id, desired_amount)`. Do NOT subtract from balances yet.

**Pass 2** (new helper or at end of policy): 
```python
total_desired = sum(desired for _, desired in redemption_requests)
monthly_cap = 0.30 * reserve  # 1% daily × ~30 days
if total_desired <= monthly_cap:
    # Everyone gets what they want
    actual = {aid: desired for aid, desired in redemption_requests}
else:
    # Pro-rata: everyone gets the same fraction
    ratio = monthly_cap / total_desired
    actual = {aid: desired * ratio for aid, desired in redemption_requests}
```

Each agent's balance update then uses their actual redemption amount.

### Redemption Queue

Unfulfilled amounts (the portion not redeemed) go into the redemption_queue as before, but now tracked per-agent so they get priority in the next month (optional: simple FIFO queue vs. continuous pro-rata).

## Plan

- [ ] Refactor agent_decisions to collect redemption requests in pass 1 (no immediate deduction)
- [ ] Implement pro-rata distribution after all agents have declared
- [ ] Update agent_updates with actual redemption amounts
- [ ] Adjust daily_redeem_cap → monthly equivalent (0.30 * reserve)
- [ ] Update redemption_queue to track pro-rata shortfalls
- [ ] Update tests

## Test

- [ ] When total desired < cap, all agents get full redemption
- [ ] When total desired > cap, all agents get proportionally reduced amounts
- [ ] No agent gets zero while another gets full amount (the old bug)
- [ ] Bank run scenario: cap is distributed evenly across many panicking agents

## Notes

- This is a structural fix that makes bank-run dynamics more realistic: everyone gets a haircut, rather than some getting 100% and others 0%.
