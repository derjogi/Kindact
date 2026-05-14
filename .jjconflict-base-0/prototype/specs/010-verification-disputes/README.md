---
status: complete
created: 2026-03-17
priority: high
tags:
- verification
- mvp
- core-loop
depends_on:
- 009-work-reports-evidence
created_at: 2026-03-17T11:07:52.827Z
updated_at: 2026-04-01T09:51:33.991508497Z
completed_at: 2026-04-01T09:51:33.991508497Z
transitions:
- status: in-progress
  at: 2026-04-01T04:47:24.737281913Z
- status: complete
  at: 2026-04-01T09:51:33.991508497Z
implementation_note: Schema created (VerificationReview, DisputeCase). Service and API routes not yet created.
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

- [x] Build verification review workflow (approve/reject/request-changes) (`src/server/verification`)
- [x] Implement auto-verification on 2+ approvals
- [x] Implement dispute creation (`src/app/api/claims/[id]/disputes`)
- [x] Build dispute resolution flow (`src/app/api/disputes/[id]/resolve`)
- [x] Implement fraud → claim rejection on `resolved_fraud`
- [x] Build claim verification status endpoint (`GET /claims/:id/verification`)
- [x] Audit-log all verification and dispute events via ledger
- [x] Design verifier assignment with rotation constraints (`assignVerifier`)
- [x] Implement automated checks: duplicate hash detection (`runEvidenceChecks`)
- [x] Build reward holdback: mint only after verification passes (`mintVerifiedReward`)
- [x] Build dispute voting via ledger events (`castDisputeVote`)
- [x] Implement penalty actions: clawback + restrictions (`applyPenalty`)
- [x] Build accusation cooldown with exponential escalation (`checkAccusationCooldown`)

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
