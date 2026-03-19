---
status: complete
created: '2026-03-17'
tags:
  - token-economy
  - mvp
  - economics
priority: critical
created_at: '2026-03-17T11:07:53.207Z'
depends_on:
  - 010-verification-disputes
updated_at: '2026-03-17T11:08:20.305Z'
---

# $CC Token Ledger

> **Phase**: MVP · **Priority**: Critical · **Subsystem**: Token Economy

## Overview

$CC mint/burn/demurrage ledger, access fee burns, per-issue reward caps, clawback handling, and monthly monetary snapshots. This is the economic engine — every token is backed by verified work.

At MVP: reward caps are fixed per issue class (not voter-scaled) and token state is tracked in PostgreSQL. On-chain anchoring and the voter-scaled cap formula are deferred to Phase 2.

Note: $CC has effectively zero monetary value in early stages — that is expected and by design. The backing is the verified work itself.

## Design

### Economic Formulas

```
Supply:      S_{t+1} = (1 - d) · S_t + M_w - A - F
Equilibrium: S* = (M_w - A - F) / d
```

Where: d = demurrage rate (1%/mo), M_w = work minting, A = access fee burns, F = transaction fee burns

Reserve minting (M_r), Hypercert purchase burns (H), and redemption burns (X) are Phase 2 (specs 013, 014).

### Data Models

- **TokenAccount** — per-user token account
- **ScaledBalance** — balance adjusted for demurrage via global decay index
- **MintEvent** — work mint with source linkage (claim + report IDs)
- **BurnEvent** — access fee or transaction fee
- **DemurrageCheckpoint** — global decay index snapshots
- **RewardCap** — per-issue-class fixed reward cap (replaces voter-scaled formula at MVP)
- **NegativeLiability** — fraud clawback debt (netted against future rewards)
- **MonetarySnapshot** — monthly aggregate for supply audit

### API Surface

- `GET /ledger/accounts/:id` — account balance (demurrage-adjusted)
- `GET /ledger/supply` — current total supply and parameters
- `GET /ledger/snapshots/:period` — monthly monetary snapshot
- `POST /fees/charge` — charge and burn access fees
- `POST /rewards/mint` — mint $CC for verified work (called by spec 010)

### Key Rules

- Mint paths: ONLY `work_minting` (no pre-mine, no founder allocation, no reserve minting at MVP)
- Burn paths: `access_fees`, optional `tx_fees`
- Demurrage via global decay index — moving tokens does NOT avoid decay
- Issue reward cap at MVP: fixed maximum per issue class (e.g., local / national / global), set at platform level
- Negative liabilities tracked in PostgreSQL, netted against future rewards
- Monthly snapshots must satisfy supply equation

## Plan

- [ ] Design token account schema with global demurrage index
- [ ] Implement mint events (work minting only) with source linkage
- [ ] Implement burn events (access fees)
- [ ] Build demurrage: continuous decay via global index (no evasion by transfer)
- [ ] Implement fixed reward caps per issue class
- [ ] Build negative liability tracking and netting
- [ ] Implement monthly monetary snapshot generation

## Test

- [ ] Demurrage correctly reduces balances over time
- [ ] Token transfer does not avoid demurrage (global index approach)
- [ ] Reward caps enforce per-issue-class limits
- [ ] Monthly snapshots satisfy supply equation
- [ ] Only work_minting can create tokens at MVP
- [ ] Negative liability is correctly netted from future reward mints

## Notes

**Phase 2:** Switch to voter-scaled reward cap formula (more voters = higher cap). Add reserve minting (spec 013). Add Hypercert purchase burns (spec 014). Anchor token state on-chain.

**Open questions:**
- Initial fixed cap values per issue class (local / national / global)
- Whether transfer fees are off by default until abuse justifies activation
- Demurrage rate governance: fixed at launch or community-adjustable from start?
