---
status: in-progress
created: 2026-05-25
priority: high
tags:
- holochain
- prototype
- dht
- ui
- zomes
- hybrid
created_at: 2026-05-25T22:12:11.275458689Z
updated_at: 2026-05-26T21:19:20.652865271Z
transitions:
- status: in-progress
  at: 2026-05-26T21:19:20.652865271Z
related:
- 041-base-dna-specification
- 042-anchor-and-subscription-model
- 044-cross-cell-validation-and-trust
derivation: new
---

# 048 — Prototype Cross-Agent Issue Visibility

> **Status**: Planned · **Derivation**: new · **Scope**: `holochain/kindact-hc/` prototype only — not a production architecture spec.

## Overview

In the current hybrid prototype (`holochain/kindact-hc/`), two agents launched with `npm run start` cannot see each other's data:

- Elena (agent 1) creates a Berlin housing issue → only she sees it.
- Elena triggers an "Observer Binding Challenge" → her UI flips the issue to `Challenged`, but Amina's UI shows nothing.

This is **not** a Holochain gossip problem (the `kitsune2_gossip ... already accepted` log line is benign duplicate gossip). It is a prototype gap:

1. The UI reads exclusively from a per-tab in-memory `mockDb`. It never queries the DHT.
2. The wind_turbine and housing zomes do not expose any "list issues" or "list challenges" extern. There is no way to enumerate what other agents have published, even though the entries are on the DHT.
3. The "Trigger Observer Binding Challenge" button does no zome call at all — it mutates local state only.

The goal of this spec is to take the prototype from "looks like governance" to "actually round-trips through the DHT" for the issue + challenge + comment flow, so a 2-agent demo behaves like a shared substrate.

This unblocks the substrate decision conversation (`../implementation/holochain-architecture-exploration.md` §8) — without working cross-agent visibility, the prototype can't honestly demonstrate the hybrid's claimed properties.

## Design

### Backend: zome additions

All changes use the standard anchor-entry + links pattern already established in [`global_registry`](../../kindact-hc/dnas/global_registry/zomes/coordinator/registry/src/lib.rs).

**wind_turbine integrity** (`dnas/manhattan_windturbine/zomes/integrity/wind_turbine_integrity/src/lib.rs`):

- Add link types:
  - `AllIssues` — anchor → issue
  - `IssueToComment` (already declared, currently unused) — issue → comment
- No new entry types (anchor entry can be a small inline struct, mirroring `AnchorEntry` in `registry_integrity`).

**wind_turbine coordinator** (`dnas/manhattan_windturbine/zomes/coordinator/wind_turbine/src/lib.rs`):

- `create_issue` — after `create_entry`, hash the "all_issues" anchor entry, create_entry it if missing, then `create_link(anchor_hash, issue_hash, AllIssues, ())`.
- `post_comment` — after `create_entry`, `create_link(comment.issue_id, comment_hash, IssueToComment, ())`.
- New: `get_all_issues() -> Vec<(ActionHash, IssueEntry)>` — get_links from the anchor, then `get` each target and decode.
- New: `get_comments_for_issue(ActionHash) -> Vec<(ActionHash, CommentEntry)>`.

**housing integrity** (`dnas/housing/zomes/integrity/housing_integrity/src/lib.rs`):

- Add link type `AllIssues` (it already has `IssueToChallenge`).

**housing coordinator** (`dnas/housing/zomes/coordinator/housing/src/lib.rs`):

- `create_housing_issue` — same anchor+link pattern as wind_turbine.
- `challenge_issue_binding` — currently writes a `BindingChallenge` entry but does not link it. Add `create_link(challenge.issue_hash, challenge_hash, IssueToChallenge, ())`.
- New: `get_all_housing_issues() -> Vec<(ActionHash, HousingIssue)>`.
- New: `get_challenges_for_issue(ActionHash) -> Vec<(ActionHash, BindingChallenge)>`.

### Frontend: UI changes

In [`holochain-app.ts`](../../kindact-hc/ui/src/holochain-app.ts):

1. Replace `mockDb` as the *source* of truth in live mode. Keep it only when `isMock === true`.
2. After connect (`firstUpdated → loadRealData`), call `get_all_issues` (wind_turbine) and `get_all_housing_issues` (housing) and seed `this.activeIssues` (or a new `liveIssues` state) from the results.
3. Add a simple poll: `setInterval(() => this.refreshFromDht(), 3000)`. This is acceptable for the prototype; a signal-based replacement is out of scope here.
4. Refresh after every local write (`createIssueSubmit`, `submitComment`, `handleTriggerDispute`) so the actor sees immediate feedback without waiting for the next tick.
5. Wire `handleTriggerDispute` to actually call `housing::challenge_issue_binding` with the issue's `actionHash`. Remove the local `status = "Challenged"` mutation; derive status from "has this issue any challenges?" instead.
6. When expanding an issue card, fetch `get_comments_for_issue` (or `get_challenges_for_issue` for housing) and render that instead of `issue.comments`.
7. Update [`extractCellId`](../../kindact-hc/ui/src/holochain-app.ts) usage to handle the housing cell consistently for both reads and writes.

### Status derivation

Today `status` is a string field on the entry. With the changes above, `Challenged` becomes derivable: "has any `BindingChallenge` link"? For the prototype:

- Keep the `status` field as authored (defaults to `"Deliberating"`).
- In the UI, if `get_challenges_for_issue(hash).length > 0`, override the rendered status to `"Challenged"`.
- A proper status state machine is out of scope (tracked in [005-issue-lifecycle](../005-issue-lifecycle/README.md)).

## Plan

- [x] **Zomes — wind_turbine**
  - [x] Add `AllIssues` link type in integrity zome
  - [x] Add `AllIssuesAnchor` entry type (or reuse a string anchor pattern) in integrity zome
  - [x] Update `create_issue` to anchor-link the new issue
  - [x] Update `post_comment` to link comment under issue via `IssueToComment`
  - [x] Add `get_all_issues` extern
  - [x] Add `get_comments_for_issue` extern
- [x] **Zomes — housing**
  - [x] Add `AllIssues` link type in integrity zome
  - [x] Add anchor entry type in integrity zome
  - [x] Update `create_housing_issue` to anchor-link
  - [x] Update `challenge_issue_binding` to create `IssueToChallenge` link
  - [x] Add `get_all_housing_issues` extern
  - [x] Add `get_challenges_for_issue` extern
- [x] **Build**
  - [x] `nix develop`
  - [x] `npm run build:happ`
  - [x] Fix any Rust errors surfaced
- [x] **UI**
  - [x] Add `liveIssues` state distinct from `mockDb.issues`
  - [x] Implement `refreshFromDht()` that calls both `get_all_*` externs and merges
  - [x] Call it on connect + every 3s + after each local write
  - [x] Re-route the feed (`updateActiveIssues`) to read from `liveIssues` when `!isMock`
  - [x] Wire `handleTriggerDispute` to `housing::challenge_issue_binding`
  - [x] Derive `status === "Challenged"` from challenge links instead of mutating mockDb
  - [x] Fetch and render comments via `get_comments_for_issue` when a card is expanded
- [x] **Cleanup**
  - [x] Remove or clearly label the pre-seeded `mockDb.issues` so they don't appear in live mode
  - [x] Update [`PROTOTYPE-PLAN.md`](../../PROTOTYPE-PLAN.md) to reflect the now-real cross-agent flow

## Test

Manual two-agent validation (`AGENTS=2 npm run start`):

- [ ] Elena creates a Manhattan wind-turbine issue → Amina sees it in her feed within one poll tick (≤3s).
- [ ] Amina creates a Berlin housing issue → Elena sees it within one poll tick.
- [ ] Elena posts a comment on Amina's Manhattan issue (after requesting guest cap access) → Amina sees the comment on expand.
- [ ] Elena clicks "Trigger Observer Binding Challenge" on a Berlin issue → Amina sees the issue's status flip to `Challenged` within one poll tick.
- [ ] Restart both agents; previously-created issues persist (DHT is gossiped, not in-memory).
- [ ] `npm run test` (existing cargo tests) still passes.

## Notes / Open questions

- **Polling vs. signals.** A poll loop is the cheapest fix and matches scaffolded hApp patterns. Replacing it with `post_commit` → `emit_signal` → UI signal handler is a follow-up if cross-agent latency becomes UX-blocking. Tracking in [041-base-dna-specification](../041-base-dna-specification/README.md).
- **Where does the anchor live?** This spec puts the anchor inside each cell (`wind_turbine` and `housing` separately). The hybrid architecture (see [042-anchor-and-subscription-model](../042-anchor-and-subscription-model/README.md)) ultimately wants anchors in `global_registry`. For the prototype this is overkill — per-cell anchors keep the change local and the demo honest about cell isolation.
- **Comments on housing issues.** The housing zome has no `post_comment` extern today. Keep the UI's current behavior of disabling comments on housing-cell issues; adding comments to housing is out of scope for this spec.
- **Mock seed data.** The two pre-seeded `mockDb.issues` rows currently double as demo content and as placeholder fallback. In live mode they should disappear; the empty-feed copy already handles the empty case.
- **Validation.** All integrity validation remains permissive (`ValidateCallbackResult::Valid`) — this spec does not tighten validation. Doing so is tracked in [044-cross-cell-validation-and-trust](../044-cross-cell-validation-and-trust/README.md).
