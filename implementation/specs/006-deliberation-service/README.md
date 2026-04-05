---
status: planned
created: 2026-04-03
priority: high
tags:
- deliberation
- core-loop
- off-chain
depends_on:
- 004-content-anchoring
- 005-issue-lifecycle
- '014'
- '016'
created_at: 2026-04-05T10:28:36.965643605Z
updated_at: 2026-04-05T10:28:36.965643605Z
---

# 006 — Deliberation Service

Fully off-chain deliberation engine with periodic hash anchoring and modular deliberation surfaces. Implements shared discussion infrastructure between issue creation and voting while allowing issue-specific surfaces to be activated by protocol binding.

## Design

### Architecture

This is an **off-chain service**, not a smart contract facet. All content lives in a database + content-addressed storage, with periodic batch anchoring on-chain via 004.

### Components

| Component | Description |
|-----------|-------------|
| Comments | Core threaded discussion on issues |
| DeliberationSurfaceRegistry | Tracks which deliberation surfaces are active for a given issue binding |
| ArgumentNodes | Optional pro/con argument tree module |
| ProposalDocument | Optional wiki-style proposal module |
| AI Summaries | Assistive summarization of deliberation state |
| FallbackViews | Read-only summaries for module data that is not fully rendered in a given UI |

### Anonymization Layer

During deliberation, author identities are hidden from display. Backend knows identities (for accountability), frontend doesn't show them. Prevents reputation-based bias during discussion.

### Randomized Ranking

Comments can be displayed with mixed ranking: randomness + outlier detection + votes. Ranking should be configurable as an issue-level deliberation module rather than treated as a permanent default.

### AI Integration

- **Duplicate detection** — flags similar comments/arguments
- **Issue improvement suggestions** — proposes refinements to issue text
- **Continuous summarization** — maintains a running summary as deliberation evolves
- Uses AI provider registry (pluggable)

### API

REST/GraphQL endpoints for CRUD on comments, arguments, proposals, module surfaces, and fallback views. Authenticated via wallet signature.

The API must distinguish between:

- raw data availability for audit/export
- default visibility/prominence in a given client surface

### Batch Anchoring

Periodic job computes Merkle root of all deliberation content and anchors on-chain via `ContentAnchorFacet` (004). Provides tamper evidence without per-message gas costs.

### Events (off-chain)

- `CommentCreated`, `ArgumentAdded`, `ProposalUpdated`, `SummaryGenerated`

### Extension Points

- Pluggable deliberation surfaces keyed to issue protocol binding
- Pluggable ranking algorithms
- Pluggable AI providers
- Additional deliberation modes (future: fishbowl, Delphi)

## Plan

1. Design API schema (REST/GraphQL)
2. Implement comment service (threaded CRUD)
3. Implement argument tree service (pro/con nodes)
4. Implement proposal document service (collaborative editing)
5. Implement anonymization middleware
6. Implement ranking engine (randomized + outlier)
7. Integrate AI summarization
8. Implement batch anchoring job (Merkle root → 004)
9. Tests

## Test

- Unit: comment CRUD and threading
- Unit: argument tree operations (add, restructure)
- Unit: ranking algorithm properties (randomness, outlier surfacing)
- Integration: anonymization (verify identity hidden in API responses)
- Integration: batch anchoring (verify Merkle root on-chain)
- Integration: AI summarization pipeline

## Notes

- Anonymization is display-layer only; backend retains author mapping for moderation
- Deliberation is now explicitly module-oriented: comments remain core, while pro/con, wiki, clustering, and similar experiences are optional surfaces.
- Batch anchoring interval is configurable (default: every N hours or M new items)
- This service is the most complex off-chain component; may warrant its own repo
