---
status: complete
created: '2026-03-17'
tags:
  - deliberation
  - mvp
  - core-loop
priority: high
created_at: '2026-03-17T11:07:39.370Z'
depends_on:
  - 004-issue-intake
updated_at: '2026-03-17T11:08:18.000Z'
---

# Deliberation Workspace

> **Phase**: MVP · **Priority**: High · **Subsystem**: Deliberation

## Overview

Deliberation layer with threaded comments, Kialo-style structured pro/con argument maps, wiki-style proposal body revisions, anonymized public display, and randomized ranking. Reduces bias through anonymity and prevents echo chambers via non-popularity-based ordering.

## Design

### Data Models

- **Comment** — threaded discussion item with parent reference
- **ArgumentNode** — structured pro/con claim with parent linkage (tree structure)
- **ProposalDocument** — current state of the proposal body
- **ProposalRevision** — diff-based revision with author + AI review flag
- **IssueAlias** — per-issue anonymous identity for display (one per user per issue)
- **DeliberationReaction** — upvote/downvote (used in ranking, optionally hidden from UI)

### API Surface

- `POST /issues/:id/comments` — add comment to thread
- `POST /issues/:id/arguments` — add pro/con argument node
- `POST /issues/:id/proposal/revisions` — submit proposal revision
- `GET /issues/:id/deliberation` — get comments + arguments (anonymized, randomized)
- `GET /issues/:id/proposal/history` — full revision history with diffs

### Key Rules

- Each participant gets one issue-scoped anonymous alias per issue
- Moderators can deanonymize only with explicit audit reason (logged)
- Proposal body supports revision history, diffs, and rollback
- Default feed order is weighted-random, not pure popularity sort
- Reactions influence ranking algorithm but are not primary sort criterion

## Plan

- [ ] Design threaded comment schema with parent references
- [ ] Build Kialo-style pro/con argument tree data model
- [ ] Implement per-issue anonymous alias system
- [ ] Build proposal document with wiki-style collaborative editing
- [ ] Implement revision history with diffs and rollback
- [ ] Build randomized/weighted ranking algorithm for comment display
- [ ] Implement moderator deanonymization with audit logging

## Test

- [ ] Comments display with anonymous aliases, not real identities
- [ ] Pro/con arguments form valid tree structures
- [ ] Proposal revisions show diffs and support rollback
- [ ] Feed order is not purely popularity-based
- [ ] Deanonymization is audit-logged with reason

## Notes

**Open questions:**
- Make anonymization default for all issues or configurable per issue?
- Whether reaction scores should be public or only used in ranking
- Ranking algorithm weights: randomness vs outlier detection vs upvotes
