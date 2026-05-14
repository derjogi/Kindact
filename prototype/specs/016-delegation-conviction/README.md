---
status: planned
created: '2026-03-17'
tags:
  - decision-making
  - later
  - liquid-democracy
priority: medium
created_at: '2026-03-17T11:08:04.515Z'
depends_on:
  - 008-voting-engine
updated_at: '2026-03-17T11:08:28.823Z'
---

# Delegation & Conviction

> **Phase**: Later · **Priority**: Medium · **Subsystem**: Decision Making

## Overview

Topic-scoped liquid democracy delegation with automatic expiry, delegate notifications, concentration caps, and conviction accumulation that makes established decisions progressively harder to reverse. Balances expertise utilization with power diffusion.

## Design

### Data Models

- **Delegation** — delegator → delegate binding with scope + expiry
- **DelegationScope** — topic/tag filter for which votes are delegated
- **DelegateNotification** — alert sent when delegate casts a vote
- **ConvictionScore** — per-issue accumulated conviction over time
- **ReversalPolicy** — conviction-adjusted threshold for reversal attempts

### API Surface

- `POST /delegations` — create delegation with scope and expiry
- `DELETE /delegations/:id` — revoke delegation (instant)
- `GET /delegates/:id/impact` — delegate's accumulated influence
- `GET /issues/:id/conviction` — current conviction score

### Key Rules

- Delegations are topic/scope-scoped (environment, technology, local, etc.)
- Always revocable instantly
- Auto-expire unless renewed (prevents zombie delegations)
- Concentration cap: max delegated votes per delegate (prevents single point of power)
- Conviction accrues while approval stays above threshold and no blocking dispute exists
- Reversal threshold rises as conviction rises (stability increases over time)
- New claims pause if reversal motion enters contested state

## Plan

- [ ] Design delegation schema with topic/scope scoping
- [ ] Implement delegation creation, revocation, and auto-expiry
- [ ] Build delegate notification system (on vote cast)
- [ ] Implement concentration cap enforcement
- [ ] Design conviction accumulation formula
- [ ] Build conviction score tracking per issue
- [ ] Implement conviction-adjusted reversal thresholds

## Test

- [ ] Delegations correctly scope to specified topics
- [ ] Delegation revocation is instant and reflected in tallies
- [ ] Expired delegations auto-remove from vote tallies
- [ ] Concentration cap prevents excessive delegation to one person
- [ ] Conviction score increases over time for stable decisions
- [ ] Reversal requires higher threshold as conviction grows

## Notes

**Open questions:**
- Default expiry window for delegations (30 days? 90 days?)
- Exact conviction formula and reversal margin curve
- Whether delegators see a preview of how their delegate voted before notification
