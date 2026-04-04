---
status: planned
created: 2026-03-17
priority: high
tags:
- ai
- mvp
- deliberation
depends_on:
- 004-issue-intake
- 005-deliberation-workspace
- 024-ai-provider-registry
created_at: 2026-03-17T11:07:39.774Z
updated_at: 2026-03-22T20:40:42.799077514Z
implementation_note: Schema created (AISummary model). AI pipeline integration not yet implemented.
---

# AI Assistance & Summaries

> **Phase**: MVP · **Priority**: High · **Subsystem**: Deliberation, AI

## Overview

AI assistance for issue improvement suggestions and living deliberation summaries. All AI output is advisory (never overwrites content directly) and versioned.

Summaries are used as context for voters; eligibility quiz questions at MVP are simple hand-authored factual questions, not AI-generated. Proposal revision review, summary flagging, and summary approval gating are deferred to Phase 2.

## Design

### Data Models

- **AISuggestion** — improvement/edit suggestion with model metadata
- **AISummary** — versioned deliberation summary with cited source item IDs

### API Surface

- `POST /ai/issues/:id/improve` — get AI improvement suggestions for issue description
- `GET /issues/:id/summary` — current AI-generated deliberation summary

### Key Rules

- AI outputs store `model_version`, `prompt_version`, and `source_refs`
- Summaries include cited source item IDs (traceable to specific comments/arguments)
- AI cannot directly overwrite proposal text — only suggest revisions for the author to apply
- Summaries are informational; quiz questions are authored separately in spec 007

## Plan

- [ ] Design AI output schema with versioning and model metadata
- [ ] Implement issue improvement suggestion pipeline
- [ ] Build living deliberation summary generation (regenerates on significant new contributions)
- [ ] Implement source citation linking in summaries

## Test

- [ ] AI suggestions include model metadata
- [ ] Summaries cite specific source items
- [ ] AI cannot directly modify proposal text
- [ ] Summary regeneration produces consistent citations

## Notes

**Phase 2:** Add summary flagging workflow (bias/incompleteness disputes), approval gating before summaries are used in eligibility quizzes, and AI-powered proposal revision review (checking for inappropriate changes).

**Open questions:**
- Single-model at launch vs dual-model cross-check for bias reduction?
- Rate limiting on AI suggestion requests to control cost
