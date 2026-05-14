---
status: planned
created: 2026-04-07
priority: high
tags:
- frontend
- ux
- voting
depends_on:
- 015-frontend
related:
- 007-voting-engine
- 009-delegation
- 029-decision-continuity
- 035-governance-data-visualization
- 036-anonymization-visual-language
- 037-motion-and-feedback
- 039-empty-loading-error-states
created_at: 2026-04-07T23:16:33.365798212Z
updated_at: 2026-04-07T23:16:33.365861936Z
---

# 021 — UI: Voting & Decisions

## Overview

Voting flow including eligibility gates, multiple voting engines, fluid vote management, delegation controls, and conviction visualization.

## Features

### Eligibility Gate
- **Knowledge quiz** — short true/false, multiple choice questions about the issue summary (tests understanding, NOT opinion)
- **Relevance / stakeholder check** — auto-admit if profile shows clear connection (location, field of work); brief stake explanation form for others
- **Metrics gate enforcement** — voting blocked until issue metrics are complete; only net-positive outcomes may proceed; gate verdict shown as auditable first-class UI element

### Voting Interface
- **Approval voting** (default) — always available as fallback
- **Alternative engines** — ranked-choice, score voting, quadratic voting, consensus decision mode (rendered according to issue's protocol binding)
- **Fluid / ongoing voting** — votes can be changed at any time; no permanent cutoff date
- **Live tally visualization** — real-time vote counts with result breakdown (bar charts, pie charts, or similar)

### Decision Continuity
- **Conviction accumulation display** — visual indicator (progress bar, timeline) showing how entrenched a decision is over time and how much harder reversals become
- **Reconsideration window indicator** — when/if a decision can be revisited

### Delegation (Liquid Democracy)
- **Delegate vote** — delegate per-topic to a trusted person from the voting screen
- **Delegation management panel** — see all current delegations organized by category
- **Instant revocation** — one-click take-back of delegated vote
- **Delegation chain transparency** — visualize how delegated votes flow through the network

### Reward Scaling
- **Voter-scaled reward caps** — display that small voter groups can only unlock proportionally small rewards
- **Asymmetric voting indicator** — make visible that objections reduce reward caps more than approvals increase them

## Design Notes

- Eligibility gate should feel quick and non-intimidating — 2-3 questions max
- Conviction visualization must clearly communicate "time strengthens decisions" without being confusing
- Delegation chain could be a simple directed graph or tree view

## Dependencies

- Voting engine (007)
- Delegation & conviction (009)
- Core metrics framework — gate logic (017)
