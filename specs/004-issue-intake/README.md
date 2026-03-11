---
status: planned
created: '2026-03-17'
tags:
  - issues
  - mvp
  - core-loop
priority: high
created_at: '2026-03-17T11:07:38.980Z'
depends_on:
  - 001-core-ledger
  - 002-wallet-auth
updated_at: '2026-03-17T11:08:17.583Z'
---

# Issue Intake & Management

> **Phase**: MVP · **Priority**: High · **Subsystem**: Issues

## Overview

Issue creation, editing, discovery, categorization, tagging, scope assignment (local/national/global), basic duplicate surfacing via text search, and spam throttling. First step of the Identify → Deliberate → Decide → Implement → Reward loop.

Issue creation also captures an initial reward intent (proposed by the creator), which is deliberated on alongside the issue content and locked when the issue reaches `vote-ready`.

## Design

### Data Models

- **Issue** — core record with state machine: `draft` → `deliberating` → `vote-ready` → `adopted` → `implementing` → `completed` → `archived`
- **IssueRevision** — version history of issue description
- **IssueTag** — topic/domain tags (user-created)
- **ScopeTag** — local/national/global + geographic scope
- **RewardIntent** — proposed reward per accepted unit of work; locked at `vote-ready`
- **IssueMergeRequest** — proposal to merge/redirect near-duplicate issues

### API Surface

- `POST /issues` — create new issue (includes initial reward intent)
- `PUT /issues/:id` — update issue (description, tags, reward intent while in `draft`/`deliberating`)
- `GET /issues` — list/search issues with filters (full-text search)
- `GET /issues/:id` — single issue detail
- `GET /issues/search?q=` — full-text search for similar issues (shown before submit)
- `POST /issues/:id/merge-request` — propose merge

### Key Rules

- Issue requires: title, summary, scope, tags, impacted domains, initial reward intent
- Submit flow shows top text-search results for similar issues before final create
- Reward intent includes: amount per unit, unit definition, and payment schedule (milestone/monthly/per-action)
- Parallel implementers are allowed by default — multiple actors can claim and work on the same issue
- Rate limits and per-user issue quotas prevent flooding
- State transitions are event-logged (spec 001)

## Plan

- [ ] Design issue schema and state machine
- [ ] Build issue CRUD with revision tracking
- [ ] Implement tag and scope taxonomy (free-form)
- [ ] Build full-text similarity search for pre-submit duplicate surfacing
- [ ] Build reward intent schema and lock-on-vote-ready behavior
- [ ] Build merge request workflow
- [ ] Add rate limiting and issue quotas

## Test

- [ ] Issue state transitions follow defined machine
- [ ] Text search surfaces relevant existing issues before submission
- [ ] Reward intent is locked once issue reaches `vote-ready`
- [ ] Rate limiting prevents issue flooding
- [ ] All mutations produce events in core ledger
- [ ] Parallel claims can be created on the same issue

## Notes

**Phase 2:** Replace full-text search with pgvector semantic similarity for better duplicate detection. Add AI-suggested tags.

**Open questions:**
- Tag taxonomy bootstrap: free-form only vs seeded ontology?
- Merge authority: mods only vs community approval for non-trivial merges?
