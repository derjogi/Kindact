---
status: planned
created: '2026-03-17'
tags:
  - economics
  - later
  - hypercerts
priority: medium
created_at: '2026-03-17T11:08:03.682Z'
depends_on:
  - 009-work-reports-evidence
  - 010-verification-disputes
  - 011-cc-ledger
  - 013-reserve-exchange
updated_at: '2026-03-17T11:08:28.010Z'
---

# Hypercerts Marketplace

> **Phase**: Later · **Priority**: Medium · **Subsystem**: Impact Economics

## Overview

Hypercert generation on verified work completion, platform treasury ownership, listing/sale/retirement flows, fiat and $CC purchase paths, and reserve integration. Hypercerts are the bridge between community impact and external economic value.

## Design

### Data Models

- **Hypercert** — on-chain impact credential token (ERC-1155 compatible)
- **HypercertMetadata** — linked issue, reports, evidence, metrics, verification record
- **TreasuryHolding** — platform-owned Hypercert inventory
- **Listing** — marketplace listing with price/terms
- **Sale** — completed purchase record (fiat or $CC)
- **Retirement** — one-time claim retirement (e.g., carbon offset used)

### API Surface

- `POST /issues/:id/hypercerts/generate` — generate Hypercert from verified completion
- `GET /hypercerts` — browse marketplace listings
- `POST /hypercerts/:id/list` — list Hypercert for sale
- `POST /hypercerts/:id/purchase` — purchase (fiat → reserve inflow; $CC → burn)
- `POST /hypercerts/:id/retire` — retire claim (one-time, irreversible)

### Key Rules

- Hypercert metadata links to full provenance: issue, reports, evidence, metrics, verification
- Platform treasury owns new Hypercerts by default
- $CC purchases BURN the received tokens (deflationary pressure)
- Fiat purchases flow into reserve (deepens backing)
- Lifecycle: `draft` → `listed` → `sold` → `retired`
- Platform does NOT promise treasury buyback

### Value Cycle

More verified work → more Hypercerts → external sales → deeper reserve → more stable $CC → more contributors → more work

## Plan

- [ ] Design Hypercert schema compatible with Hypercerts protocol
- [ ] Build auto-generation pipeline from verified completed issues
- [ ] Implement metadata linking (issue + reports + evidence + verification)
- [ ] Build treasury management for platform-owned certs
- [ ] Implement marketplace listing/browsing
- [ ] Build purchase flows (fiat → reserve; $CC → burn)
- [ ] Implement retirement flow (one-time, irreversible)
- [ ] Integrate with reserve-exchange spec for inflows

## Test

- [ ] Hypercerts auto-generate on issue completion + verification
- [ ] Metadata correctly links to full provenance chain
- [ ] $CC purchases burn tokens
- [ ] Fiat purchases create reserve inflow
- [ ] Retired Hypercerts cannot be re-sold

## Notes

**Open questions:**
- Fractionalization at launch or later?
- Fixed-price listings first vs auction support?
- Integration with existing Hypercerts protocol standards
