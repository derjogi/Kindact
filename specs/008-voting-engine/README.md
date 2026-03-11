---
status: planned
created: '2026-03-17'
tags:
  - decision-making
  - mvp
  - core-loop
priority: high
created_at: '2026-03-17T11:07:52.021Z'
depends_on:
  - 003-human-verification
  - 007-metrics-eligibility
updated_at: '2026-03-17T11:08:19.164Z'
---

# Voting Engine

> **Phase**: MVP · **Priority**: High · **Subsystem**: Decision Making

## Overview

Ongoing one-person-one-vote approval voting with live tally, configurable threshold policies, observation windows before adoption, and pause/resume behavior if support drops post-adoption. Votes are fluid — changeable at any time.

## Design

### Data Models

- **VoteRecord** — current vote + full history per human_id per issue
- **DecisionMode** — `approval` (MVP), `consensus`, `ranked-choice` (later via module registry)
- **DecisionState** — current state: `open`, `adopted`, `paused`, `reversed`
- **ThresholdPolicy** — approval percentage + quorum rules
- **ObservationWindow** — time period threshold must hold continuously before adoption

### API Surface

- `POST /issues/:id/votes` — cast or change vote
- `GET /issues/:id/tally` — current vote counts and percentages
- `GET /issues/:id/decision-state` — adoption state with conviction info
- `GET /issues/:id/vote-history` — auditable vote history

### Key Rules

- One active vote per `human_id` per issue per decision mode
- Default mode at MVP: `approval` with ~80% threshold
- Proposal enters `adopted` when threshold + quorum hold through observation window
- If support falls below threshold after adoption, new implementation claims pause
- Full vote history is auditable even though only current vote counts
- Votes are keyed by human_id (from spec 003), not wallet address

## Plan

- [ ] Design vote record schema with change history
- [ ] Implement approval voting with live tally computation
- [ ] Build threshold policy engine (configurable per issue class)
- [ ] Implement observation window logic before adoption
- [ ] Build post-adoption monitoring: pause claims if support drops
- [ ] Implement decision state machine (open → adopted → paused → reversed)
- [ ] Build vote history audit endpoint

## Test

- [ ] One vote per human_id enforced (cannot double-vote)
- [ ] Vote changes are tracked in history
- [ ] Adoption requires threshold held through full observation window
- [ ] Claims pause when support drops below threshold
- [ ] Tally recomputes correctly after vote changes

## Notes

**Open questions:**
- Initial default approval threshold: 80% vs issue-class overrides?
- Quorum scaling: affected population, active users, or total verified users?
- Observation window duration: fixed or issue-class dependent?
