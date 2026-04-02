---
status: planned
created: '2026-04-02'
tags: [realism, agents, M12]
priority: low
---

# Smarter Speculator Behavior

> **Status**: planned · **Priority**: low · **Created**: 2026-04-02

## Overview

Current speculator behavior is naive: buy when `confidence > 0.6 and exchange_rate < 0.8 and appreciation > demurrage * 3`. Real speculators consider liquidity, market depth, and opportunity cost.

Addresses red-team feedback point M12.

## Design

### Additional Decision Factors

1. **Liquidity check**: Can I actually sell? Speculators should be reluctant to buy when the reserve is small relative to their position.
   ```python
   liquidity_score = min(1.0, reserve / (agent.balance * exchange_rate + 1000))
   ```

2. **Opportunity cost**: Compare $CC expected return to a risk-free rate (e.g., 4% annual ≈ 0.33% monthly).
   ```python
   risk_free_monthly = 0.0033
   cc_expected_monthly = expected_appreciation / hold_horizon - demurrage
   excess_return = cc_expected_monthly - risk_free_monthly
   ```

3. **Position sizing**: Don't bet everything. Buy amount should scale with excess return and liquidity, not just confidence.
   ```python
   buy_fiat = max_position * excess_return * liquidity_score * confidence
   ```

4. **Sell pressure**: Speculators should sell more aggressively when $CC is *above* fair value (exchange_rate > 0.9 and rising → take profit), not just when confidence is low.

### Net Effect

Speculators become less uniformly bullish. They provide less support during bootstrap (low liquidity), more realistic buying during growth, and take-profit selling near maturity. This is less flattering but more honest.

## Plan

- [ ] Add liquidity_score computation to speculator decision block
- [ ] Add opportunity cost comparison (risk_free_rate param)
- [ ] Implement position-sizing logic
- [ ] Add take-profit selling when exchange_rate is high
- [ ] Add `risk_free_rate` to scenario params (default 0.0033)
- [ ] Update tests for new speculator behavior

## Test

- [ ] Speculators buy less when reserve is very small (low liquidity)
- [ ] Speculators don't buy when expected return < risk-free rate + demurrage
- [ ] Speculators sell (take profit) when exchange rate is near $1
- [ ] Net speculator impact is less uniformly positive than current model

## Notes

- This makes the simulation more pessimistic about speculator support, which is the honest direction.
