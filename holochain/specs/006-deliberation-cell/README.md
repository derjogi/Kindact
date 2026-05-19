---
status: implemented-pending-verification
created: '2026-05-12'
tags: [deliberation, core-loop, holochain, cells]
priority: high
derivation: changed
counterpart: 006-deliberation-service
depends_on:
  - 004-content-anchoring
  - 005-issue-lifecycle
  - 014-conductor-and-bridge-service
  - 030-cell-architecture-and-registry
  - 041-base-dna-specification
---

# 006 — Deliberation Cell

> **Status**: Exploratory · **Derivation**: changed · **Counterpart in implementation/**: [006-deliberation-service](../../../implementation/specs/006-deliberation-service/README.md) (replaces the AT Proto AppView pattern with Holochain cell zomes).

## Overview

Deliberation runs inside the issue's home cell, on Holochain. Comments, arguments, AI summaries, and proposal documents are DHT entries authored by participants and validated by cell members. The implementation/ AT-Proto-AppView pattern is replaced by the cell's own gossip + validation. **Deliberation actions are free** (no gas, no bridging). Anchoring is reserved for canonical milestones (proposal-document-at-vote-close, AI summary canonicalization).

Read the [implementation/ counterpart](../../../implementation/specs/006-deliberation-service/README.md) for the deliberation surfaces, lexicons, and AppView API design that this spec replaces.

## Design

### Zome composition

The deliberation zome is composed into the issue's home cell:

| Zome | Role |
|---|---|
| `kindact_deliberation_comment` | Threaded discussion entries on issues |
| `kindact_deliberation_argument` | Pro/con argument trees (Kialo-style) |
| `kindact_deliberation_proposal` | Wiki-style collaborative editing of the proposal text |
| `kindact_deliberation_summary` | AI-generated and human-curated summaries |
| `kindact_deliberation_surface_registry` | Tracks which surfaces are active for a given issue binding |

These zomes are extensions on top of Base DNA ([041](../041-base-dna-specification/README.md)). A cell may install all or a subset depending on its protocol binding.

### Entry types

| Implementation/ lexicon | Holochain entry type |
|---|---|
| `org.kindact.deliberation.comment` | `Comment` (threaded) |
| `org.kindact.deliberation.argument` | `ArgumentNode` (typed: pro / con / qualifier) |
| `org.kindact.deliberation.proposal` | `ProposalDocument` (CRDT or last-writer-wins variant) |
| (new) AI summary | `AISummary` (signed by AI service's agent key) |

### Author flow

1. User connects to their conductor (local or Holo-hosted per [047](../047-holo-hosting-strategy/README.md)).
2. User joins the issue's home cell (or, for guest contribution, joins as guest contributor per [044](../044-cross-cell-validation-and-trust/README.md)).
3. User authors a comment / argument; entry is signed by their agent key.
4. Cell validators (other members in the entry's DHT shard) validate per Base DNA + cell's deliberation rules.
5. Entry propagates via gossip; visible to all cell members (and to anchor subscribers if it's a canonicalized milestone entry).

### AI summaries

The AI service runs as an agent with its own Holochain agent key (linked to a service identity per [002](../002-identity-primitive/README.md)). It:
- Reads the cell's deliberation entries.
- Generates a summary (LLM-driven; same approach as implementation/ but service runs against the conductor instead of the AppView).
- Commits an `AISummary` entry signed by its agent key.
- Updates periodically; old summaries remain in the source chain.

The community can canonicalize a summary at decision time; canonicalization is anchored on EVM per [004](../004-content-anchoring/README.md).

### Proposal document collaboration

CRDT-based collaborative editing for the proposal document. Holochain's source-chain model fits CRDT operations naturally: each edit is an entry; merges happen at read time. At vote close, the canonical version is captured and anchored.

### Validation rules

- Authoring agent must be humanity-verified ([002](../002-identity-primitive/README.md)) — Base rule.
- Comment / argument / proposal entries must reference a valid issue in the cell.
- Argument nodes must reference a valid parent (or the issue root).
- AISummary entries must be signed by a registered AI service agent key (cell's binding declares which one).
- Rate limits apply per agent (anti-spam): N entries per minute per cell, configurable.

### Anchoring policy

| Entry | Anchored on EVM |
|---|---|
| Comment, argument | No (cell-only) |
| Proposal document — drafts | No |
| Proposal document — canonical at vote close | **Yes** |
| AI summary — drafts | No |
| AI summary — canonicalized at decision time | **Yes** |
| Deliberation surface activation/deactivation | **Yes** (changes binding) |

### What replaces the AppView API

In implementation/, the frontend talks to the AppView REST/GraphQL API. In the hybrid:

- The frontend ([015](../015-frontend/README.md)) talks to the conductor over WebSocket.
- The conductor exposes zome-call endpoints corresponding to deliberation operations: `getCommentsForIssue`, `postComment`, `getArgumentTree`, `editProposalSection`, etc.
- Pagination, filtering, and threading happen in conductor zome calls.
- A read-replica pattern exists for high-traffic cells: the cell can elect "indexer" members who maintain optimized read indices and serve them via zome calls.

## Plan

1. [ ] Implement the four deliberation zomes.
2. [ ] Implement the surface registry and binding-driven activation.
3. [ ] Implement AI service agent registration and summary publication path.
4. [ ] Implement CRDT proposal document zome.
5. [ ] Implement anchoring helpers for canonical milestones.
6. [ ] Build cell read-replica indexer pattern for high-traffic cells.
7. [ ] Implement frontend conductor-WebSocket client (in [015](../015-frontend/README.md)).

## Test

- [ ] Comment authored in cell appears for all members within gossip SLA.
- [ ] Guest contributor authors comment on joined issue; counted as deliberation; not counted in cell governance.
- [ ] AI summary updated; old version remains in source chain; new version visible.
- [ ] Proposal document concurrent edits: CRDT merges; final canonical version anchored at vote close.
- [ ] Rate limit: agent exceeding cap is throttled; attempts beyond cap rejected by validators.

## Open questions

- **Read replica pattern** — opt-in by cell members or required for cells over some size? Trust assumption (the indexer is a member, but high-traffic cells may want multiple indexers for redundancy).
- **AI service agent identity** — single platform-operated agent per cell, or community-elected per cell, or competing services?
- **CRDT semantics for proposal document** — Y.js / Automerge / hand-rolled per-section?
- **Anchoring frequency** — every vote-close, or batched periodically?
- **Cell-specific deliberation extensions** — Berlin housing might want a "neighbor consultation" surface; how do third-party deliberation zomes pass cell-level vetting?

## Notes

The implementation/ AppView model and the Holochain conductor model are isomorphic at the API level — both expose pagination/filtering over signed records. The substantive difference is decentralization: the AppView is a single political/operational point; the conductor + cell validators distribute that point across cell members.

For the user, the deliberation experience should feel almost identical to implementation/. The differences (free actions; no AppView outage; conductor connection management) surface in the runtime mode UX ([047](../047-holo-hosting-strategy/README.md)) and in the absence of gas costs for posting.
