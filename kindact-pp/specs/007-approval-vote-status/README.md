---
status: planned
created: 2026-06-06
priority: high
tags:
- zomes
- voting
- ui
depends_on:
- '006'
parent: '001'
created_at: 2026-06-06T21:28:57.368595418Z
updated_at: 2026-06-06T21:32:05.537148036Z
---

# Phase 5 — Approval Vote with Live Status (MVP)

> **Status**: planned · **Priority**: high · **Created**: 2026-06-06

## Overview

Phase 5 of [001-proofpoll-fork-mvp](../001-proofpoll-fork-mvp/README.md) — **completes the MVP**. Delivers feature **#6**: a simple approval vote on an issue in the Voting stage, with a live status badge that always shows `Voting: Pending` (< 2 voters), `Voting: Approved`, or `Voting: Declined`. Reuses ProofPoll's sybil-resistant vote engine.

## Design

- `cast_vote(CastVoteInput { issue_action_hash, approve })`: reuse ProofPoll's existing `cast_vote` body **verbatim** (dedup against `my_identity_agents`, link via `IssueToVotes`), swapping `option_index` for `approve: bool`. One vote per human; latest wins.
- **The single read the UI polls**, `get_issue_state(issue_action_hash) -> IssueState`:
  ```rust
  pub struct IssueState {
      pub stage: String,          // "Deliberating" | "Voting"
      pub second_count: u32, pub seconded_by_me: bool,
      pub voting_status: String,  // "Pending" | "Approved" | "Declined"
      pub approve_count: u32, pub decline_count: u32, pub total_voters: u32,
      pub my_vote: Option<bool>,
  }
  ```
  Derivation (count distinct humans by grouping `IssueToSeconds`/`IssueToVotes` link authors via `my_identity_agents`):
  - `stage = Voting iff second_count >= SECONDS_REQUIRED (=2)` (from Phase 4).
  - `voting_status = Pending if total_voters < MIN_VOTERS (=2)` else `Approved if approve > decline` else `Declined` (tie ⇒ Declined).

### Frontend
- Issue detail: when `stage === "Voting"`, show **Approve / Decline** buttons (`cast_vote`) and a live badge `Voting: {status}` with tallies + your current vote. Poll `get_issue_state` on an interval and refresh after writes (mirrors ProofPoll's existing refresh pattern).
- `holochain.ts` + Tauri wrappers for `cast_vote` and `get_issue_state`.

## Plan

- [ ] Coordinator: `cast_vote` (approve:bool) on `IssueToVotes`, reusing the dedup body
- [ ] Coordinator: `get_issue_state` derivation (stage + voting_status + tallies, human-grouped)
- [ ] Tauri commands + `holochain.ts` wrappers
- [ ] Voting panel UI: Approve/Decline + live status badge + tallies + my-vote
- [ ] Interval polling + refresh-after-write

## Test

- [ ] < 2 distinct voters → `Voting: Pending`
- [ ] 2 voters, approve-majority → `Voting: Approved`; decline-majority or tie → `Voting: Declined`
- [ ] A human changing their vote updates the tally (last-wins), no double count
- [ ] Two-agent live demo: badge moves Pending → Approved/Declined as each votes, in both windows
- [ ] Zome unit tests for all status branches

## Notes

`SECONDS_REQUIRED` and `MIN_VOTERS` are tunable constants. After this phase the full MVP is demoable end-to-end. Next increments (separate specs): Implementation Status + proof of work (DNA `v1.1`), fake currency (`v1.2`), multi-cell lenses (port from `kindact-hc/`).
