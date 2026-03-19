---
status: planned
implementation_note: 'Schema created (VerificationReview, DisputeCase). Service and API routes not yet created.'
created: '2026-03-17'
tags:
  - verification
  - mvp
  - core-loop
priority: high
created_at: '2026-03-17T11:07:52.827Z'
depends_on:
  - 009-work-reports-evidence
updated_at: '2026-03-17T11:08:34.661Z'
related:
  - 012-fraud-risk-engine
---

# Verification & Disputes

> **Phase**: MVP · **Priority**: High · **Subsystem**: Verification

## Overview

Verifier assignment and rotation, evidence review, basic automated consistency checks, reward holdback pending verification, dispute resolution, penalties, and fraud clawback. Ensures that only genuinely completed work generates $CC — making verification quality the foundation of monetary integrity.

At MVP: verification is peer-based (human reviewers checking evidence). Automated AI media analysis and AI-generated evidence detection are deferred to Phase 2.

## Design

### Data Models

- **VerificationAssignment** — verifier ↔ claim binding with rotation tracking
- **VerificationReview** — approve/reject/request-changes with rationale
- **EvidenceCheck** — automated consistency check result (duplicate hash, metadata)
- **DisputeCase** — formal dispute with challenger deposit
- **DisputeVote** — community vote on dispute outcome
- **PenaltyAction** — clawback, negative balance, or restriction
- **CooldownState** — per-user accusation cooldown with exponential escalation

### API Surface

- `POST /claims/:id/verify` — submit verification review
- `POST /claims/:id/disputes` — raise dispute with deposit
- `POST /disputes/:id/votes` — vote on dispute outcome
- `POST /disputes/:id/resolve` — resolve dispute with outcome
- `GET /claims/:id/verification` — verification status and history

### Key Rules

- Claims above a reward threshold require multiple verifiers (default: 2)
- Verifier rotation: same pair cannot repeatedly approve claims from the same implementer
- Automated checks at MVP: duplicate media hash detection, basic metadata consistency
- Reward minting only occurs for verified tranches (holdback until verified)
- Disputes pause only unreleased tranches unless fraud severity threshold is met
- Failed accusations trigger exponential cooldown escalation
- Confirmed fraud: clawback + possible negative balance + platform restrictions
- Dispute threshold: max(5 people, 2% of original voters), 80% agreement to confirm fraud

## Plan

- [ ] Design verifier assignment with rotation constraints
- [ ] Build verification review workflow (approve/reject/request-changes)
- [ ] Implement automated checks: duplicate hash detection, metadata consistency
- [ ] Build reward holdback: mint only after verification passes
- [ ] Implement dispute creation with challenger deposit
- [ ] Build dispute voting and resolution flow
- [ ] Implement penalty actions (clawback, negative balance, restrictions)
- [ ] Build accusation cooldown with exponential escalation

## Test

- [ ] Verifier rotation prevents repeated same-pair approvals
- [ ] Rewards only mint after verification approval
- [ ] Disputes correctly pause unreleased tranches
- [ ] Failed accusations trigger escalating cooldowns
- [ ] Confirmed fraud creates negative balance liability
- [ ] Duplicate media hash is detected and flagged automatically

## Notes

**Phase 2:** Add AI-powered evidence analysis (image/video authenticity scoring, geotag cross-reference, AI-generated content detection). Add ValueFlows internal consistency checking (inputs vs. outputs balance).

**Open questions:**
- Holdback percentage for verified-but-not-finalized rewards
- Default reward threshold above which multiple verifiers are required
