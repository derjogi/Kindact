---
status: planned
created: '2026-04-03'
tags: [deliberation, core-loop, off-chain]
priority: high
depends_on:
  - 004-content-anchoring
  - 005-issue-lifecycle
---

# 006 — Deliberation Service

Fully off-chain deliberation engine with periodic hash anchoring. Implements structured discussion between issue creation and voting.

## Design

### Architecture

This is an **off-chain service**, not a smart contract facet. All content lives in a database + content-addressed storage, with periodic batch anchoring on-chain via 004.

### Components

| Component | Description |
|-----------|-------------|
| Comments | Threaded discussion on issues |
| ArgumentNodes | Pro/con argument tree (Kialo-style structured deliberation) |
| ProposalDocument | Wiki-style collaborative editing of the proposal text |
| AI Summaries | Continuous summarization of deliberation state |

### Anonymization Layer

During deliberation, author identities are hidden from display. Backend knows identities (for accountability), frontend doesn't show them. Prevents reputation-based bias during discussion.

### Randomized Ranking

Comments displayed with mixed ranking: randomness + outlier detection + votes. Reduces popularity bias and ensures minority viewpoints surface.

### AI Integration

- **Duplicate detection** — flags similar comments/arguments
- **Issue improvement suggestions** — proposes refinements to issue text
- **Continuous summarization** — maintains a running summary as deliberation evolves
- Uses AI provider registry (pluggable)

### API

REST/GraphQL endpoints for CRUD on comments, arguments, proposals. Authenticated via wallet signature.

### Batch Anchoring

Periodic job computes Merkle root of all deliberation content and anchors on-chain via `ContentAnchorFacet` (004). Provides tamper evidence without per-message gas costs.

### Events (off-chain)

- `CommentCreated`, `ArgumentAdded`, `ProposalUpdated`, `SummaryGenerated`

### Extension Points

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
- Ranking algorithm should be configurable per community in the future
- Batch anchoring interval is configurable (default: every N hours or M new items)
- This service is the most complex off-chain component; may warrant its own repo
