---
status: planned
implementation_note: 'Schema created (MetricAssessment, StakeClaim, EligibilityQuiz, QuizAttempt). API routes not yet created.'
created: '2026-03-17'
tags:
  - decision-making
  - mvp
  - core-loop
priority: high
created_at: '2026-03-17T11:07:51.596Z'
depends_on:
  - 003-human-verification
  - 004-issue-intake
  - 006-ai-assist-summary
updated_at: '2026-03-17T11:08:18.782Z'
---

# Metrics & Eligibility

> **Phase**: MVP · **Priority**: High · **Subsystem**: Decision Making

## Overview

Voting gate with impact metrics for cost and time dimensions, stakeholder definitions, and a low-friction competence check. Ensures voters understand what they're voting on before proceeding.

At MVP: only `cost` and `time` dimensions are required. Social/planetary/legal dimensions and prediction markets are deferred to Phase 2. Eligibility quiz questions are hand-authored by the issue creator (not AI-generated).

## Design

### Data Models

- **ImpactDimension** — typed impact axis: `cost`, `time` (MVP); `planetary`, `social`, `legal/compliance` (Phase 2)
- **MetricAssessment** — estimate with source and confidence level
- **MetricSource** — type: creator estimate, expert input, user input
- **StakeholderRule** — per-issue/scope rules for who qualifies as a stakeholder
- **StakeClaim** — user's claim of relevance (auto-accept via profile tags or manual moderator review)
- **EligibilityQuiz** — hand-authored factual quiz questions (true/false, multiple choice)
- **QuizAttempt** — user's quiz submission and result

### API Surface

- `POST /issues/:id/metrics` — submit/update metric assessments
- `POST /issues/:id/stake-claims` — claim stakeholder status
- `POST /issues/:id/eligibility/quiz` — create or update quiz questions (issue creator/moderator)
- `POST /issues/:id/eligibility/attempts` — submit eligibility quiz
- `GET /issues/:id/eligibility/status` — check eligibility state

### Key Rules

- Required dimensions at MVP: `cost` and `time`
- Voting cannot open unless all required dimensions are `ready`
- Quiz is authored by the issue creator and reviewed by a moderator before activation
- Quiz questions must be factual (test understanding of what's being decided, not opinions)
- Stake claims auto-accept via profile tags (location, expertise) or go to moderator review
- Small/local issues have lower scrutiny thresholds than large/consequential decisions

## Plan

- [ ] Design impact dimension schema (extensible for Phase 2 dimensions)
- [ ] Build metric assessment CRUD with source tracking and confidence levels
- [ ] Build stakeholder rule engine (auto-accept via tags, manual moderator review)
- [ ] Implement quiz authoring flow for issue creators
- [ ] Build quiz attempt flow with pass/fail and retry cooldowns
- [ ] Integrate voting gate: block `vote-ready` transition until metrics pass and quiz is ready

## Test

- [ ] Voting cannot open with missing required dimensions
- [ ] Stake claims auto-accept when profile tags match
- [ ] Quiz questions are set by creator, not auto-generated
- [ ] Failed quiz attempts respect cooldown periods
- [ ] Moderator can reject or request revision of quiz questions

## Notes

**Phase 2:** Add `planetary`, `social`, `legal/compliance` dimensions. Add metric dispute flow (challenge a specific assessment). Add prediction markets as a metric source. Switch to AI-generated quiz questions from approved summaries (spec 006).

**Open questions:**
- Max retries and cooldown duration for quiz attempts
- Whether small local issues can waive the quiz entirely (moderator discretion?)
