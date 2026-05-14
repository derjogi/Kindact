---
status: planned
created: '2026-04-02'
tags: [cleanup, S7]
priority: low
---

# Remove Demurrage Evasion Scenario

> **Status**: planned · **Priority**: low · **Created**: 2026-04-02

## Overview

Demurrage is a protocol-level mechanism applied automatically to all on-chain balances. There is no evasion possible within the system. The "demurrage_evasion" scenario and associated event handling should be removed.

Addresses red-team feedback point S7.

## Plan

- [ ] Remove `demurrage_evasion` and `demurrage_evasion_end` event types from scenarios.py
- [ ] Remove `evasion_pct` parameter from `apply_demurrage` in mechanisms.py
- [ ] Remove `_demurrage_evasion_pct` param handling from update_agents
- [ ] Remove `demurrage_evasion` scenario from SCENARIOS dict
- [ ] Clean up any related tests

## Test

- [ ] All remaining scenarios still pass
- [ ] apply_demurrage no longer accepts evasion parameters

## Notes

- The only "evasion" is exiting the system entirely — which is modeled by the churn spec (004).
