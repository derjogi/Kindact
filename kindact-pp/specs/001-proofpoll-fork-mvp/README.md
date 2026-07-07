---
status: in-progress
created: 2026-06-06
priority: high
tags:
- fork
- mvp
- product
- holochain
created_at: 2026-06-06T21:28:49.694507242Z
updated_at: 2026-06-08T01:44:33.622893524Z
transitions:
- status: in-progress
  at: 2026-06-08T01:44:33.622893524Z
---

# Fork ProofPoll into Kindact (MVP)

> **Status**: planned · **Priority**: high · **Created**: 2026-06-06

## Overview

Build the minimal Kindact app by **forking [ProofPoll](https://github.com/derjogi/ProofPoll)** (now vendored in this directory, `kindact-pp/`) rather than starting greenfield or extending the `holochain/kindact-hc/` prototype.

ProofPoll is a production-grade, fork-ready Tauri desktop hApp (Holochain 0.6.1) that already solves the brutal-but-boring foundation: bundled conductor + lair sidecars, conductor lifecycle, **sybil-resistant identity** (Flowsta), **DNA migration**, client-side encryption, cross-device recovery, one-vote-per-*human* dedup, and a CI/CD release pipeline. We keep all that wiring, throw out the poll-specific data model, and **reuse its vote engine for Kindact's approval vote**.

**MVP scope (the six requested features):**
1. Sign up
2. Create issues with title, description, tags
3. Comment on issues
4. See all tags in a sidebar and filter issues by tag
5. Transition an issue to a voting stage — requires ≥ 2 distinct agents to press
6. A simple approval vote that always shows live status (`Voting: Approved` / `Declined` / `Pending` when < 2 voters)

This spec is the umbrella; each phase is a child spec. The full prose plan lives at [`holochain/FORK-PROOFPOLL-PLAN.md`](../../../holochain/FORK-PROOFPOLL-PLAN.md).

## Design

### Key decisions
1. **ProofPoll becomes the Kindact codebase** here in `kindact-pp/`. `holochain/kindact-hc/` is demoted to a reference for the eventual multi-cell/lens port.
2. **Identity = Flowsta = "Sign up".** Sybil resistance is a *feature* for Kindact (fair voting + future currency). Accepting this accepts the Flowsta dependency (Vault app, `client_id` from dev.flowsta.com, the `flowsta-agent-linking` crate in the DNA).
3. **Reset to one DNA version, keep migration machinery.** Collapse ProofPoll's `v1.0–v1.3` into one fresh `kindact_v1_0` (new name + `network_seed` ⇒ clean DHT). Keep `MigratedPoll`/`MigrationIndex` + `migration.rs` dormant so Implementation Status (`v1.1`) and Currency (`v1.2`) become clean additive migrations later.
4. **Approval vote reuses ProofPoll's vote engine** — `Vote { issue_action_hash, approve }`, deduped against the voter's full linked-agent set (`my_identity_agents`) so it counts distinct *humans*.
5. **Stage is derived, not stored** — "Deliberating → Voting" computed from seconding links (≥ 2 distinct humans). `Issue` entry stays immutable.
6. **Single-cell to start.** Multi-cell lenses are a later port from `kindact-hc/`.

### Concept mapping (ProofPoll → Kindact)
| ProofPoll | Kindact | Change |
|---|---|---|
| `Poll { title, description, options[], poll_type, closes_at }` | `Issue { title, description, tags[], created_at }` | replace |
| `Vote { poll_action_hash, option_index, … }` | `Vote { issue_action_hash, approve }` | adapt (keep dedup) |
| `Flag` | keep (optional moderation) | keep |
| — | `Comment { issue_action_hash, content, created_at }` | new |
| — | seconding link `IssueToSeconds` | new |
| `AllPolls` anchor | `AllIssues` + `AllTags` + `TagToIssue` | extend |
| `EncryptedEntry`, `MigratedPoll`, migration, identity, backups | infrastructure | keep verbatim |

## Plan

Each phase is a child spec and leaves a runnable app. MVP is complete at Phase 5.

- [x] **Phase 0** — Fork & rename → [002-fork-rename](../002-fork-rename/README.md)
- [ ] **Phase 1** — Reset to a single Kindact DNA version → [003-single-dna-version](../003-single-dna-version/README.md)
- [ ] **Phase 2** — Issues + comments (replace polls) → [004-issues-and-comments](../004-issues-and-comments/README.md)
- [ ] **Phase 3** — Tag sidebar & filter → [005-tag-sidebar-filter](../005-tag-sidebar-filter/README.md)
- [ ] **Phase 4** — Transition to voting (2-agent seconding) → [006-voting-transition](../006-voting-transition/README.md)
- [ ] **Phase 5** — Approval vote with live status (MVP) → [007-approval-vote-status](../007-approval-vote-status/README.md)

## Test

- [ ] Two signed-in humans complete the end-to-end demo: file an issue with tags, comment, filter by tag, both second it → Voting, then the status badge moves Pending → Approved/Declined live as each votes.
- [ ] `bash build-all.sh && npm install && cargo tauri dev` produces a runnable Kindact desktop app.

## Notes

**Out of scope now** (the migration system makes these clean later):
- Implementation Status + proof of work → DNA `v1.1` (additive; optionally private via `EncryptedEntry`).
- Fake currency distribution → DNA `v1.2` (ledger zome keyed to Flowsta-verified identities).
- Multi-cell lenses / cross-cell discovery → port from `kindact-hc/`.

**Known wrinkles (accepted, resolve when hit):**
- Multi-agent dev loop is harder than `hc-spin` — ProofPoll is one conductor per machine; test 2 agents via two app-data dirs or two machines on the public bootstrap.
- Flowsta `client_id` must be registered before the full sign-up flow works end-to-end.
