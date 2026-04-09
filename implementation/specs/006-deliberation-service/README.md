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

Deliberation content is stored as **AT Protocol records** in users' Personal Data Servers (PDS), not a centralized database. Each record is signed by the author's DID — the server cannot forge or censor content. The system follows the AT Proto **AppView** pattern:

1. Users write deliberation records to their PDS via the AT Proto API
2. A Relay aggregates records from many PDSes into a firehose
3. The Kindact **AppView** indexes deliberation records and serves the API
4. Multiple independent AppViews can exist — no single operator monopoly

Anyone can run a Relay or AppView, eliminating single points of failure.

### Lexicons

| Lexicon | Description |
|---------|-------------|
| `org.kindact.deliberation.comment` | Threaded discussion on issues |
| `org.kindact.deliberation.argument` | Pro/con argument node (Kialo-style structured deliberation) |
| `org.kindact.deliberation.proposal` | Wiki-style collaborative editing of the proposal text |

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

All AI features run in the **AppView layer** — a service on top of the data, not embedded in the data store:

- **Duplicate detection** — flags similar comments/arguments
- **Issue improvement suggestions** — proposes refinements to issue text
- **Continuous summarization** — maintains a running summary as deliberation evolves
- Uses AI provider registry (pluggable)

**Universal Source Panel** — AI pre-computes overlapping character-position spans when generating summaries, linking each claim back to source comments:

```json
{
  "references": [
    { "start": 72, "end": 82, "text": "usage data",
      "commentIds": ["c35", "c35a"], "strength": "direct" }
  ]
}
```

Strength levels: `direct` (explicitly stated) or `approximate` (inferred). Hovering any span in the summary populates a floating source panel with the originating comments.

### Data Models

Records stored as AT Proto lexicon records, indexed by the AppView into PostgreSQL:

**Comment record** (`org.kindact.deliberation.comment`):
- `issueId`, `authorDid`, `text`, `parentUri` (threading)
- `stance`: `pro` | `con` | `null`
- `quotedText`, `sourceType` (`description` | `metric` | `boundary`), `sourceId`, `quoteStart`, `quoteEnd` — for quote-commenting on specific passages

**Argument node** (`org.kindact.deliberation.argument`):
- `issueId`, `authorDid`, `text`, `type` (`pro` | `con`), `parentUri`
- Forms a Kialo-style structured argument tree

**AI Summary** (AppView-internal, not an AT Proto record):
- `issueId`, `content`, `modelVersion`, `promptVersion`
- `references`: JSON — overlapping character-position spans → source comment IDs (see Universal Source Panel above)

### API

REST/GraphQL endpoints for CRUD on comments, arguments, proposals, module surfaces, and fallback views. Authenticated via wallet signature.

The API must distinguish between:

- raw data availability for audit/export
- default visibility/prominence in a given client surface

### Batch Anchoring

The AppView periodically computes a Merkle root of indexed deliberation records and anchors on-chain via `ContentAnchorFacet` (004). Provides tamper evidence without per-message gas costs.

### Account Portability

Users can migrate their PDS and retain all deliberation history. Records follow the user, not the platform.

### Events

- `CommentCreated`, `ArgumentAdded`, `ProposalUpdated`, `SummaryGenerated` (emitted by the AppView indexer)

### Extension Points

- Pluggable deliberation surfaces keyed to issue protocol binding
- Pluggable ranking algorithms
- Pluggable AI providers
- Additional deliberation modes (future: fishbowl, Delphi)
- Independent AppViews with custom indexing strategies

## Plan

1. Define Kindact lexicons (`org.kindact.deliberation.*`)
2. Implement AppView indexer (consume Relay firehose, build deliberation index)
3. Implement comment query layer (threaded views from indexed records)
4. Implement argument tree query layer (pro/con nodes)
5. Implement proposal document query layer (collaborative editing)
6. Implement anonymization in AppView API responses (strip DIDs)
7. Implement ranking engine (randomized + outlier)
8. Integrate AI summarization in AppView layer
9. Implement batch anchoring job (Merkle root → 004)
10. Tests

## Test

- Unit: lexicon schema validation
- Unit: AppView indexer record processing
- Unit: comment threading and argument tree operations
- Unit: ranking algorithm properties (randomness, outlier surfacing)
- Integration: anonymization (verify DIDs stripped from API responses)
- Integration: batch anchoring (verify Merkle root on-chain)
- Integration: AI summarization pipeline
- Integration: multi-PDS record aggregation via Relay

## Notes

- Anonymization is display-layer only; backend retains author mapping for moderation
- Deliberation is now explicitly module-oriented: comments remain core, while pro/con, wiki, clustering, and similar experiences are optional surfaces.
- Batch anchoring interval is configurable (default: every N hours or M new items)
- No single point of failure — anyone can run a Relay or AppView independently
- Account portability is inherent: deliberation history lives in the user's PDS
