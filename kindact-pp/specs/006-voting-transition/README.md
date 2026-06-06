---
status: planned
created: 2026-06-06
priority: high
tags:
- zomes
- voting
depends_on:
- '004'
parent: '001'
created_at: 2026-06-06T21:28:57.318940930Z
updated_at: 2026-06-06T21:32:05.487410934Z
---

# Phase 4 — Transition to Voting (2-agent seconding)

> **Status**: planned · **Priority**: high · **Created**: 2026-06-06

## Overview

Phase 4 of [001-proofpoll-fork-mvp](../001-proofpoll-fork-mvp/README.md). Delivers feature **#5**: an issue moves from the **Deliberating** stage to the **Voting** stage once **≥ 2 distinct humans** press "Second for voting". The stage is *derived* from links, not stored on the issue.

## Design

- `second_issue(issue_action_hash)`: `create_link(issue, my_agent, IssueToSeconds, ())`. The link's `author` records who seconded.
- **Count distinct humans, not agent keys.** Reuse ProofPoll's `my_identity_agents` helper (the 2-hop walk through the Flowsta agent-linking graph) so one person can't second twice across devices/reinstalls — the same guard ProofPoll already applies to votes and flags. Optionally reject a duplicate second by the same identity set up-front (or just dedup at count time).
- Stage is computed in `get_issue_state` (defined in Phase 5): collapse `IssueToSeconds` authors into identity groups; `stage = "Voting"` iff `second_count >= SECONDS_REQUIRED (=2)`, else `"Deliberating"`.

### Frontend
- Issue detail (`src/routes/poll/index.tsx`): a "Second for voting (n/2)" button calling `second_issue`; disabled once `seconded_by_me`. When `stage` flips to Voting, reveal the voting panel (Phase 5).
- `holochain.ts` + Tauri wrapper for `second_issue`.

## Plan

- [ ] Coordinator: `second_issue` creating an `IssueToSeconds` link
- [ ] Distinct-human counting via `my_identity_agents` grouping (shared helper used again in Phase 5)
- [ ] Tauri command + `holochain.ts` wrapper
- [ ] "Second for voting (n/2)" button + disabled state

## Test

- [ ] One human seconds → `second_count == 1`, stage stays Deliberating
- [ ] A second distinct human seconds → stage flips to Voting in both apps
- [ ] The same human seconding twice (even from a second device/agent) does not double-count
- [ ] Zome unit test for the distinct-human threshold

## Notes

`SECONDS_REQUIRED = 2` is a named constant, easy to tune. The seconding count reuses the identity-grouping logic that the approval vote (Phase 5) also needs, so both land together cleanly.
