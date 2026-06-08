---
status: complete
created: 2026-06-08
priority: medium
created_at: 2026-06-08T11:15:58.029175548Z
updated_at: 2026-06-08T11:21:31.301350534Z
completed_at: 2026-06-08T11:21:31.301350534Z
transitions:
- status: in-progress
  at: 2026-06-08T11:16:26.479880769Z
- status: complete
  at: 2026-06-08T11:21:31.301350534Z
---

# Fix Supply And Monte Carlo Bugs

> **Status**: planned · **Priority**: medium · **Created**: 2026-06-08

## Overview

Code review found three implementation bugs that corrupt the simulation
mechanics (independent of the modeling-validity gaps in
`simulation-feedback.md`).

1. **Speculator purchases mint CC that never enters `supply`.** In
   `policies.py`, a speculator buy credits `cc_received` to the agent wallet and
   adds fiat to the reserve, but never returns `reserve_mint_cc` — the field
   `update_supply` expects. Result: `supply` is understated (Σ agent balances
   reached ~2× `supply` by month 36), which inflates `exchange_rate` and the
   backing ratio (the core reserve-pricing thesis).

2. **Monte Carlo runs are identical.** The rng is created once from a fixed seed
   in `config.py`; cadCAD re-seeds every run identically, so `n_runs>1` produces
   byte-for-byte identical runs. The dashboard's 10–90% quantile confidence
   bands are therefore zero-width / meaningless.

3. **Redemption cap units mismatch.** `daily_redeem_cap = 0.01 * reserve` (fiat)
   is compared against `redemptions` accumulated in CC. The cap should be
   CC-denominated.

## Design

1. **Supply minting** — Return `reserve_mint_cc` from `agent_decisions`
   (sum of all `cc_received` from speculator buys). `update_supply` already adds
   `reserve_mint_cc`. This keeps `supply ≈ Σ balances` and feeds the correct
   supply into `compute_exchange_rate`.

2. **Per-run seeding** — Derive a distinct seed per cadCAD run. cadCAD exposes
   the run index via the `subset`/run number in the policy/mechanism `**kwargs`
   (`_run`/`run`). Build the rng from `seed + run_index` so each run is an
   independent stream while staying reproducible. Implement by deferring rng
   creation to first use inside the run, keyed on the run index.

3. **Redemption cap units** — Convert the cap to CC:
   `daily_redeem_cap = 0.01 * reserve / exchange_rate` (guard rate>0). When the
   exchange is closed, redemptions are already blocked, so no divide-by-zero.

## Plan

- [x] Fix #1: return `reserve_mint_cc` from `agent_decisions` (policies.py)
- [x] Fix #2: per-run rng seeding so Monte Carlo runs differ (config.py + policies.py `_get_run_rng`)
- [x] Fix #3: CC-denominated redemption cap (policies.py)
- [x] Add/adjust tests for the supply invariant and MC variance

## Test

- [x] `supply ≈ Σ agent balances` — drift fell from 97.5% to 1.8% (within 5% tolerance)
- [x] `n_runs=3` yields non-identical per-run final supply (340254, 277149, 381575)
- [x] Existing test suite still passes (85 passed; updated 2 cap-dependent tests)

## Outcome

- Before fix #1: by month 36 agents held ~2× the recorded `supply`, inflating
  `exchange_rate`/backing. After: supply tracks balances within ~1.8%.
- Before fix #2: `n_runs>1` produced byte-for-byte identical runs (zero-width
  confidence bands). After: runs are independent reproducible streams.
- `test_policies.py` cap tests asserted the old (buggy) fiat-as-CC cap value;
  updated balances/comments to the corrected CC cap
  (`0.01 * reserve / exchange_rate`).

## Notes

The whale-dump balance-invariant gap and the demurrage-ordering clamp drift are
left as separate, lower-priority items.
