---
status: planned
created: 2026-06-06
priority: high
tags:
- zomes
- ui
depends_on:
- '003'
parent: '001'
created_at: 2026-06-06T21:28:57.228996727Z
updated_at: 2026-06-06T21:32:05.386480622Z
---

# Phase 2 — Issues + Comments (replace polls)

> **Status**: planned · **Priority**: high · **Created**: 2026-06-06

## Overview

Phase 2 of [001-proofpoll-fork-mvp](../001-proofpoll-fork-mvp/README.md). Replace ProofPoll's poll data model with Kindact issues + comments, reusing the exact anchor/link/query patterns already in the `polls` zome. Delivers features **#2 (create issues)** and **#3 (comment)**. Tags ride along on the `Issue` entry but the sidebar/filter UI is Phase 3.

## Design

Rename the zome `polls` → `issues` (`dna/v1.0/zomes/issues/{integrity,coordinator}`).

### Entry types (integrity zome)
```rust
#[hdk_entry_helper] #[derive(Clone, PartialEq)]
pub struct Issue { pub title: String, pub description: String,
                   pub tags: Vec<String>, pub created_at: i64 }

#[hdk_entry_helper] #[derive(Clone, PartialEq)]
pub struct Comment { pub issue_action_hash: ActionHash,
                     pub content: String, pub created_at: i64 }

// Repurposed for the Phase 5 approval vote:
#[hdk_entry_helper] #[derive(Clone, PartialEq)]
pub struct Vote { pub issue_action_hash: ActionHash, pub approve: bool }
```
- `EntryTypes`: `Issue`, `Comment`, `Vote`, `Flag`, `MigratedPoll`, `EncryptedEntry`.
- `LinkTypes`: `AllIssues`, `IssueToComment`, `IssueToSeconds`, `IssueToVotes` (+ kept `AllTags`/`TagToIssue` for Phase 3, `MigrationIndex`, `VoteToRationale`, `AgentDrafts`).
- Rename the sentinel-anchor helpers: `all_polls_anchor` → `all_issues_anchor`; keep `migration_anchor`.
- `validate_poll` → `validate_issue` (title non-empty; tags optional). Keep `validate_encrypted_entry` etc. verbatim.

### Coordinator
- `create_poll` → `create_issue` (same `create_entry` + `AllIssues` link shape).
- `get_all_polls` → `get_all_issues`; `get_poll` → `get_issue`; `delete_poll` → `delete_issue` (keep author-only guard).
- **New**: `post_comment(CreateCommentInput)` + `get_comments(issue_action_hash)` — copy the `PollToVotes` link/query pattern into `IssueToComment`.

### Tauri + frontend
- `src-tauri/src/commands.rs`: rename poll/vote commands, add comment commands; register in `src-tauri/src/lib.rs` `invoke_handler![…]`. Add a `match` arm per new entry type in `build_canonical_backup` + `decode_record_for_export`.
- `src/lib/holochain.ts`: replace `Poll*` types/wrappers with `Issue`/`Comment`; keep identity, migration, encrypted-entry wrappers.
- Routes: `src/routes/index.tsx` → issue list; `create/index.tsx` → issue form (title, description, comma-separated tags); `poll/index.tsx` → issue detail with comments + comment box. Keep `layout.tsx` + `identity/index.tsx` (rename labels).

## Plan

- [ ] Rename zome dir `polls` → `issues`; update `dna.yaml` zome names
- [ ] Replace `Poll`→`Issue` (+tags), add `Comment`, repurpose `Vote`; update `EntryTypes`/`LinkTypes`/anchors/validation
- [ ] Coordinator: `create_issue`/`get_all_issues`/`get_issue`/`delete_issue` + `post_comment`/`get_comments`
- [ ] Tauri commands + `invoke_handler` + backup `match` arms
- [ ] `holochain.ts` types/wrappers
- [ ] Issue list / create / detail routes

## Test

- [ ] Create an issue with tags → appears in the list
- [ ] Open the issue, post a comment → shows attributed to your Flowsta display name
- [ ] Author-only `delete_issue` enforced
- [ ] Zome unit test: create issue + comment round-trips via anchor/link queries

## Notes

`Vote` is defined here but only wired up in Phase 5; defining it now keeps the integrity schema stable so Phases 4–5 don't force another DNA-hash change.
